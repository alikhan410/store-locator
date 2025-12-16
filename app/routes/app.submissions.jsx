import {
  Page,
  Layout,
  Card,
  IndexTable,
  Text,
  Button,
  Badge,
  InlineStack,
  EmptyState,
  BlockStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useState, useCallback, useEffect } from "react";
import { useLoaderData, useActionData, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { ApproveRejectSubmissionModal } from "../components/modals";

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const prisma = (await import("../db.server")).default;
  const { checkStoreLimit } = await import("../helper/planLimits");

  // Get subscription information
  const { appSubscriptions } = await billing.check();
  const subscription = appSubscriptions?.[0];

  // Get all submissions for this shop
  const submissions = await prisma.storeSubmission.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });

  // Get current store count and check limits
  const currentStoreCount = await prisma.store.count({
    where: { shop: session.shop },
  });

  const limitCheck = checkStoreLimit(subscription, currentStoreCount);

  // Calculate submission analytics
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const totalSubmissions = submissions.length;
  const pendingSubmissions = submissions.filter(
    (s) => s.status === "PENDING"
  ).length;
  const approvedSubmissions = submissions.filter(
    (s) => s.status === "APPROVED"
  ).length;
  const rejectedSubmissions = submissions.filter(
    (s) => s.status === "REJECTED"
  ).length;
  const recentSubmissions = submissions.filter(
    (s) => new Date(s.createdAt) > oneWeekAgo
  ).length;

  return {
    submissions,
    subscription,
    limitCheck,
    currentStoreCount,
    analytics: {
      total: totalSubmissions,
      pending: pendingSubmissions,
      approved: approvedSubmissions,
      rejected: rejectedSubmissions,
      recent: recentSubmissions,
    },
  };
};

export const action = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const prisma = (await import("../db.server")).default;
  const { checkStoreLimit } = await import("../helper/planLimits");

  const formData = await request.formData();
  const action = formData.get("action");
  const submissionId = formData.get("submissionId");

  if (!submissionId) {
    return { success: false, error: "Submission ID is required." };
  }

  try {
    if (action === "approve") {
      const submission = await prisma.storeSubmission.findUnique({
        where: { id: submissionId, shop: session.shop },
      });

      if (!submission) {
        return { success: false, error: "Submission not found." };
      }

      // Check plan limits before creating the store
      const { appSubscriptions } = await billing.check();
      const subscription = appSubscriptions?.[0];

      const currentStoreCount = await prisma.store.count({
        where: { shop: session.shop },
      });

      const limitCheck = checkStoreLimit(subscription, currentStoreCount);

      if (!limitCheck.canAdd) {
        return {
          success: false,
          error: limitCheck.error || "Cannot approve submission: store limit reached.",
        };
      }

      // Create the store from the submission
      const newStore = await prisma.store.create({
        data: {
          shop: session.shop,
          name: submission.storeName,
          link: submission.website || null,
          address: submission.address,
          address2: submission.address2,
          city: submission.city,
          state: submission.state,
          zip: submission.zip,
          country: submission.country,
          phone: submission.contactPhone,
          notes: submission.notes,
        },
      });

      // Update submission status
      await prisma.storeSubmission.update({
        where: { id: submissionId },
        data: {
          status: "APPROVED",
          adminNotes: formData.get("adminNotes") || null,
        },
      });

      // Send approval notification to Klaviyo
      try {
        await sendKlaviyoNotification(submission, "APPROVED", session.shop);
      } catch (klaviyoError) {
        console.error(
          "Failed to send Klaviyo approval notification:",
          klaviyoError,
        );
      }

      return {
        success: true,
        message: "Store approved and created successfully.",
      };
    } else if (action === "reject") {
      await prisma.storeSubmission.update({
        where: { id: submissionId, shop: session.shop },
        data: {
          status: "REJECTED",
          adminNotes: formData.get("adminNotes") || null,
        },
      });

      // Send rejection notification to Klaviyo
      const submission = await prisma.storeSubmission.findUnique({
        where: { id: submissionId },
      });

      try {
        await sendKlaviyoNotification(submission, "REJECTED", session.shop);
      } catch (klaviyoError) {
        console.error(
          "Failed to send Klaviyo rejection notification:",
          klaviyoError,
        );
      }

      return { success: true, message: "Store submission rejected." };
    }

    return { success: false, error: "Invalid action." };
  } catch (error) {
    console.error("Failed to process submission:", error);
    return { success: false, error: "Failed to process submission." };
  }
};

