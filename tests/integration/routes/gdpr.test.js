import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the shopify.server module
vi.mock('../../../app/shopify.server', () => ({
  default: {},
  authenticate: {
    admin: vi.fn(),
  },
}));

// Mock the Prisma client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    store: {
      count: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  })),
}));

// Create a simple request mock since createRequest is not available
const createRequest = (url, options = {}) => {
  // For FormData, don't set Content-Type - let the browser handle it
  if (options.body && options.body instanceof FormData) {
    const { body, ...otherOptions } = options;
    return new Request(url, {
      ...otherOptions,
      body,
    });
  }
  return new Request(url, options);
};

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

describe('GDPR Route Integration Tests', () => {
  const testShop = 'test-shop.myshopify.com';

  beforeEach(async () => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe('Loader', () => {
    it('should return store count and shop information', async () => {
      // Create test stores in the database
      await prisma.store.createMany({
        data: [
          {
            name: 'Test Store 1',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'United States',
            shop: testShop,
          },
          {
            name: 'Test Store 2',
            address: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zip: '90210',
            country: 'United States',
            shop: testShop,
          },
        ],
      });

      // Create a mock request with session
      const request = createRequest('http://localhost:3000/app/gdpr');

      // Import the loader function
      const { loader } = await import('../../../app/routes/app.gdpr.jsx');

      // Set up the mock for this test
      const { authenticate } = await import('../../../app/shopify.server');
      authenticate.admin.mockResolvedValue({
        session: { shop: testShop },
      });

      // Call the loader
      const result = await loader({ request });

      // Assertions
      expect(result).toEqual({
        storeCount: 2,
        shop: testShop,
      });
    });

    it('should handle zero stores', async () => {
      // Ensure no stores exist for this shop
      await prisma.store.deleteMany({
        where: { shop: testShop },
      });

      const request = createRequest('http://localhost:3000/app/gdpr');
      const { loader } = await import('../../../app/routes/app.gdpr.jsx');

      // Set up the mock for this test
      const { authenticate } = await import('../../../app/shopify.server');
      authenticate.admin.mockResolvedValue({
        session: { shop: testShop },
      });

      const result = await loader({ request });

      expect(result).toEqual({
        storeCount: 0,
        shop: testShop,
      });
    });
  });

  describe('Action - Export', () => {
    it('should export store data successfully', async () => {
      // Create test stores in the database
      const testStores = await prisma.store.createMany({
        data: [
          {
            name: 'Test Store 1',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'United States',
            shop: testShop,
          },
          {
            name: 'Test Store 2',
            address: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zip: '90210',
            country: 'United States',
            shop: testShop,
          },
        ],
      });

      const formData = new URLSearchParams();
      formData.append('action', 'export');

      const request = createRequest('http://localhost:3000/app/gdpr', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { action } = await import('../../../app/routes/app.gdpr.jsx');

      // Set up the mock for this test
      const { authenticate } = await import('../../../app/shopify.server');
      authenticate.admin.mockResolvedValue({
        session: { shop: testShop },
      });

      const result = await action({ request });

      const responseData = await result.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(2);
      expect(responseData.data[0].name).toBe('Test Store 1');
      expect(responseData.data[1].name).toBe('Test Store 2');
      expect(responseData.message).toBe('Data export completed successfully');
    });
  });

  describe('Action - Delete', () => {
    it('should delete store data successfully', async () => {
      // Create test stores in the database
      await prisma.store.createMany({
        data: [
          {
            name: 'Test Store 1',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'United States',
            shop: testShop,
          },
          {
            name: 'Test Store 2',
            address: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zip: '90210',
            country: 'United States',
            shop: testShop,
          },
          {
            name: 'Test Store 3',
            address: '789 Pine St',
            city: 'Chicago',
            state: 'IL',
            zip: '60601',
            country: 'United States',
            shop: testShop,
          },
        ],
      });

      // Verify stores exist before deletion
      const storesBefore = await prisma.store.count({
        where: { shop: testShop },
      });
      expect(storesBefore).toBe(3);

      const formData = new URLSearchParams();
      formData.append('action', 'delete');

      const request = createRequest('http://localhost:3000/app/gdpr', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { action } = await import('../../../app/routes/app.gdpr.jsx');

      // Set up the mock for this test
      const { authenticate } = await import('../../../app/shopify.server');
      authenticate.admin.mockResolvedValue({
        session: { shop: testShop },
      });

      const result = await action({ request });

      const responseData = await result.json();
      expect(responseData.success).toBe(true);
      expect(responseData.deletedCount).toBe(3);
      expect(responseData.message).toBe('Successfully deleted 3 stores');

      // Verify stores were actually deleted
      const storesAfter = await prisma.store.count({
        where: { shop: testShop },
      });
      expect(storesAfter).toBe(0);
    });

    it('should handle deletion of zero stores', async () => {
      // Ensure no stores exist
      await prisma.store.deleteMany({
        where: { shop: testShop },
      });

      const formData = new URLSearchParams();
      formData.append('action', 'delete');

      const request = createRequest('http://localhost:3000/app/gdpr', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { action } = await import('../../../app/routes/app.gdpr.jsx');

      // Set up the mock for this test
      const { authenticate } = await import('../../../app/shopify.server');
      authenticate.admin.mockResolvedValue({
        session: { shop: testShop },
      });

      const result = await action({ request });

      const responseData = await result.json();
      expect(responseData.success).toBe(true);
      expect(responseData.deletedCount).toBe(0);
      expect(responseData.message).toBe('Successfully deleted 0 stores');
    });
  });

  describe('Action - Invalid Action', () => {
    it('should return error for invalid action', async () => {
      const formData = new URLSearchParams();
      formData.append('action', 'invalid');

      const request = createRequest('http://localhost:3000/app/gdpr', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { action } = await import('../../../app/routes/app.gdpr.jsx');

      // Set up the mock for this test
      const { authenticate } = await import('../../../app/shopify.server');
      authenticate.admin.mockResolvedValue({
        session: { shop: testShop },
      });

      const result = await action({ request });

      const responseData = await result.json();
      expect(responseData.error).toBe('Invalid action');
      expect(result.status).toBe(400);
    });
  });
}); 