import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCoords } from '../../../app/helper/fetchCoords';

// Mock fetch globally
global.fetch = vi.fn();

// Mock console methods
const originalConsole = { ...console };
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
};

describe('FetchCoords Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.console = mockConsole;
    
    // Mock environment variable
    process.env.GOOGLE_GEOCODING_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    global.console = originalConsole;
    delete process.env.GOOGLE_GEOCODING_API_KEY;
  });

  it('should throw error when API key is missing', async () => {
    delete process.env.GOOGLE_GEOCODING_API_KEY;
    
    await expect(generateCoords('123 Main St', 'CA', 'San Francisco', '94102'))
      .rejects.toThrow('Google Maps API key not found in environment variables.');
  });

  it('should make correct API call with encoded address', async () => {
    const mockResponse = {
      status: 'OK',
      results: [{
        geometry: {
          location: { lat: 37.7749, lng: -122.4194 }
        }
      }]
    };

    global.fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockResponse)
    });

    await generateCoords('123 Main St', 'CA', 'San Francisco', '94102');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://maps.googleapis.com/maps/api/geocode/json?address=123%20Main%20St%2C%20San%20Francisco%2C%20CA%2C%2094102&key=test-api-key'
    );
  });

  it('should return coordinates when geocoding is successful', async () => {
    const mockResponse = {
      status: 'OK',
      results: [{
        geometry: {
          location: { lat: 37.7749, lng: -122.4194 }
        }
      }]
    };

    global.fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockResponse)
    });

    const result = await generateCoords('123 Main St', 'CA', 'San Francisco', '94102');

    expect(result).toEqual({
      latitude: 37.7749,
      longitude: -122.4194
    });
  });

  it('should return null coordinates when geocoding fails', async () => {
    const mockResponse = {
      status: 'ZERO_RESULTS',
      results: []
    };

    global.fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockResponse)
    });

    const result = await generateCoords('Invalid Address', 'XX', 'Invalid City', '00000');

    expect(result).toEqual({
      latitude: null,
      longitude: null
    });
    expect(mockConsole.error).toHaveBeenCalledWith('Geocoding failed:', mockResponse);
  });

  it('should return null coordinates when API returns error status', async () => {
    const mockResponse = {
      status: 'REQUEST_DENIED',
      results: []
    };

    global.fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockResponse)
    });

    const result = await generateCoords('123 Main St', 'CA', 'San Francisco', '94102');

    expect(result).toEqual({
      latitude: null,
      longitude: null
    });
  });

  it('should return null coordinates when no results are returned', async () => {
    const mockResponse = {
      status: 'OK',
      results: []
    };

    global.fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockResponse)
    });

    const result = await generateCoords('123 Main St', 'CA', 'San Francisco', '94102');

    expect(result).toEqual({
      latitude: null,
      longitude: null
    });
  });

  it('should handle network errors gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(generateCoords('123 Main St', 'CA', 'San Francisco', '94102'))
      .rejects.toThrow('Network error');
  });

  it('should log API key for debugging', async () => {
    const mockResponse = {
      status: 'OK',
      results: [{
        geometry: {
          location: { lat: 37.7749, lng: -122.4194 }
        }
      }]
    };

    global.fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockResponse)
    });

    await generateCoords('123 Main St', 'CA', 'San Francisco', '94102');

    expect(mockConsole.log).toHaveBeenCalledWith('API Key is:', 'test-api-key');
  });

  it('should handle special characters in address', async () => {
    const mockResponse = {
      status: 'OK',
      results: [{
        geometry: {
          location: { lat: 40.7128, lng: -74.0060 }
        }
      }]
    };

    global.fetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValueOnce(mockResponse)
    });

    await generateCoords('123 Main St & 5th Ave', 'NY', 'New York', '10001');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://maps.googleapis.com/maps/api/geocode/json?address=123%20Main%20St%20%26%205th%20Ave%2C%20New%20York%2C%20NY%2C%2010001&key=test-api-key'
    );
  });
}); 