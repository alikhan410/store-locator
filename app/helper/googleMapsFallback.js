// Google Maps Fallback System for Shopify Compliance
// This ensures the app works even when Google Maps is unavailable

export class GoogleMapsFallback {
  constructor() {
    this.isGoogleMapsAvailable = false;
    this.fallbackMode = false;
  }

  // Check if Google Maps is available
  async checkAvailability(apiKey) {
    try {
      // Test Google Maps API with a simple request
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${apiKey}`,
        { timeout: 5000 }
      );
      
      if (response.ok) {
        const data = await response.json();
        this.isGoogleMapsAvailable = data.status !== 'REQUEST_DENIED' && data.status !== 'OVER_QUERY_LIMIT';
      } else {
        this.isGoogleMapsAvailable = false;
      }
    } catch (error) {
      console.warn('Google Maps API check failed:', error);
      this.isGoogleMapsAvailable = false;
    }

    this.fallbackMode = !this.isGoogleMapsAvailable;
    return this.isGoogleMapsAvailable;
  }

  // Fallback geocoding using OpenStreetMap Nominatim (free, no API key required)
  async geocodeFallback(address, city, state, zip) {
    try {
      const query = `${address}, ${city}, ${state} ${zip}, USA`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=us`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'StoreLocator/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          return {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
            source: 'fallback'
          };
        }
      }
    } catch (error) {
      console.warn('Fallback geocoding failed:', error);
    }

    return { latitude: null, longitude: null, source: 'fallback' };
  }

  // Generate static map image URL using OpenStreetMap
  generateStaticMapUrl(lat, lng, zoom = 12, width = 400, height = 300) {
    if (!lat || !lng) {
      return null;
    }

    // Use OpenStreetMap static image service
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=${lat},${lng},red`;
  }

  // Create fallback map display
  createFallbackMap(container, stores, options = {}) {
    if (!container) return null;

    const { width = 400, height = 300, zoom = 12 } = options;
    
    // Clear container
    container.innerHTML = '';

    if (!stores || stores.length === 0) {
      container.innerHTML = `
        <div style="
          width: ${width}px; 
          height: ${height}px; 
          background: #f5f5f5; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          border: 1px solid #ddd;
          border-radius: 8px;
        ">
          <div style="text-align: center; color: #666;">
            <div style="font-size: 24px; margin-bottom: 8px;">📍</div>
            <div>No stores to display</div>
          </div>
        </div>
      `;
      return;
    }

    // Find center point
    const validStores = stores.filter(store => store.lat && store.lng);
    
    if (validStores.length === 0) {
      container.innerHTML = `
        <div style="
          width: ${width}px; 
          height: ${height}px; 
          background: #f5f5f5; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          border: 1px solid #ddd;
          border-radius: 8px;
        ">
          <div style="text-align: center; color: #666;">
            <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
            <div>Store locations not available</div>
            <div style="font-size: 12px; margin-top: 4px;">Please add coordinates to your stores</div>
          </div>
        </div>
      `;
      return;
    }

    // Calculate center
    const centerLat = validStores.reduce((sum, store) => sum + store.lat, 0) / validStores.length;
    const centerLng = validStores.reduce((sum, store) => sum + store.lng, 0) / validStores.length;

    // Create static map
    const mapUrl = this.generateStaticMapUrl(centerLat, centerLng, zoom, width, height);
    
    if (mapUrl) {
      container.innerHTML = `
        <div style="position: relative;">
          <img 
            src="${mapUrl}" 
            alt="Store locations map" 
            style="
              width: ${width}px; 
              height: ${height}px; 
              border-radius: 8px;
              border: 1px solid #ddd;
            "
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
          />
          <div style="
            display: none;
            width: ${width}px; 
            height: ${height}px; 
            background: #f5f5f5; 
            align-items: center; 
            justify-content: center;
            border: 1px solid #ddd;
            border-radius: 8px;
            position: absolute;
            top: 0;
            left: 0;
          ">
            <div style="text-align: center; color: #666;">
              <div style="font-size: 24px; margin-bottom: 8px;">🗺️</div>
              <div>Map temporarily unavailable</div>
              <div style="font-size: 12px; margin-top: 4px;">Please try again later</div>
            </div>
          </div>
        </div>
      `;
    } else {
      // Fallback to simple list view
      this.createStoreList(container, stores, { width, height });
    }
  }

  // Create simple store list when maps are unavailable
  createStoreList(container, stores, options = {}) {
    const { width = 400, height = 300 } = options;
    
    container.innerHTML = `
      <div style="
        width: ${width}px; 
        height: ${height}px; 
        overflow-y: auto;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: white;
        padding: 16px;
      ">
        <div style="
          font-weight: bold; 
          margin-bottom: 12px; 
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 8px;
        ">
          Store Locations (${stores.length})
        </div>
        ${stores.map(store => `
          <div style="
            margin-bottom: 12px; 
            padding: 8px; 
            border: 1px solid #f0f0f0; 
            border-radius: 4px;
            background: #fafafa;
          ">
            <div style="font-weight: bold; color: #1976d2;">${store.name}</div>
            <div style="font-size: 14px; color: #666; margin-top: 4px;">
              ${store.address}${store.address2 ? `, ${store.address2}` : ''}
            </div>
            <div style="font-size: 14px; color: #666;">
              ${store.city}, ${store.state} ${store.zip}
            </div>
            ${store.phone ? `<div style="font-size: 14px; color: #666; margin-top: 4px;">📞 ${store.phone}</div>` : ''}
            ${store.lat && store.lng ? `<div style="font-size: 12px; color: #999; margin-top: 4px;">📍 ${store.lat.toFixed(4)}, ${store.lng.toFixed(4)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Show user-friendly error message
  showMapError(container, errorType = 'general') {
    const errorMessages = {
      'api_key': 'Google Maps API key is invalid or missing. Please contact support.',
      'quota_exceeded': 'Map service quota exceeded. Please try again later.',
      'network': 'Network error. Please check your internet connection.',
      'general': 'Map service temporarily unavailable. Please try again later.'
    };

    const message = errorMessages[errorType] || errorMessages.general;

    if (container) {
      container.innerHTML = `
        <div style="
          padding: 20px;
          text-align: center;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          color: #856404;
        ">
          <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
          <div style="font-weight: bold; margin-bottom: 8px;">Map Service Unavailable</div>
          <div style="font-size: 14px;">${message}</div>
          <div style="font-size: 12px; margin-top: 8px; color: #856404;">
            Your store data is still accessible and functional.
          </div>
        </div>
      `;
    }
  }

  // Get fallback status
  getStatus() {
    return {
      isAvailable: this.isGoogleMapsAvailable,
      fallbackMode: this.fallbackMode,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const googleMapsFallback = new GoogleMapsFallback(); 