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
  Spinner,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useState, useCallback, useEffect } from "react";
import { useLoaderData, useActionData, useSubmit, useRevalidator } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { ApproveRejectSubmissionModal } from "../components/modals";
import { sendSubmissionApprovedEmail, sendSubmissionRejectedEmail } from "../helper/emailManager.js";

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

      // Geocode address if lat/lng not provided
      let lat = submission.lat;
      let lng = submission.lng;
      
      if (!lat || !lng) {
        const { generateCoords } = await import("../helper/fetchCoords");
        try {
          const coords = await generateCoords(
            submission.address,
            submission.state,
            submission.city,
            submission.zip
          );
          if (coords?.latitude && coords?.longitude) {
            lat = coords.latitude;
            lng = coords.longitude;
          }
        } catch (geocodeError) {
          console.error("Geocoding failed for submission:", geocodeError);
          // Continue without coordinates
        }
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
          lat: lat || null,
          lng: lng || null,
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

      // Fetch updated submission to include adminNotes in email
      const updatedSubmission = await prisma.storeSubmission.findUnique({
        where: { id: submissionId },
      });

      // Send approval notification emails
      try {
        await sendSubmissionApprovedEmail(updatedSubmission, session.shop);
      } catch (emailError) {
        console.error(
          "Failed to send approval notification emails:",
          emailError,
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

      // Send rejection notification emails
      const submission = await prisma.storeSubmission.findUnique({
        where: { id: submissionId },
      });

      try {
        await sendSubmissionRejectedEmail(submission, session.shop);
      } catch (emailError) {
        console.error(
          "Failed to send rejection notification emails:",
          emailError,
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

// Email notification functions moved to helper/emailManager.js
// No longer using Klaviyo - now using Email Manager with SendGrid

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
  const revalidator = useRevalidator();
  const shopify = useAppBridge();

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'approve' or 'reject'
  const [isMounted, setIsMounted] = useState(false);
  const [dismissed, setDismissed] = useState({
    submissionFormBlock: false,
  });
  const [expanded, setExpanded] = useState({
    submissionFormBlock: false,
  });

  // Ensure we're on the client before rendering Polaris components
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load dismissed sections from localStorage on mount
  useEffect(() => {
    if (!isMounted) return;
    const stored = localStorage.getItem('submissions_dismissed');
    if (stored) {
      setDismissed(JSON.parse(stored));
    }
  }, [isMounted]);

  // Save dismissed state to localStorage
  const handleDismiss = (section) => {
    const newDismissed = { ...dismissed, [section]: true };
    setDismissed(newDismissed);
    localStorage.setItem('submissions_dismissed', JSON.stringify(newDismissed));
  };

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
        // Revalidate to refresh the submissions list
        revalidator.revalidate();
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
  }, [actionData, loading, shopify, revalidator]);

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
          <s-query-container>
            <s-grid gridTemplateColumns="@container (inline-size <= 480px) 1fr, 'repeat(4, 1fr)'" gap="base">
            {/* Total Submissions Card */}
            <s-box background="base" border="base" borderRadius="base" padding="base">
              <s-stack direction="block" gap="small-200">
                <s-stack direction="inline" alignItems="center" justifyContent="space-between">
                  <s-heading>Total Submissions</s-heading>
                </s-stack>
                <s-text variant="heading2xl">
                  {analytics.total}
                </s-text>
                <s-text color="subdued">
                  {analytics.recent > 0
                    ? `+${analytics.recent} this week`
                    : "No new submissions this week"}
                </s-text>
              </s-stack>
            </s-box>

            {/* Pending Review Card */}
            <s-box background="base" border="base" borderRadius="base" padding="base">
              <s-stack direction="block" gap="small-200">
                <s-stack direction="inline" alignItems="center" justifyContent="space-between">
                  <s-heading>Pending Review</s-heading>
                </s-stack>
                <s-text variant="heading2xl" tone="warning">
                  {analytics.pending}
                </s-text>
                <s-text color="subdued">
                  Awaiting approval
                </s-text>
              </s-stack>
            </s-box>

            {/* Approved Card */}
            <s-box background="base" border="base" borderRadius="base" padding="base">
              <s-stack direction="block" gap="small-200">
                <s-stack direction="inline" alignItems="center" justifyContent="space-between">
                  <s-heading>Approved</s-heading>
                </s-stack>
                <s-text variant="heading2xl" tone="success">
                  {analytics.approved}
                </s-text>
                <s-text color="subdued">
                  Successfully added
                </s-text>
              </s-stack>
            </s-box>

            {/* Rejected Card */}
            <s-box background="base" border="base" borderRadius="base" padding="base">
              <s-stack direction="block" gap="small-200">
                <s-stack direction="inline" alignItems="center" justifyContent="space-between">
                  <s-heading>Rejected</s-heading>
                </s-stack>
                <s-text variant="heading2xl" tone="critical">
                  {analytics.rejected}
                </s-text>
                <s-text color="subdued">
                  Declined submissions
                </s-text>
              </s-stack>
            </s-box>
          </s-grid>
          </s-query-container>
        </Layout.Section>

        {/* Submission Form Block Setup Section */}
        {!dismissed.submissionFormBlock && (
          <Layout.Section>
            <s-section>
              <s-grid gap="base">
                <s-grid gap="small-200">
                  <s-grid
                    gridTemplateColumns="1fr auto auto"
                    gap="small-300"
                    alignItems="center"
                  >
                    <s-heading>Enable the submission form block</s-heading>
                    <s-button
                      accessibilityLabel="Dismiss Guide"
                      onClick={() => handleDismiss('submissionFormBlock')}
                      variant="tertiary"
                      tone="neutral"
                      icon="x"
                    />
                    <s-button
                      accessibilityLabel="Toggle setup guide"
                      onClick={() => setExpanded({ ...expanded, submissionFormBlock: !expanded.submissionFormBlock })}
                      variant="tertiary"
                      tone="neutral"
                      icon={expanded.submissionFormBlock ? "chevron-up" : "chevron-down"}
                    />
                  </s-grid>
                  <s-paragraph>
                    Add the dealer submission form block to your theme so dealers can submit store locations directly from your storefront.
                  </s-paragraph>
                </s-grid>
                {expanded.submissionFormBlock && (
                  <s-box borderRadius="base" border="base" background="base">
                    <s-box padding="small">
                      <s-text fontWeight="medium">1. Click "Go to Theme Editor" below to open your theme customization</s-text>
                    </s-box>
                    <s-divider />
                    <s-box padding="small">
                      <s-text fontWeight="medium">2. Navigate to the page where you want to add the form (or create a new page)</s-text>
                    </s-box>
                    <s-divider />
                    <s-box padding="small">
                      <s-text fontWeight="medium">3. In the left sidebar, click "Add block" or "Add section"</s-text>
                    </s-box>
                    <s-divider />
                    <s-box padding="small">
                      <s-text fontWeight="medium">4. Find "Storetrail" in the Apps section and select "Dealer Submission Form"</s-text>
                    </s-box>
                    <s-divider />
                    <s-box padding="small">
                      <s-text fontWeight="medium">5. Configure your Google Maps API key in the block settings</s-text>
                    </s-box>
                    <s-divider />
                    <s-box padding="small">
                      <s-text fontWeight="medium">6. Save your changes and publish your theme</s-text>
                    </s-box>
                    <s-box padding="small" paddingBlockStart="base">
                      <s-button onClick={() => window.open('shopify://admin/themes', '_top')}>
                        Go to Theme Editor
                      </s-button>
                    </s-box>
                  </s-box>
                )}
              </s-grid>
            </s-section>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            {!isMounted ? (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <Spinner accessibilityLabel="Loading submissions..." size="large" />
              </div>
            ) : submissions.length > 0 ? (
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
