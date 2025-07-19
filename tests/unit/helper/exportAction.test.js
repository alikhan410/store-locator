import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { exportAllStoresToCSV, exportFilteredStoresToCSV } from '../../../app/helper/exportAction';

describe('Export Action Tests', () => {
  let originalCreateElement;
  let originalAppendChild;
  let originalRemoveChild;
  let mockElement;

  beforeEach(() => {
    // Store original methods
    originalCreateElement = document.createElement;
    originalAppendChild = document.body.appendChild;
    originalRemoveChild = document.body.removeChild;

    // Create a real element for testing
    mockElement = document.createElement('a');
    mockElement.setAttribute = vi.fn();
    mockElement.click = vi.fn();

    // Replace with testable versions
    document.createElement = vi.fn(() => mockElement);
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  afterEach(() => {
    // Restore original methods
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
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
      expect(mockElement.setAttribute).toHaveBeenCalledWith('href', expect.stringContaining('data:text/csv'));
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
      expect(mockElement.setAttribute).toHaveBeenCalledWith('href', expect.stringContaining('data:text/csv'));
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

      const hrefCall = mockElement.setAttribute.mock.calls.find(call => call[0] === 'href');
      const csvData = hrefCall[1];
      
      expect(csvData).toContain('data:text/csv;charset=utf-8,');
      expect(csvData).toContain('Name,Address,Address2,City,State,Zip,Country,Latitude,Longitude,Phone,Link');
      expect(csvData).toContain('Test Store,123 Main St,Suite 100,New York,NY,10001,United States,40.7128,-74.006,(555) 123-4567,https://teststore.com');
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
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('filtered-stores'));
      expect(mockElement.setAttribute).toHaveBeenCalledWith('href', expect.stringContaining('data:text/csv'));
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
      
      expect(filename).toContain('filtered-stores');
      expect(filename).toContain('test');
      expect(filename).toContain('NY');
      expect(filename).toContain('New York');
    });
  });
}); 