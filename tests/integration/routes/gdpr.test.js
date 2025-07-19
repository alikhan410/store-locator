import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRequest } from '@remix-run/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('GDPR Route Integration Tests', () => {
  const testShop = 'test-shop.myshopify.com';

  beforeEach(async () => {
    // Clean up any existing test data
    await prisma.store.deleteMany({
      where: { shop: testShop },
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.store.deleteMany({
      where: { shop: testShop },
    });
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

      // Mock the authenticate function to return our test shop
      const originalAuthenticate = (await import('../../../app/shopify.server')).authenticate;
      vi.spyOn(await import('../../../app/shopify.server'), 'authenticate').mockImplementation({
        admin: vi.fn().mockResolvedValue({
          session: { shop: testShop },
        }),
      });

      try {
        // Call the loader
        const result = await loader({ request });

        // Assertions
        expect(result).toEqual({
          storeCount: 2,
          shop: testShop,
        });
      } finally {
        // Restore original authenticate function
        vi.restoreAllMocks();
      }
    });

    it('should handle zero stores', async () => {
      // Ensure no stores exist for this shop
      await prisma.store.deleteMany({
        where: { shop: testShop },
      });

      const request = createRequest('http://localhost:3000/app/gdpr');
      const { loader } = await import('../../../app/routes/app.gdpr.jsx');

      // Mock the authenticate function
      vi.spyOn(await import('../../../app/shopify.server'), 'authenticate').mockImplementation({
        admin: vi.fn().mockResolvedValue({
          session: { shop: testShop },
        }),
      });

      try {
        const result = await loader({ request });

        expect(result).toEqual({
          storeCount: 0,
          shop: testShop,
        });
      } finally {
        vi.restoreAllMocks();
      }
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

      const formData = new FormData();
      formData.append('action', 'export');

      const request = createRequest('http://localhost:3000/app/gdpr', {
        method: 'POST',
        body: formData,
      });

      const { action } = await import('../../../app/routes/app.gdpr.jsx');

      // Mock the authenticate function
      vi.spyOn(await import('../../../app/shopify.server'), 'authenticate').mockImplementation({
        admin: vi.fn().mockResolvedValue({
          session: { shop: testShop },
        }),
      });

      try {
        const result = await action({ request });

        const responseData = await result.json();
        expect(responseData.success).toBe(true);
        expect(responseData.data).toHaveLength(2);
        expect(responseData.data[0].name).toBe('Test Store 1');
        expect(responseData.data[1].name).toBe('Test Store 2');
        expect(responseData.message).toBe('Data export completed successfully');
      } finally {
        vi.restoreAllMocks();
      }
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

      const formData = new FormData();
      formData.append('action', 'delete');

      const request = createRequest('http://localhost:3000/app/gdpr', {
        method: 'POST',
        body: formData,
      });

      const { action } = await import('../../../app/routes/app.gdpr.jsx');

      // Mock the authenticate function
      vi.spyOn(await import('../../../app/shopify.server'), 'authenticate').mockImplementation({
        admin: vi.fn().mockResolvedValue({
          session: { shop: testShop },
        }),
      });

      try {
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
      } finally {
        vi.restoreAllMocks();
      }
    });

    it('should handle deletion of zero stores', async () => {
      // Ensure no stores exist
      await prisma.store.deleteMany({
        where: { shop: testShop },
      });

      const formData = new FormData();
      formData.append('action', 'delete');

      const request = createRequest('http://localhost:3000/app/gdpr', {
        method: 'POST',
        body: formData,
      });

      const { action } = await import('../../../app/routes/app.gdpr.jsx');

      // Mock the authenticate function
      vi.spyOn(await import('../../../app/shopify.server'), 'authenticate').mockImplementation({
        admin: vi.fn().mockResolvedValue({
          session: { shop: testShop },
        }),
      });

      try {
        const result = await action({ request });

        const responseData = await result.json();
        expect(responseData.success).toBe(true);
        expect(responseData.deletedCount).toBe(0);
        expect(responseData.message).toBe('Successfully deleted 0 stores');
      } finally {
        vi.restoreAllMocks();
      }
    });
  });

  describe('Action - Invalid Action', () => {
    it('should return error for invalid action', async () => {
      const formData = new FormData();
      formData.append('action', 'invalid');

      const request = createRequest('http://localhost:3000/app/gdpr', {
        method: 'POST',
        body: formData,
      });

      const { action } = await import('../../../app/routes/app.gdpr.jsx');

      // Mock the authenticate function
      vi.spyOn(await import('../../../app/shopify.server'), 'authenticate').mockImplementation({
        admin: vi.fn().mockResolvedValue({
          session: { shop: testShop },
        }),
      });

      try {
        const result = await action({ request });

        const responseData = await result.json();
        expect(responseData.error).toBe('Invalid action');
        expect(result.status).toBe(400);
      } finally {
        vi.restoreAllMocks();
      }
    });
  });
}); 