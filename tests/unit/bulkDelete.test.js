import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createRemixStub } from '@remix-run/testing';
import { json } from '@remix-run/node';

// Mock the entire view-stores module
vi.mock('../../app/routes/app.view-stores.jsx', async () => {
  const actual = await vi.importActual('../../app/routes/app.view-stores.jsx');
  return {
    ...actual,
    default: vi.fn(() => <div data-testid="stores-page">Stores Page</div>),
  };
});

// Mock dependencies
vi.mock('../../app/shopify.server', () => ({
  authenticate: {
    admin: vi.fn(),
  },
}));

vi.mock('../../app/db.server', () => ({
  default: {
    store: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('@shopify/polaris', async () => {
  const actual = await vi.importActual('@shopify/polaris');
  return {
    ...actual,
    useIndexResourceState: vi.fn(() => ({
      selectedResources: [],
      allResourcesSelected: false,
      handleSelectionChange: vi.fn(),
    })),
  };
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});

// Mock shopify global object
global.shopify = {
  modal: {
    show: vi.fn(),
    hide: vi.fn(),
  },
  toast: {
    show: vi.fn(),
  },
};

describe('Bulk Delete Functionality', () => {
  const mockSession = {
    shop: 'test-shop.myshopify.com',
  };

  const mockStores = [
    {
      id: '1',
      name: 'Store 1',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      lat: 40.7128,
      lng: -74.0060,
      phone: '555-1234',
      shop: 'test-shop.myshopify.com',
    },
    {
      id: '2',
      name: 'Store 2',
      address: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      lat: 34.0522,
      lng: -118.2437,
      phone: '555-5678',
      shop: 'test-shop.myshopify.com',
    },
    {
      id: '3',
      name: 'Store 3',
      address: '789 Pine St',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      lat: 41.8781,
      lng: -87.6298,
      phone: '555-9012',
      shop: 'test-shop.myshopify.com',
    },
  ];

  const mockSubscription = {
    id: 'sub_123',
    name: 'Basic',
    status: 'ACTIVE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Bulk Delete Action Tests', () => {
    it('should successfully delete multiple stores', async () => {
      const { action } = await import('../../app/routes/app.view-stores.jsx');
      const { authenticate } = await import('../../app/shopify.server');
      const { default: db } = await import('../../app/db.server');

      // Mock authentication
      authenticate.admin.mockResolvedValue({
        session: mockSession,
        billing: {
          check: vi.fn().mockResolvedValue({
            appSubscriptions: [mockSubscription],
          }),
        },
      });

      // Mock database operation
      db.store.deleteMany.mockResolvedValue({ count: 2 });

      const formData = new FormData();
      formData.append('action', 'bulk_delete');
      formData.append('storeIds', '1');
      formData.append('storeIds', '2');

      const request = new Request('http://localhost:3000/app/view-stores', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request });

      expect(result).toEqual({
        success: true,
        message: 'Successfully deleted 2 stores',
        deletedCount: 2,
      });

      expect(db.store.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['1', '2'] },
          shop: mockSession.shop,
        },
      });
    });

    it('should handle empty store selection', async () => {
      const { action } = await import('../../app/routes/app.view-stores.jsx');

      const formData = new FormData();
      formData.append('action', 'bulk_delete');

      const request = new Request('http://localhost:3000/app/view-stores', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request });

      expect(result).toEqual({
        success: false,
        error: 'No stores selected for deletion',
      });
    });

    it('should handle database errors gracefully', async () => {
      const { action } = await import('../../app/routes/app.view-stores.jsx');
      const { authenticate } = await import('../../app/shopify.server');
      const { default: db } = await import('../../app/db.server');

      // Mock authentication
      authenticate.admin.mockResolvedValue({
        session: mockSession,
        billing: {
          check: vi.fn().mockResolvedValue({
            appSubscriptions: [mockSubscription],
          }),
        },
      });

      // Mock database error
      db.store.deleteMany.mockRejectedValue(new Error('Database connection failed'));

      const formData = new FormData();
      formData.append('action', 'bulk_delete');
      formData.append('storeIds', '1');

      const request = new Request('http://localhost:3000/app/view-stores', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request });

      expect(result).toEqual({
        success: false,
        error: 'Failed to delete stores',
      });
    });

    it('should handle invalid action types', async () => {
      const { action } = await import('../../app/routes/app.view-stores.jsx');

      const formData = new FormData();
      formData.append('action', 'invalid_action');

      const request = new Request('http://localhost:3000/app/view-stores', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request });

      expect(result).toEqual({
        success: false,
        error: 'Invalid action',
      });
    });

    it('should handle large batch deletions', async () => {
      const { action } = await import('../../app/routes/app.view-stores.jsx');
      const { authenticate } = await import('../../app/shopify.server');
      const { default: db } = await import('../../app/db.server');

      // Mock authentication
      authenticate.admin.mockResolvedValue({
        session: mockSession,
        billing: {
          check: vi.fn().mockResolvedValue({
            appSubscriptions: [mockSubscription],
          }),
        },
      });

      // Mock database operation for large batch
      db.store.deleteMany.mockResolvedValue({ count: 50 });

      const formData = new FormData();
      formData.append('action', 'bulk_delete');
      
      // Add 50 store IDs
      for (let i = 1; i <= 50; i++) {
        formData.append('storeIds', i.toString());
      }

      const request = new Request('http://localhost:3000/app/view-stores', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request });

      expect(result).toEqual({
        success: true,
        message: 'Successfully deleted 50 stores',
        deletedCount: 50,
      });

      // Verify the correct store IDs were passed
      const expectedIds = Array.from({ length: 50 }, (_, i) => (i + 1).toString());
      expect(db.store.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: expectedIds },
          shop: mockSession.shop,
        },
      });
    });

    it('should handle partial deletions when some stores don\'t exist', async () => {
      const { action } = await import('../../app/routes/app.view-stores.jsx');
      const { authenticate } = await import('../../app/shopify.server');
      const { default: db } = await import('../../app/db.server');

      // Mock authentication
      authenticate.admin.mockResolvedValue({
        session: mockSession,
        billing: {
          check: vi.fn().mockResolvedValue({
            appSubscriptions: [mockSubscription],
          }),
        },
      });

      // Mock database operation - only 2 out of 4 stores exist
      db.store.deleteMany.mockResolvedValue({ count: 2 });

      const formData = new FormData();
      formData.append('action', 'bulk_delete');
      formData.append('storeIds', '1');
      formData.append('storeIds', '2');
      formData.append('storeIds', '999'); // Non-existent store
      formData.append('storeIds', '1000'); // Non-existent store

      const request = new Request('http://localhost:3000/app/view-stores', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request });

      expect(result).toEqual({
        success: true,
        message: 'Successfully deleted 2 stores',
        deletedCount: 2,
      });
    });

    it('should handle authentication failures', async () => {
      const { action } = await import('../../app/routes/app.view-stores.jsx');
      const { authenticate } = await import('../../app/shopify.server');

      // Mock authentication failure
      authenticate.admin.mockRejectedValue(new Error('Authentication failed'));

      const formData = new FormData();
      formData.append('action', 'bulk_delete');
      formData.append('storeIds', '1');

      const request = new Request('http://localhost:3000/app/view-stores', {
        method: 'POST',
        body: formData,
      });

      await expect(action({ request })).rejects.toThrow('Authentication failed');
    });
  });

  describe('Security Tests', () => {
    it('should only delete stores belonging to the authenticated shop', async () => {
      const { action } = await import('../../app/routes/app.view-stores.jsx');
      const { authenticate } = await import('../../app/shopify.server');
      const { default: db } = await import('../../app/db.server');

      // Mock authentication with specific shop
      authenticate.admin.mockResolvedValue({
        session: { shop: 'specific-shop.myshopify.com' },
        billing: {
          check: vi.fn().mockResolvedValue({
            appSubscriptions: [mockSubscription],
          }),
        },
      });

      db.store.deleteMany.mockResolvedValue({ count: 1 });

      const formData = new FormData();
      formData.append('action', 'bulk_delete');
      formData.append('storeIds', '1');

      const request = new Request('http://localhost:3000/app/view-stores', {
        method: 'POST',
        body: formData,
      });

      await action({ request });

      // Verify that the shop filter is applied
      expect(db.store.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['1'] },
          shop: 'specific-shop.myshopify.com',
        },
      });
    });

    it('should prevent cross-shop store deletion', async () => {
      const { action } = await import('../../app/routes/app.view-stores.jsx');
      const { authenticate } = await import('../../app/shopify.server');
      const { default: db } = await import('../../app/db.server');

      // Mock authentication
      authenticate.admin.mockResolvedValue({
        session: { shop: 'shop-a.myshopify.com' },
        billing: {
          check: vi.fn().mockResolvedValue({
            appSubscriptions: [mockSubscription],
          }),
        },
      });

      // Mock database operation - no stores deleted because they belong to different shop
      db.store.deleteMany.mockResolvedValue({ count: 0 });

      const formData = new FormData();
      formData.append('action', 'bulk_delete');
      formData.append('storeIds', '999'); // Store from different shop

      const request = new Request('http://localhost:3000/app/view-stores', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request });

      expect(result).toEqual({
        success: true,
        message: 'Successfully deleted 0 stores',
        deletedCount: 0,
      });

      // Verify shop filter was applied
      expect(db.store.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['999'] },
          shop: 'shop-a.myshopify.com',
        },
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed store IDs', async () => {
      const { action } = await import('../../app/routes/app.view-stores.jsx');
      const { authenticate } = await import('../../app/shopify.server');
      const { default: db } = await import('../../app/db.server');

      // Mock authentication
      authenticate.admin.mockResolvedValue({
        session: mockSession,
        billing: {
          check: vi.fn().mockResolvedValue({
            appSubscriptions: [mockSubscription],
          }),
        },
      });

      db.store.deleteMany.mockResolvedValue({ count: 0 });

      const formData = new FormData();
      formData.append('action', 'bulk_delete');
      formData.append('storeIds', 'invalid-id');
      formData.append('storeIds', '');
      formData.append('storeIds', 'null');
      formData.append('storeIds', 'undefined');

      const request = new Request('http://localhost:3000/app/view-stores', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request });

      expect(result).toEqual({
        success: true,
        message: 'Successfully deleted 0 stores',
        deletedCount: 0,
      });
    });

    it('should handle duplicate store IDs', async () => {
      const { action } = await import('../../app/routes/app.view-stores.jsx');
      const { authenticate } = await import('../../app/shopify.server');
      const { default: db } = await import('../../app/db.server');

      // Mock authentication
      authenticate.admin.mockResolvedValue({
        session: mockSession,
        billing: {
          check: vi.fn().mockResolvedValue({
            appSubscriptions: [mockSubscription],
          }),
        },
      });

      db.store.deleteMany.mockResolvedValue({ count: 1 });

      const formData = new FormData();
      formData.append('action', 'bulk_delete');
      formData.append('storeIds', '1');
      formData.append('storeIds', '1'); // Duplicate
      formData.append('storeIds', '1'); // Another duplicate

      const request = new Request('http://localhost:3000/app/view-stores', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request });

      expect(result).toEqual({
        success: true,
        message: 'Successfully deleted 1 stores',
        deletedCount: 1,
      });

      // Verify that the database was called with unique IDs
      expect(db.store.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['1', '1', '1'] }, // FormData preserves duplicates
          shop: mockSession.shop,
        },
      });
    });

    it('should handle very large store ID arrays', async () => {
      const { action } = await import('../../app/routes/app.view-stores.jsx');
      const { authenticate } = await import('../../app/shopify.server');
      const { default: db } = await import('../../app/db.server');

      // Mock authentication
      authenticate.admin.mockResolvedValue({
        session: mockSession,
        billing: {
          check: vi.fn().mockResolvedValue({
            appSubscriptions: [mockSubscription],
          }),
        },
      });

      db.store.deleteMany.mockResolvedValue({ count: 1000 });

      const formData = new FormData();
      formData.append('action', 'bulk_delete');
      
      // Add 1000 store IDs
      for (let i = 1; i <= 1000; i++) {
        formData.append('storeIds', i.toString());
      }

      const request = new Request('http://localhost:3000/app/view-stores', {
        method: 'POST',
        body: formData,
      });

      const result = await action({ request });

      expect(result).toEqual({
        success: true,
        message: 'Successfully deleted 1000 stores',
        deletedCount: 1000,
      });

      // Verify the database was called with all IDs
      const expectedIds = Array.from({ length: 1000 }, (_, i) => (i + 1).toString());
      expect(db.store.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: expectedIds },
          shop: mockSession.shop,
        },
      });
    });
  });
}); 