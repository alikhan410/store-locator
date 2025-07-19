import { describe, it, expect } from 'vitest';
import { validateStore } from '../../../app/helper/validateForm';

describe('Form Validation Tests', () => {
  describe('validateStore', () => {
    it('should return empty errors for valid store data', () => {
      const validStore = {
        name: 'Test Store',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        phone: '(555) 123-4567',
      };

      const errors = validateStore(validStore);
      expect(errors).toEqual({});
    });

    it('should return errors for missing required fields', () => {
      const invalidStore = {
        name: '',
        address: '123 Main St',
        city: '',
        state: 'NY',
        zip: '10001',
        phone: '',
      };

      const errors = validateStore(invalidStore);
      
      expect(errors.name).toBe('Name is required');
      expect(errors.city).toBe('City is required');
      expect(errors.phone).toBe('Phone is required');
      expect(errors.address).toBeUndefined();
      expect(errors.state).toBeUndefined();
      expect(errors.zip).toBeUndefined();
    });

    it('should return errors for fields with only whitespace', () => {
      const invalidStore = {
        name: '   ',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        phone: '   ',
      };

      const errors = validateStore(invalidStore);
      
      expect(errors.name).toBe('Name is required');
      expect(errors.phone).toBe('Phone is required');
      expect(errors.address).toBeUndefined();
      expect(errors.city).toBeUndefined();
      expect(errors.state).toBeUndefined();
      expect(errors.zip).toBeUndefined();
    });

    it('should validate ZIP code format correctly', () => {
      const validZips = [
        { zip: '12345', expected: undefined },
        { zip: '12345-6789', expected: undefined },
        { zip: '12345-1234', expected: undefined },
      ];

      const invalidZips = [
        { zip: '1234', expected: 'ZIP code is invalid' },
        { zip: '123456', expected: 'ZIP code is invalid' },
        { zip: '12345-123', expected: 'ZIP code is invalid' },
        { zip: '12345-12345', expected: 'ZIP code is invalid' },
        { zip: 'abcde', expected: 'ZIP code is invalid' },
        { zip: '12345-abcde', expected: 'ZIP code is invalid' },
      ];

      // Test valid ZIP codes
      validZips.forEach(({ zip, expected }) => {
        const store = {
          name: 'Test Store',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip,
          phone: '(555) 123-4567',
        };
        const errors = validateStore(store);
        expect(errors.zip).toBe(expected);
      });

      // Test invalid ZIP codes
      invalidZips.forEach(({ zip, expected }) => {
        const store = {
          name: 'Test Store',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip,
          phone: '(555) 123-4567',
        };
        const errors = validateStore(store);
        expect(errors.zip).toBe(expected);
      });
    });

    it('should handle ZIP codes with leading/trailing whitespace', () => {
      const store = {
        name: 'Test Store',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '  12345  ',
        phone: '(555) 123-4567',
      };

      const errors = validateStore(store);
      expect(errors.zip).toBeUndefined();
    });

    it('should handle missing optional fields', () => {
      const store = {
        name: 'Test Store',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        phone: '(555) 123-4567',
        // Missing optional fields like address2, hours, etc.
      };

      const errors = validateStore(store);
      expect(errors).toEqual({});
    });

    it('should handle null and undefined values', () => {
      const store = {
        name: null,
        address: undefined,
        city: 'New York',
        state: 'NY',
        zip: '10001',
        phone: null,
      };

      const errors = validateStore(store);
      
      expect(errors.name).toBe('Name is required');
      expect(errors.address).toBe('Address is required');
      expect(errors.phone).toBe('Phone is required');
      expect(errors.city).toBeUndefined();
      expect(errors.state).toBeUndefined();
      expect(errors.zip).toBeUndefined();
    });
  });
}); 