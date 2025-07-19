import { describe, it, expect } from 'vitest';
import { haversineDistance, getBoundingBox } from '../../../app/helper/geoUtils';

describe('Geo Utils Tests', () => {
  describe('haversineDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // New York to Los Angeles (approximately 3935 km)
      const nyc = { lat: 40.7128, lng: -74.0060 };
      const la = { lat: 34.0522, lng: -118.2437 };
      
      const distance = haversineDistance(nyc.lat, nyc.lng, la.lat, la.lng);
      
      // Allow for some margin of error (within 100km)
      expect(distance).toBeGreaterThan(3800);
      expect(distance).toBeLessThan(4100);
    });

    it('should return 0 for same coordinates', () => {
      const lat = 40.7128;
      const lng = -74.0060;
      
      const distance = haversineDistance(lat, lng, lat, lng);
      
      expect(distance).toBe(0);
    });

    it('should handle edge cases at poles', () => {
      // Test with coordinates at the poles
      const distance = haversineDistance(90, 0, -90, 0);
      expect(distance).toBeGreaterThan(20000); // Should be approximately half the Earth's circumference
    });

    it('should handle decimal precision', () => {
      const lat1 = 40.7128;
      const lng1 = -74.0060;
      const lat2 = 40.7129;
      const lng2 = -74.0061;
      
      const distance = haversineDistance(lat1, lng1, lat2, lng2);
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1); // Should be very small distance
    });

    it('should calculate distance across international date line', () => {
      // Tokyo to Honolulu (crosses international date line)
      const tokyo = { lat: 35.6762, lng: 139.6503 };
      const honolulu = { lat: 21.3099, lng: -157.8581 };
      
      const distance = haversineDistance(tokyo.lat, tokyo.lng, honolulu.lat, honolulu.lng);
      
      expect(distance).toBeGreaterThan(6000);
      expect(distance).toBeLessThan(7000);
    });

    it('should handle coordinates at equator', () => {
      // Quito to Singapore (both near equator)
      const quito = { lat: 0.2299, lng: -78.5249 };
      const singapore = { lat: 1.3521, lng: 103.8198 };
      
      const distance = haversineDistance(quito.lat, quito.lng, singapore.lat, singapore.lng);
      
      expect(distance).toBeGreaterThan(19000);
      expect(distance).toBeLessThan(20000);
    });
  });

  describe('getBoundingBox', () => {
    it('should calculate bounding box correctly', () => {
      const lat = 40.7128;
      const lng = -74.0060;
      const radiusKm = 10;
      
      const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, radiusKm);
      
      // The bounding box should be larger than the radius
      expect(maxLat).toBeGreaterThan(lat);
      expect(minLat).toBeLessThan(lat);
      expect(maxLng).toBeGreaterThan(lng);
      expect(minLng).toBeLessThan(lng);
      
      // The difference should be reasonable for the given radius
      expect(maxLat - minLat).toBeGreaterThan(0.001); // Allow for smaller values
      expect(maxLng - minLng).toBeGreaterThan(0.001); // Allow for smaller values
    });

    it('should handle zero radius', () => {
      const lat = 40.7128;
      const lng = -74.0060;
      const radiusKm = 0;
      
      const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, radiusKm);
      
      expect(maxLat).toBe(lat);
      expect(minLat).toBe(lat);
      expect(maxLng).toBe(lng);
      expect(minLng).toBe(lng);
    });

    it('should handle large radius', () => {
      const lat = 40.7128;
      const lng = -74.0060;
      const radiusKm = 1000;
      
      const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, radiusKm);
      
      // For a large radius, the bounding box should be significantly larger
      expect(maxLat - minLat).toBeGreaterThan(0.1); // Allow for smaller values
      expect(maxLng - minLng).toBeGreaterThan(0.1); // Allow for smaller values
    });

    it('should handle edge cases at poles', () => {
      // Test near the North Pole
      const lat = 89.9;
      const lng = 0;
      const radiusKm = 10;
      
      const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, radiusKm);
      
      expect(maxLat).toBeLessThanOrEqual(90); // Should not exceed 90 degrees
      expect(minLat).toBeGreaterThan(0);
    });

    it('should handle coordinates at equator', () => {
      const lat = 0;
      const lng = 0;
      const radiusKm = 100;
      
      const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, radiusKm);
      
      expect(maxLat).toBeGreaterThan(0);
      expect(minLat).toBeLessThan(0);
      expect(maxLng).toBeGreaterThan(0);
      expect(minLng).toBeLessThan(0);
    });

    it('should handle coordinates at international date line', () => {
      const lat = 0;
      const lng = 180;
      const radiusKm = 50;
      
      const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, radiusKm);
      
      expect(maxLat).toBeGreaterThan(0);
      expect(minLat).toBeLessThan(0);
      expect(maxLng).toBeLessThanOrEqual(180);
      expect(minLng).toBeGreaterThanOrEqual(-180);
    });
  });
}); 