export async function sendKlaviyoNotification(submission, status, shop) {
  const klaviyoApiKey = process.env.KLAVIYO_PRIVATE_API_KEY;

  if (!klaviyoApiKey) {
    console.log("Klaviyo credentials not configured");
    return;
  }

  const eventData = {
    data: {
      type: "event",
      attributes: {
        properties: {
          "Store Name": submission.storeName,
          "Contact Name": submission.contactName,
          "Contact Email": submission.contactEmail,
          Status: status,
          Shop: shop,
          "Submission ID": submission.id,
        },
        metric: {
          data: {
            type: "metric",
            attributes: {
              name: `Store Submission ${status}`,
              service: "store_locator",
            },
          },
        },
        profile: {
          data: {
            type: "profile",
            attributes: {
              email: submission.contactEmail,
              first_name: submission.contactName?.split(" ")[0] || "",
              last_name:
                submission.contactName?.split(" ").slice(1).join(" ") || "",
              phone_number: submission.contactPhone,
              organization: submission.storeName,
            },
          },
        },
        time: new Date().toISOString(),
        value: 1,
        value_currency: "USD",
        unique_id: `store_submission_${status}_${submission.id}`,
      },
    },
  };

  const response = await fetch("https://a.klaviyo.com/api/events", {
    method: "POST",
    headers: {
      accept: "application/vnd.api+json",
      revision: "2025-07-15",
      "content-type": "application/vnd.api+json",
      Authorization: `Klaviyo-API-Key ${klaviyoApiKey}`,
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    throw new Error(
      `Klaviyo API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export default function Submissions() {
  const {
    submissions,
    subscription,
    limitCheck,
    currentStoreCount,
    analytics,
  } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const shopify = useAppBridge();

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'approve' or 'reject'

  const handleReview = useCallback((submission) => {
    setSelectedSubmission(submission);
    setPendingAction(null);
    setLoading(false);
    shopify.modal.show("approve-reject-submission-modal");
  }, [shopify]);

  const handleModalSubmit = useCallback(
    (adminNotes, actionFromModal) => {
      setPendingAction(actionFromModal);
      setLoading(true);
      const formData = new FormData();
      formData.append("action", actionFromModal);
      formData.append("submissionId", selectedSubmission.id);
      formData.append("adminNotes", adminNotes || "");

      submit(formData, { method: "post" });
      // Don't close modal or reset state here - wait for actionData to update
    },
    [selectedSubmission, submit],
  );

  const handleModalClose = useCallback(() => {
    shopify.modal.hide("approve-reject-submission-modal");
    setSelectedSubmission(null);
    setLoading(false);
    setPendingAction(null);
  }, [shopify]);

  // Feedback when submission is approved/rejected and close modal
  useEffect(() => {
    if (actionData?.success !== undefined && loading) {
      // Action completed - show toast
      if (actionData?.success) {
        shopify.toast.show(actionData.message || "Action completed successfully!");
      } else {
        shopify.toast.show(actionData.error || "Action failed. Please try again.", {
          isError: true,
        });
      }
      // Close modal and reset state after a brief delay
      setTimeout(() => {
        shopify.modal.hide("approve-reject-submission-modal");
        setSelectedSubmission(null);
        setLoading(false);
        setPendingAction(null);
      }, 500);
    }
  }, [actionData, loading, shopify]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return <Badge tone="warning">Pending</Badge>;
      case "APPROVED":
        return <Badge tone="success">Approved</Badge>;
      case "REJECTED":
        return <Badge tone="critical">Rejected</Badge>;
      default:
        return <Badge tone="base">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const resourceName = {
    singular: "submission",
    plural: "submissions",
  };

  const rowMarkup = submissions.map((submission, index) => (
    <IndexTable.Row
      id={submission.id}
      key={submission.id}
      selected={false}
      position={index}
    >
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {submission.storeName}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" as="span">
          {submission.contactName}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" as="span">
          {submission.contactEmail}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" as="span">
          {submission.city}, {submission.state}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{getStatusBadge(submission.status)}</IndexTable.Cell>
      <IndexTable.Cell>
        <Text variant="bodyMd" as="span">
          {formatDate(submission.createdAt)}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        {submission.status === "PENDING" && (
          <InlineStack gap="200">
            <Button
              size="micro"
              variant="primary"
              onClick={() => handleReview(submission)}
            >
              Review
            </Button>
          </InlineStack>
        )}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page>
      <TitleBar title="Store Submissions" />

      <Layout>
        {/* Analytics Cards */}
        <Layout.Section>
          <InlineStack gap="400">
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  Total Submissions
                </Text>
                <Text variant="heading2xl" as="p">
                  {analytics.total}
                </Text>
                <Text variant="bodyMd" color="subdued">
                  {analytics.recent > 0
                    ? `+${analytics.recent} this week`
                    : "No new submissions this week"}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  Pending Review
                </Text>
                <Text variant="heading2xl" as="p" color="warning">
                  {analytics.pending}
                </Text>
                <Text variant="bodyMd" color="subdued">
                  Awaiting approval
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  Approved
                </Text>
                <Text variant="heading2xl" as="p" color="success">
                  {analytics.approved}
                </Text>
                <Text variant="bodyMd" color="subdued">
                  Successfully added
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  Rejected
                </Text>
                <Text variant="heading2xl" as="p" color="critical">
                  {analytics.rejected}
                </Text>
                <Text variant="bodyMd" color="subdued">
                  Declined submissions
                </Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>

        <Layout.Section>
          <Card>
            {submissions.length > 0 ? (
              <IndexTable
                resourceName={resourceName}
                itemCount={submissions.length}
                headings={[
                  { title: "Store Name" },
                  { title: "Contact" },
                  { title: "Email" },
                  { title: "Location" },
                  { title: "Status" },
                  { title: "Submitted" },
                  { title: "Actions" },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
            ) : (
              <EmptyState
                heading="No submissions yet"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>
                  When dealers submit stores through the submission form,
                  they'll appear here for review.
                </p>
              </EmptyState>
            )}
          </Card>
        </Layout.Section>
      </Layout>

      <ApproveRejectSubmissionModal
        onClose={handleModalClose}
        onConfirm={handleModalSubmit}
        submission={selectedSubmission}
        loading={loading}
        pendingAction={pendingAction}
        limitCheck={limitCheck}
        currentStoreCount={currentStoreCount}
      />
    </Page>
  );
}
