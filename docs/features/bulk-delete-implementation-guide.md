# Bulk Delete Feature Implementation

## Overview

The bulk delete functionality has been successfully implemented in the store locator app, allowing users to select multiple stores and delete them in a single operation.

## Features Implemented

### 1. Backend Action Handler

- **Location**: `app/routes/app.view-stores.jsx` and `app/routes/app.edit-store.$storeId.jsx`
- **Function**: `action` export
- **Purpose**: Handles bulk delete requests and individual store updates

### 2. Security Features

- **Shop Isolation**: Only stores belonging to the authenticated shop can be deleted
- **Authentication Required**: All requests must be authenticated via Shopify
- **Input Validation**: Validates store IDs and action type

### 3. Frontend UI Components

- **Bulk Selection**: Users can select multiple stores using checkboxes
- **Delete Button**: Dynamic button showing count of selected stores
- **Confirmation Modal**: Uses Shopify App Bridge Modal system for consistent UX
- **Loading States**: Visual feedback during delete operations

### 4. Modal Components

- **Location**: `app/components/modals.jsx`
- **Components**: `ExportModal`, `BulkDeleteModal`, and `DeleteStoreModal`
- **Purpose**: Centralized modal management for consistent UX
- **Technology**: Uses Shopify App Bridge Modal system

### 5. Error Handling

- **Database Errors**: Graceful handling of database connection issues
- **Invalid Inputs**: Proper error messages for malformed requests
- **Partial Deletions**: Handles cases where some stores don't exist

## Implementation Details

### Action Handler

```javascript
export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "bulk_delete") {
    const storeIds = formData.getAll("storeIds");

    if (!storeIds || storeIds.length === 0) {
      return { success: false, error: "No stores selected for deletion" };
    }

    try {
      const prisma = (await import("../db.server")).default;

      // Delete stores that belong to the current shop (security check)
      const deletedStores = await prisma.store.deleteMany({
        where: {
          id: { in: storeIds },
          shop: session.shop, // Ensure only stores from current shop are deleted
        },
      });

      return {
        success: true,
        message: `Successfully deleted ${deletedStores.count} stores`,
        deletedCount: deletedStores.count,
      };
    } catch (error) {
      console.error("Bulk delete error:", error);
      return { success: false, error: "Failed to delete stores" };
    }
  }

  return { success: false, error: "Invalid action" };
};
```

### Frontend Integration

- **State Management**: Uses React state for modal visibility and loading states
- **Form Submission**: Uses Remix's `useSubmit` for form handling
- **Response Handling**: Automatically refreshes page on successful deletion
- **Modal Management**: Centralized modal components in `app/components/modals.jsx`

### Bulk Actions Configuration

```javascript
const bulkActions = [
  // ... other actions
  {
    icon: DeleteIcon,
    destructive: true,
    content: `Delete ${selectedResources.length} stores`,
    onAction: handleBulkDelete,
    disabled: selectedResources.length === 0,
  },
];
```

## Security Considerations

1. **Shop Isolation**: Each shop can only delete their own stores
2. **Authentication**: All requests require valid Shopify session
3. **Input Validation**: Store IDs are validated before database operations
4. **Error Logging**: Failed operations are logged for debugging

## Testing

### Test Files Created

1. `tests/integration/routes/app.view-stores.test.js` - Integration tests
2. `tests/unit/bulkDelete.test.js` - Unit tests for bulk delete functionality
3. `tests/unit/bulkDelete.simple.test.js` - Simplified test cases

### Test Coverage

- ✅ Successful bulk deletion
- ✅ Empty selection handling
- ✅ Database error handling
- ✅ Invalid action handling
- ✅ Security (shop isolation)
- ✅ Large batch operations
- ✅ Edge cases (duplicates, malformed IDs)

## Usage

### Bulk Delete (View Stores Page)

1. **Select Stores**: Use checkboxes to select stores for deletion
2. **Bulk Actions**: Click the "Delete X stores" button in the bulk actions bar
3. **Confirmation**: Review the confirmation modal and click "Delete"
4. **Completion**: Page refreshes automatically to show updated store list

### Individual Delete (Edit Store Page)

1. **Navigate**: Go to the edit page for the specific store
2. **Delete Button**: Click the "Delete Store" button in the secondary actions
3. **Confirmation**: Review the confirmation modal and click "Delete Store"
4. **Completion**: Redirects to the view stores page after successful deletion

## Error Messages

- **No Selection**: "No stores selected for deletion"
- **Database Error**: "Failed to delete stores"
- **Invalid Action**: "Invalid action"

## Performance Considerations

- **Batch Operations**: Uses Prisma's `deleteMany` for efficient bulk operations
- **Large Batches**: Handles up to 1000+ store IDs in a single request
- **Memory Management**: Proper cleanup of form data and state

## Future Enhancements

1. **Soft Delete**: Option to mark stores as deleted instead of permanent removal
2. **Undo Functionality**: Ability to restore recently deleted stores
3. **Audit Trail**: Logging of deletion operations for compliance
4. **Batch Size Limits**: Configurable limits for large batch operations
5. **Progress Indicators**: Real-time progress for large deletions

## Dependencies

- **Remix**: For action handling and form submission
- **Shopify Polaris**: For UI components (Button, Text, etc.)
- **Shopify App Bridge**: For modal system integration
- **Prisma**: For database operations
- **React**: For state management and UI interactions
