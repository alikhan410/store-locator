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
    {
      label: `All products`,
      value: "all",
      helpText: exportCounts.all ? `${exportCounts.all} total` : undefined,
    },
    canExportSelected && selectedCount > 0
      ? {
          label: `Selected`,
          value: "selected",
          helpText: `${selectedCount} selected`,
        }
      : null,
    canExportFiltered && filteredCount > 0
      ? {
          label: `Filtered`,
          value: "filtered",
          helpText: `${filteredCount} matching your search`,
        }
      : null,
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
    <Modal id="export-modal" variant="max" onClose={onClose} large>
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
    <Modal id="bulk-delete-modal" onClose={onClose} large>
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
    <Modal id="delete-store-modal" onClose={onClose} large>
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
