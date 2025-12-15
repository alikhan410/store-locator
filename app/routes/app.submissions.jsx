import {
  Page,
  Layout,
  Card,
  IndexTable,
  Text,
  Button,
  Badge,
  InlineStack,
  Modal,
  TextField,
  Select,
  Banner,
  Box,
  EmptyState,
  Spinner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useState, useCallback, useEffect } from "react";
import { useLoaderData, useActionData, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const prisma = (await import("../db.server")).default;

  // Get subscription information
  const { appSubscriptions } = await billing.check();
  const subscription = appSubscriptions?.[0];

  // Get all submissions for this shop
  const submissions = await prisma.storeSubmission.findMany({
    where: { shop: session.shop },
    orderBy: { createdAt: "desc" },
  });

  return {
    submissions,
    subscription,
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
          reviewedBy: session.shop,
          reviewedAt: new Date(),
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
          reviewedBy: session.shop,
          reviewedAt: new Date(),
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
  const { submissions, subscription } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();

  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const handleApprove = useCallback((submission) => {
    setSelectedSubmission(submission);
    setModalAction("approve");
    setShowModal(true);
  }, []);

  const handleReject = useCallback((submission) => {
    setSelectedSubmission(submission);
    setModalAction("reject");
    setShowModal(true);
  }, []);

  const handleModalSubmit = useCallback(() => {
    const formData = new FormData();
    formData.append("action", modalAction);
    formData.append("submissionId", selectedSubmission.id);
    formData.append("adminNotes", adminNotes);

    submit(formData, { method: "post" });
    setShowModal(false);
    setSelectedSubmission(null);
    setAdminNotes("");
  }, [modalAction, selectedSubmission, adminNotes, submit]);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setSelectedSubmission(null);
    setAdminNotes("");
  }, []);

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
              onClick={() => handleApprove(submission)}
            >
              Approve
            </Button>
            <Button
              size="micro"
              variant="critical"
              onClick={() => handleReject(submission)}
            >
              Reject
            </Button>
          </InlineStack>
        )}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page title="Store Submissions">
      <TitleBar title="Store Submissions" />

      {actionData?.success && (
        <Banner title="Success" tone="success">
          <p>{actionData.message}</p>
        </Banner>
      )}

      {actionData?.success === false && (
        <Banner title="Error" tone="critical">
          <p>{actionData.error}</p>
        </Banner>
      )}

      <Layout>
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

      <Modal
        open={showModal}
        onClose={handleModalClose}
        title={`${modalAction === "approve" ? "Approve" : "Reject"} Store Submission`}
        primaryAction={{
          content: modalAction === "approve" ? "Approve" : "Reject",
          onAction: handleModalSubmit,
          destructive: modalAction === "reject",
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleModalClose,
          },
        ]}
      >
        <Modal.Section>
          <Text variant="bodyMd" as="p">
            {modalAction === "approve"
              ? "This will create a new store from the submission and approve it."
              : "This will reject the submission. The submitter will be notified."}
          </Text>

          <Box paddingBlockStart="400">
            <TextField
              label="Admin Notes (optional)"
              value={adminNotes}
              onChange={setAdminNotes}
              multiline={3}
              placeholder="Add any notes about this decision..."
            />
          </Box>

          {selectedSubmission && (
            <Box paddingBlockStart="400">
              <Text variant="headingSm" as="h3">
                Submission Details
              </Text>
              <Text variant="bodyMd" as="p">
                <strong>Store:</strong> {selectedSubmission.storeName}
              </Text>
              <Text variant="bodyMd" as="p">
                <strong>Contact:</strong> {selectedSubmission.contactName} (
                {selectedSubmission.contactEmail})
              </Text>
              <Text variant="bodyMd" as="p">
                <strong>Address:</strong> {selectedSubmission.address},{" "}
                {selectedSubmission.city}, {selectedSubmission.state}{" "}
                {selectedSubmission.zip}
              </Text>
            </Box>
          )}
        </Modal.Section>
      </Modal>
    </Page>
  );
}
