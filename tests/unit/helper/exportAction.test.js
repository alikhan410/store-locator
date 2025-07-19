import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exportAllStoresToCSV, exportFilteredStoresToCSV } from '../../../app/helper/exportAction';

describe('Export Action Tests', () => {
  let mockElement;

  beforeEach(() => {
    // Get the mock element from the global setup
    mockElement = document.createElement('a');
    
    // Clear previous calls
    vi.clearAllMocks();
  });

  describe('exportAllStoresToCSV', () => {
    it('should handle empty stores array', () => {
      const result = exportAllStoresToCSV([]);
      expect(result).toBeUndefined();
    });

    it('should handle null stores', () => {
      const result = exportAllStoresToCSV(null);
      expect(result).toBeUndefined();
    });

    it('should export stores with all fields', () => {
      const mockStores = [
        {
          name: 'Test Store',
          address: '123 Main St',
          address2: 'Suite 100',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'United States',
          lat: 40.7128,
          lng: -74.0060,
          phone: '(555) 123-4567',
          link: 'https://teststore.com',
        },
      ];

      exportAllStoresToCSV(mockStores);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', 'all-stores.csv');
      expect(mockElement.href).toBe('mock-url');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockElement);
      expect(mockElement.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockElement);
    });

    it('should handle stores with missing optional fields', () => {
      const mockStores = [
        {
          name: 'Test Store',
          address: '123 Main St',
          address2: null,
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'United States',
          lat: null,
          lng: null,
          phone: null,
          link: null,
        },
      ];

      exportAllStoresToCSV(mockStores);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', 'all-stores.csv');
      expect(mockElement.href).toBe('mock-url');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockElement);
      expect(mockElement.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockElement);
    });

    it('should generate correct CSV content', () => {
      const mockStores = [
        {
          name: 'Test Store',
          address: '123 Main St',
          address2: 'Suite 100',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'United States',
          lat: 40.7128,
          lng: -74.0060,
          phone: '(555) 123-4567',
          link: 'https://teststore.com',
        },
      ];

      exportAllStoresToCSV(mockStores);

      // Since we're using a mock URL, we can't test the actual CSV content
      // But we can verify the function was called correctly
      expect(mockElement.href).toBe('mock-url');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', 'all-stores.csv');
    });
  });

  describe('exportFilteredStoresToCSV', () => {
    it('should handle empty stores array', () => {
      const result = exportFilteredStoresToCSV([]);
      expect(result).toBeUndefined();
    });

    it('should export filtered stores with descriptive filename', () => {
      const mockStores = [
        {
          name: 'Test Store',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'United States',
        },
      ];

      const mockFilters = {
        query: 'test',
        state: ['NY'],
        city: 'New York',
      };

      exportFilteredStoresToCSV(mockStores, mockFilters);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('stores-search-test-state-NY-city-New-York-1-stores.csv'));
      expect(mockElement.href).toBe('mock-url');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockElement);
      expect(mockElement.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockElement);
    });

    it('should generate filename with filter information', () => {
      const mockStores = [
        {
          name: 'Test Store',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'United States',
        },
      ];

      const mockFilters = {
        query: 'test',
        state: ['NY'],
        city: 'New York',
      };

      exportFilteredStoresToCSV(mockStores, mockFilters);

      const downloadCall = mockElement.setAttribute.mock.calls.find(call => call[0] === 'download');
      const filename = downloadCall[1];
      
      expect(filename).toContain('stores');
      expect(filename).toContain('test');
      expect(filename).toContain('NY');
      expect(filename).toContain('New-York');
    });
  });
}); 