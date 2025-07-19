import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveStoreToDB } from '../../../app/helper/createStore';

// Mock the Prisma client
vi.mock('../../../app/db.server', () => ({
  default: {
    store: {
      create: vi.fn(),
    },
  },
}));

describe('Store Creation Tests', () => {
  let mockPrisma;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockPrisma = (await import('../../../app/db.server')).default;
  });

  describe('saveStoreToDB', () => {
    it('should save store with valid data', async () => {
      const mockStore = {
        id: 1,
        shop: 'test-shop.myshopify.com',
        name: 'Test Store',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        phone: '(555) 123-4567',
        lat: 40.7128,
        lng: -74.0060,
      };

      mockPrisma.store.create.mockResolvedValue(mockStore);

      const values = {
        name: 'Test Store',
        address: '123 Main St',
        address2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        phone: '(555) 123-4567',
        lat: '40.7128',
        lng: '-74.0060',
        link: 'https://teststore.com',
        hours: 'Mon-Fri 9AM-5PM',
      };

      const shop = 'test-shop.myshopify.com';
      const result = await saveStoreToDB(values, shop);

      expect(mockPrisma.store.create).toHaveBeenCalledWith({
        data: {
          shop: 'test-shop.myshopify.com',
          name: 'Test Store',
          link: 'https://teststore.com',
          address: '123 Main St',
          address2: 'Suite 100',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          lat: 40.7128,
          lng: -74.0060,
          phone: '(555) 123-4567',
          hours: 'Mon-Fri 9AM-5PM',
        },
      });

      expect(result).toEqual(mockStore);
    });

    it('should handle missing lat/lng values', async () => {
      const mockStore = {
        id: 1,
        shop: 'test-shop.myshopify.com',
        name: 'Test Store',
        lat: 0,
        lng: 0,
      };

      mockPrisma.store.create.mockResolvedValue(mockStore);

      const values = {
        name: 'Test Store',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        phone: '(555) 123-4567',
        // Missing lat and lng
      };

      const shop = 'test-shop.myshopify.com';
      const result = await saveStoreToDB(values, shop);

      expect(mockPrisma.store.create).toHaveBeenCalledWith({
        data: {
          shop: 'test-shop.myshopify.com',
          name: 'Test Store',
          link: undefined,
          address: '123 Main St',
          address2: undefined,
          city: 'New York',
          state: 'NY',
          zip: '10001',
          lat: 0,
          lng: 0,
          phone: '(555) 123-4567',
          hours: undefined,
        },
      });

      expect(result).toEqual(mockStore);
    });

    it('should handle empty string lat/lng values', async () => {
      const mockStore = {
        id: 1,
        shop: 'test-shop.myshopify.com',
        name: 'Test Store',
        lat: 0,
        lng: 0,
      };

      mockPrisma.store.create.mockResolvedValue(mockStore);

      const values = {
        name: 'Test Store',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        phone: '(555) 123-4567',
        lat: '',
        lng: '',
      };

      const shop = 'test-shop.myshopify.com';
      const result = await saveStoreToDB(values, shop);

      expect(mockPrisma.store.create).toHaveBeenCalledWith({
        data: {
          shop: 'test-shop.myshopify.com',
          name: 'Test Store',
          link: undefined,
          address: '123 Main St',
          address2: undefined,
          city: 'New York',
          state: 'NY',
          zip: '10001',
          lat: 0,
          lng: 0,
          phone: '(555) 123-4567',
          hours: undefined,
        },
      });

      expect(result).toEqual(mockStore);
    });

    it('should handle invalid lat/lng values', async () => {
      const mockStore = {
        id: 1,
        shop: 'test-shop.myshopify.com',
        name: 'Test Store',
        lat: 0,
        lng: 0,
      };

      mockPrisma.store.create.mockResolvedValue(mockStore);

      const values = {
        name: 'Test Store',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        phone: '(555) 123-4567',
        lat: 'invalid',
        lng: 'not-a-number',
      };

      const shop = 'test-shop.myshopify.com';
      const result = await saveStoreToDB(values, shop);

      expect(mockPrisma.store.create).toHaveBeenCalledWith({
        data: {
          shop: 'test-shop.myshopify.com',
          name: 'Test Store',
          link: undefined,
          address: '123 Main St',
          address2: undefined,
          city: 'New York',
          state: 'NY',
          zip: '10001',
          lat: 0,
          lng: 0,
          phone: '(555) 123-4567',
          hours: undefined,
        },
      });

      expect(result).toEqual(mockStore);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.store.create.mockRejectedValue(dbError);

      const values = {
        name: 'Test Store',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        phone: '(555) 123-4567',
      };

      const shop = 'test-shop.myshopify.com';

      await expect(saveStoreToDB(values, shop)).rejects.toThrow('Failed to save store');
    });

    it('should handle null and undefined values', async () => {
      const mockStore = {
        id: 1,
        shop: 'test-shop.myshopify.com',
        name: 'Test Store',
        lat: 0,
        lng: 0,
      };

      mockPrisma.store.create.mockResolvedValue(mockStore);

      const values = {
        name: 'Test Store',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        phone: '(555) 123-4567',
        lat: null,
        lng: undefined,
        link: null,
        address2: undefined,
        hours: null,
      };

      const shop = 'test-shop.myshopify.com';
      const result = await saveStoreToDB(values, shop);

      expect(mockPrisma.store.create).toHaveBeenCalledWith({
        data: {
          shop: 'test-shop.myshopify.com',
          name: 'Test Store',
          link: null,
          address: '123 Main St',
          address2: undefined,
          city: 'New York',
          state: 'NY',
          zip: '10001',
          lat: 0,
          lng: 0,
          phone: '(555) 123-4567',
          hours: null,
        },
      });

      expect(result).toEqual(mockStore);
    });
  });
}); 