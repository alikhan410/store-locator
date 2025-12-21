import React, { useState } from "react";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import {
  Button,
  Text,
  BlockStack,
  Box,
  ChoiceList,
  Divider,
  InlineStack,
  TextField,
} from "@shopify/polaris";

// Export Modal Component
export function ExportModal({
  onClose,
  onExport,
  exportCounts = { current: 0, all: 0, selected: 0, filtered: 0 },
  selectedCount = 0,
  filteredCount = 0,
  canExportSelected = false,
  canExportFiltered = false,
  defaultScope = "current",
  defaultFormat = "excel",
}) {
  const [exportScope, setExportScope] = useState(defaultScope);
  const [exportFormat, setExportFormat] = useState(defaultFormat);

  const exportOptions = [
    {
      label: `Current page`,
      value: "current",
      helpText: exportCounts.current
        ? `${exportCounts.current} products on this page`
        : undefined,
    },
    canExportFiltered && filteredCount > 0
      ? {
          label: `Filtered`,
          value: "filtered",
          helpText: `${filteredCount} matching your search`,
        }
      : null,
    canExportSelected && selectedCount > 0
      ? {
          label: `Selected`,
          value: "selected",
          helpText: `${selectedCount} selected`,
        }
      : null,
    {
      label: `All products`,
      value: "all",
      helpText: exportCounts.all ? `${exportCounts.all} total` : undefined,
    },
  ].filter(Boolean);

  const formatOptions = [
    {
      label: "CSV for Excel, Numbers, or other spreadsheet programs",
      value: "excel",
    },
    {
      label: "Plain CSV file",
      value: "plain",
    },
  ];

  return (
    <Modal id="export-modal" onClose={onClose} variant="large">
      <TitleBar title="Export products" onClose={onClose} />
      <Box padding="400">
        <Text as="p" variant="bodyMd" color="subdued">
          This CSV file can update all product information except for inventory
          quantities. To update inventory quantities at multiple locations, use
          the CSV file for inventory or the bulk editor.
        </Text>
        <Box paddingBlockStart="400">
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm">
              Export
            </Text>
            <ChoiceList
              choices={exportOptions}
              selected={[exportScope]}
              onChange={([val]) => setExportScope(val)}
            />
            <Divider />
            <Text as="h3" variant="headingSm">
              Export as
            </Text>
            <ChoiceList
              choices={formatOptions}
              selected={[exportFormat]}
              onChange={([val]) => setExportFormat(val)}
            />
          </BlockStack>
        </Box>
        <Box paddingBlockStart="400">
          <Text as="span" variant="bodySm" color="subdued">
            Learn more about exporting products
          </Text>
        </Box>
        <Box paddingBlockStart="400">
          <InlineStack gap="400">
            <Button
              primary
              onClick={() => onExport({ exportScope, exportFormat })}
              disabled={exportScope === "selected" && selectedCount === 0}
            >
              Export products
            </Button>
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
          </InlineStack>
        </Box>
      </Box>
    </Modal>
  );
}

// Bulk Delete Modal Component
export function BulkDeleteModal({
  onClose,
  onConfirm,
  selectedCount = 0,
  loading = false,
}) {
  return (
    <Modal id="bulk-delete-modal" onClose={onClose} variant="large">
      <TitleBar title="Delete Stores" onClose={onClose} />
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="bodyMd">
            Are you sure you want to delete {selectedCount} selected store
            {selectedCount !== 1 ? "s" : ""}? This action cannot be undone.
          </Text>
          <Text variant="bodySm" color="subdued">
            This will permanently remove the selected stores from your store
            locator.
          </Text>
        </BlockStack>
        <Box paddingBlockStart="400">
          <InlineStack gap="400">
            <Button
              variant="primary"
              destructive
              tone="critical"
              onClick={onConfirm}
              loading={loading}
            >
              Delete {selectedCount} store{selectedCount !== 1 ? "s" : ""}
            </Button>
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
          </InlineStack>
        </Box>
      </Box>
    </Modal>
  );
}

// Single Store Delete Modal Component
export function DeleteStoreModal({
  onClose,
  onConfirm,
  storeName = "this store",
  loading = false,
}) {
  return (
    <Modal id="delete-store-modal" onClose={onClose} variant="large">
      <TitleBar title="Delete Store" onClose={onClose} />
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="bodyMd">
            Are you sure you want to delete {storeName}? This action cannot be
            undone.
          </Text>
          <Text variant="bodySm" color="subdued">
            This will permanently remove this store from your store locator.
          </Text>
        </BlockStack>
        <Box paddingBlockStart="400">
          <InlineStack gap="400">
            <Button
              variant="primary"
              destructive
              tone="critical"
              onClick={onConfirm}
              loading={loading}
            >
              Delete Store
            </Button>
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
          </InlineStack>
        </Box>
      </Box>
    </Modal>
  );
}

// Save View Modal Component
export function SaveViewModal({
  onClose,
  onSave,
  loading = false,
}) {
  const [viewName, setViewName] = useState("");

  const handleSave = () => {
    if (viewName.trim()) {
      onSave(viewName.trim());
    }
  };

  return (
    <Modal id="save-view-modal" onClose={onClose} variant="small" >
      <TitleBar title="Save Search" onClose={onClose} />
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="bodyMd" tone="subdued">
            Save your current search and filters to quickly access them later. Your team members will also have access to this saved view.
          </Text>
          <TextField
            label="Search name"
            value={viewName}
            onChange={setViewName}
            placeholder="e.g., California stores, Stores needing geocoding"
            autoComplete="off"
            autoFocus
          />
        </BlockStack>
        <Box paddingBlockStart="400">
          <InlineStack gap="400">
            <Button
              variant="primary"
              onClick={handleSave}
              loading={loading}
              disabled={!viewName.trim()}
            >
              Save search
            </Button>
            <Button onClick={onClose} variant="secondary" disabled={loading}>
              Cancel
            </Button>
          </InlineStack>
        </Box>
      </Box>
    </Modal>
  );
}

