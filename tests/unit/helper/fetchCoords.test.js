import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCoords } from '../../../app/helper/fetchCoords';

// Mock fetch globally
global.fetch = vi.fn();

// Mock console methods
const originalConsole = { ...console };
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
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

  it('should return fallback result when API key is missing', async () => {
    delete process.env.GOOGLE_GEOCODING_API_KEY;
    
    // Mock fallback geocoding to return null result
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve([])
    });
    
    const result = await generateCoords('123 Main St', 'CA', 'San Francisco', '94102');
    
    expect(result).toEqual({
      latitude: null,
      longitude: null,
      source: 'fallback'
    });
    expect(mockConsole.warn).toHaveBeenCalledWith(
      'Google Maps API key not found, using fallback geocoding'
    );
  });

  it('should make correct API calls with Google Maps and fallback', async () => {
    // Mock Google Maps availability check (fails)
    global.fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ status: 'REQUEST_DENIED' })
      })
      // Mock fallback geocoding response
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve([])
      });

    await generateCoords('123 Main St', 'CA', 'San Francisco', '94102');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    // Should call Google Maps API first
    expect(global.fetch).toHaveBeenNthCalledWith(1, 
      expect.stringContaining('maps.googleapis.com'), 
      { timeout: 5000 }
    );
    // Then call fallback API
    expect(global.fetch).toHaveBeenNthCalledWith(2,
      expect.stringContaining('nominatim.openstreetmap.org'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': 'StoreLocator/1.0'
        })
      })
    );
  });

  it('should return coordinates when Google geocoding is successful', async () => {
    // Mock Google Maps availability check (success)
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'OK' })
      })
      // Mock successful Google Maps geocoding
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'OK',
          results: [{
            geometry: {
              location: {
                lat: 37.7749,
                lng: -122.4194
              }
            }
          }]
        })
      });

    const result = await generateCoords('123 Main St', 'CA', 'San Francisco', '94102');

    expect(result).toEqual({
      latitude: 37.7749,
      longitude: -122.4194,
      source: 'google'
    });
  });

  it('should return fallback result when Google geocoding fails', async () => {
    // Mock Google Maps availability check (success)
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'OK' })
      })
      // Mock failed Google Maps geocoding
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'ZERO_RESULTS',
          results: []
        })
      })
      // Mock fallback response
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve([])
      });

    const result = await generateCoords('Invalid Address', 'XX', 'Invalid City', '00000');

    expect(result).toEqual({
      latitude: null,
      longitude: null,
      source: 'fallback'
    });
  });

  it('should return fallback result when API returns error status', async () => {
    // Mock Google Maps availability check (success) 
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'OK' })
      })
      // Mock Google Maps error response
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'OVER_QUERY_LIMIT',
          results: []
        })
      })
      // Mock fallback response
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve([])
      });

    const result = await generateCoords('123 Main St', 'CA', 'San Francisco', '94102');

    expect(result).toEqual({
      latitude: null,
      longitude: null,
      source: 'fallback'
    });
  });

  it('should return fallback result when no results are returned', async () => {
    // Mock Google Maps availability check (success)
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'OK' })
      })
      // Mock Google Maps empty results
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'OK',
          results: []
        })
      })
      // Mock fallback response
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve([])
      });

    const result = await generateCoords('123 Main St', 'CA', 'San Francisco', '94102');

    expect(result).toEqual({
      latitude: null,
      longitude: null,
      source: 'fallback'
    });
  });

  it('should handle network errors gracefully with fallback', async () => {
    // Mock Google Maps availability check (success)
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'OK' })
      })
      // Mock network error for geocoding
      .mockRejectedValueOnce(new Error('Network error'))
      // Mock fallback response
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve([])
      });

    const result = await generateCoords('123 Main St', 'CA', 'San Francisco', '94102');

    expect(result).toEqual({
      latitude: null,
      longitude: null,
      source: 'fallback'
    });
    expect(mockConsole.error).toHaveBeenCalledWith('Geocoding error:', expect.any(Error));
  });

  it('should not log API key for debugging (removed feature)', async () => {
    // Mock Google Maps availability check (success)  
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'OK' })
      })
      // Mock fallback when primary fails
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'ZERO_RESULTS',
          results: []
        })
      })
      // Mock fallback response
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve([])
      });

    await generateCoords('123 Main St', 'CA', 'San Francisco', '94102');

    // The new implementation doesn't log API keys for security
    expect(mockConsole.log).not.toHaveBeenCalledWith('API Key is:', 'test-api-key');
  });

  it('should handle special characters in address', async () => {
    // Mock Google Maps availability check (success)
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'OK' })
      })
      // Mock fallback when primary fails  
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'ZERO_RESULTS',
          results: []
        })
      })
      // Mock fallback response
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve([])
      });

    await generateCoords('123 Main St & 5th Ave', 'NY', 'New York', '10001');

    expect(global.fetch).toHaveBeenCalledTimes(3);
    // Should properly encode the address
    expect(global.fetch).toHaveBeenNthCalledWith(2,
      expect.stringContaining('123%20Main%20St%20%26%205th%20Ave'),
      expect.objectContaining({ timeout: 10000 })
    );
  });
}); 