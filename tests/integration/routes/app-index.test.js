import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a simple request mock since createRequest is not available
const createRequest = (url, options = {}) => {
  return new Request(url, options);
};

// Mock Shopify authentication
vi.mock('../../../app/shopify.server', () => ({
  authenticate: {
    admin: vi.fn()
  }
}));

// Mock Prisma client
vi.mock('../../../app/db.server', () => ({
  default: {
    store: {
      findMany: vi.fn()
    }
  }
}));

describe('App Index Route Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loader', () => {
    it('should return stores and metrics for authenticated shop', { timeout: 10000 }, async () => {
      // Mock the authenticate function
      const { authenticate } = await import('../../../app/shopify.server');
      authenticate.admin.mockResolvedValue({
        session: {
          shop: 'test-shop.myshopify.com'
        }
      });

      // Mock Prisma client
      const mockStores = [
        {
          id: 1,
          name: 'Store 1',
          address: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
          phone: '555-1234',
          link: 'https://example.com',
          lat: 37.7749,
          lng: -122.4194,
          createdAt: new Date('2024-01-15')
        },
        {
          id: 2,
          name: 'Store 2',
          address: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90210',
          phone: '555-5678',
          link: null,
          lat: 34.0522,
          lng: -118.2437,
          createdAt: new Date('2024-01-20')
        },
        {
          id: 3,
          name: 'Store 3',
          address: '789 Pine St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          phone: null,
          link: 'https://example2.com',
          lat: null,
          lng: null,
          createdAt: new Date('2024-01-10')
        }
      ];

      const { default: prisma } = await import('../../../app/db.server');
      prisma.store.findMany.mockResolvedValue(mockStores);

      const request = createRequest('http://localhost:3000/app');

      // Import the loader function
      const { loader } = await import('../../../app/routes/app._index');

      const result = await loader({ request });

      expect(prisma.store.findMany).toHaveBeenCalledWith({
        where: {
          shop: 'test-shop.myshopify.com'
        },
        orderBy: { createdAt: 'desc' }
      });

      expect(result).toHaveProperty('stores');
      expect(result).toHaveProperty('metrics');

      // Check stores (should be limited to 10)
      expect(result.stores).toHaveLength(3);
      expect(result.stores[0].name).toBe('Store 1');

      // Check metrics
      expect(result.metrics.totalStores).toBe(3);
      expect(result.metrics.uniqueStatesCount).toBe(2); // CA and NY
      expect(result.metrics.geocodedPercent).toBe(67); // 2 out of 3 stores have coordinates
      expect(result.metrics.storesWithPhone).toBe(2);
      expect(result.metrics.storesWithLink).toBe(2);
      expect(result.metrics.missingCoordinates).toBe(1);
      expect(result.metrics.missingPhone).toBe(1);
    });

    it('should handle empty stores list', async () => {
      const { authenticate } = await import('../../../app/shopify.server');
      authenticate.admin.mockResolvedValue({
        session: {
          shop: 'test-shop.myshopify.com'
        }
      });

      const { default: prisma } = await import('../../../app/db.server');
      prisma.store.findMany.mockResolvedValue([]);

      const request = createRequest('http://localhost:3000/app');

      // Import the loader function
      const { loader } = await import('../../../app/routes/app._index');

      const result = await loader({ request });

      expect(result.stores).toHaveLength(0);
      expect(result.metrics.totalStores).toBe(0);
      expect(result.metrics.uniqueStatesCount).toBe(0);
      expect(result.metrics.geocodedPercent).toBe(0);
      expect(result.metrics.storesWithPhone).toBe(0);
      expect(result.metrics.storesWithLink).toBe(0);
      expect(result.metrics.missingCoordinates).toBe(0);
      expect(result.metrics.missingPhone).toBe(0);
    });

    it('should calculate recent stores correctly', async () => {
      const { authenticate } = await import('../../../app/shopify.server');
      authenticate.admin.mockResolvedValue({
        session: {
          shop: 'test-shop.myshopify.com'
        }
      });

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const mockStores = [
        {
          id: 1,
          name: 'Recent Store',
          createdAt: now,
          lat: 37.7749,
          lng: -122.4194,
          phone: '555-1234',
          link: 'https://example.com'
        },
        {
          id: 2,
          name: 'Old Store',
          createdAt: twoWeeksAgo,
          lat: 34.0522,
          lng: -118.2437,
          phone: null,
          link: null
        }
      ];

      const { default: prisma } = await import('../../../app/db.server');
      prisma.store.findMany.mockResolvedValue(mockStores);

      const request = createRequest('http://localhost:3000/app');

      // Import the loader function
      const { loader } = await import('../../../app/routes/app._index');

      const result = await loader({ request });

      expect(result.metrics.recentStoresCount).toBe(1);
    });

    it('should handle authentication errors', async () => {
      const { authenticate } = await import('../../../app/shopify.server');
      authenticate.admin.mockRejectedValue(new Error('Authentication failed'));

      const request = createRequest('http://localhost:3000/app');

      // Import the loader function
      const { loader } = await import('../../../app/routes/app._index');

      await expect(loader({ request })).rejects.toThrow('Authentication failed');
    });

    it('should handle database errors', async () => {
      const { authenticate } = await import('../../../app/shopify.server');
      authenticate.admin.mockResolvedValue({
        session: {
          shop: 'test-shop.myshopify.com'
        }
      });

      const { default: prisma } = await import('../../../app/db.server');
      prisma.store.findMany.mockRejectedValue(new Error('Database error'));

      const request = createRequest('http://localhost:3000/app');

      // Import the loader function
      const { loader } = await import('../../../app/routes/app._index');

      await expect(loader({ request })).rejects.toThrow('Database error');
    });

    it('should filter stores by shop for GDPR compliance', async () => {
      const { authenticate } = await import('../../../app/shopify.server');
      authenticate.admin.mockResolvedValue({
        session: {
          shop: 'specific-shop.myshopify.com'
        }
      });

      const { default: prisma } = await import('../../../app/db.server');
      prisma.store.findMany.mockResolvedValue([]);

      const request = createRequest('http://localhost:3000/app');

      // Import the loader function
      const { loader } = await import('../../../app/routes/app._index');

      await loader({ request });

      expect(prisma.store.findMany).toHaveBeenCalledWith({
        where: {
          shop: 'specific-shop.myshopify.com'
        },
        orderBy: { createdAt: 'desc' }
      });
    });
  });
}); 