// Approve/Reject Submission Modal Component
export function ApproveRejectSubmissionModal({
  onClose,
  onConfirm,
  submission = null,
  loading = false,
  pendingAction = null,
  limitCheck = null,
  currentStoreCount = 0,
}) {
  const [adminNotes, setAdminNotes] = useState("");

  const handleApprove = () => {
    onConfirm(adminNotes, "approve");
  };

  const handleReject = () => {
    onConfirm(adminNotes, "reject");
  };

  return (
    <Modal
      id="approve-reject-submission-modal"
      onClose={onClose}
      variant="large" 
    >
      <TitleBar title="Review Store Submission" onClose={onClose} />
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="bodyMd" tone="subdued">
            Review the submission details below. Use{" "}
            <strong>Approve</strong> to create a new store or{" "}
            <strong>Reject</strong> to decline this submission.
          </Text>

          {/* Store Count */}
          {limitCheck && (
            <>
              <Box paddingBlockStart="200">
                <Text variant="bodyMd" as="p">
                  <strong>Store count:</strong> {currentStoreCount}/
                  {limitCheck.limit === "Unlimited" ? "∞" : limitCheck.limit}
                </Text>
              </Box>
              <Divider />
            </>
          )}

          {submission && (
            <Box paddingBlockStart="100">
              <BlockStack gap="400">
                {/* Store Information */}
                <BlockStack gap="200">
                  <Text variant="headingSm" as="h3">
                    Store Information
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>Store Name:</strong> {submission.storeName}
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>Store Type:</strong> {submission.storeType}
                  </Text>
                  {submission.website && (
                    <Text variant="bodyMd" as="p">
                      <strong>Website:</strong>{" "}
                      <a
                        href={submission.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#008060" }}
                      >
                        {submission.website}
                      </a>
                    </Text>
                  )}
                </BlockStack>

                <Divider />

                {/* Contact Information */}
                <BlockStack gap="200">
                  <Text variant="headingSm" as="h3">
                    Contact Information
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>Name:</strong> {submission.contactName}
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>Email:</strong>{" "}
                    <a
                      href={`mailto:${submission.contactEmail}`}
                      style={{ color: "#008060" }}
                    >
                      {submission.contactEmail}
                    </a>
                  </Text>
                  {submission.contactPhone && (
                    <Text variant="bodyMd" as="p">
                      <strong>Phone:</strong>{" "}
                      <a
                        href={`tel:${submission.contactPhone}`}
                        style={{ color: "#008060" }}
                      >
                        {submission.contactPhone}
                      </a>
                    </Text>
                  )}
                </BlockStack>

                <Divider />

                {/* Address Information */}
                <BlockStack gap="200">
                  <Text variant="headingSm" as="h3">
                    Address Information
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>Address:</strong> {submission.address}
                    {submission.address2 && `, ${submission.address2}`}
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>City:</strong> {submission.city}
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>State:</strong> {submission.state}
                  </Text>
                  <Text variant="bodyMd" as="p">
                    <strong>ZIP Code:</strong> {submission.zip}
                  </Text>
                  {submission.country && (
                    <Text variant="bodyMd" as="p">
                      <strong>Country:</strong> {submission.country}
                    </Text>
                  )}
                </BlockStack>

                {/* Additional Notes */}
                {submission.notes && (
                  <>
                    <Divider />
                    <BlockStack gap="200">
                      <Text variant="headingSm" as="h3">
                        Additional Notes
                      </Text>
                      <Text variant="bodyMd" as="p" tone="subdued">
                        {submission.notes}
                      </Text>
                    </BlockStack>
                  </>
                )}

                {/* Submission Metadata */}
                <Divider />
                <BlockStack gap="200">
                  <Text variant="headingSm" as="h3">
                    Submission Details
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    <strong>Submitted:</strong>{" "}
                    {new Date(submission.createdAt).toLocaleString()}
                  </Text>
                  {submission.status && (
                    <Text variant="bodyMd" as="p" tone="subdued">
                      <strong>Status:</strong> {submission.status}
                    </Text>
                  )}
                </BlockStack>
              </BlockStack>
            </Box>
          )}

          {/* Admin Notes - Moved to bottom before buttons */}
          <Box paddingBlockStart="400">
            <TextField
              label="Admin Notes (optional)"
              value={adminNotes}
              onChange={setAdminNotes}
              multiline={3}
              placeholder="Add any notes about this decision..."
            />
          </Box>
        </BlockStack>

        <Box paddingBlockStart="400">
          <InlineStack gap="400">
            <Button
              variant="primary"
              onClick={handleApprove}
              loading={loading && pendingAction === "approve"}
              disabled={loading}
            >
              Approve
            </Button>
            <Button
              variant="tertiary"
              tone="critical"
              onClick={handleReject}
              loading={loading && pendingAction === "reject"}
              disabled={loading}
            >
              Reject
            </Button>
            <Button onClick={onClose} variant="secondary" disabled={loading}>
              Cancel
            </Button>
          </InlineStack>
        </Box>
      </Box>
    </Modal>
  );
}
