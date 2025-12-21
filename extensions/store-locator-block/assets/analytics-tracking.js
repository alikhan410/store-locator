/**
 * Store Locator Analytics Tracking Helper
 * 
 * Provides tracking functions for store locator analytics events.
 * Sends events to the analytics API endpoint for storage.
 */

(function() {
  'use strict';

  // Store current search context
  let currentSearchQuery = null;
  let currentRadius = null;

  /**
   * Get or create a session ID (persists across page reloads in same browser session)
   * @returns {string} Session ID
   */
  function getSessionId() {
    try {
      const storageKey = 'storelocator_session_id';
      let sessionId = sessionStorage.getItem(storageKey);
      
      if (!sessionId) {
        // Generate a unique session ID
        sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
        sessionStorage.setItem(storageKey, sessionId);
      }
      
      return sessionId;
    } catch (error) {
      // Fallback if sessionStorage is not available (private browsing, etc.)
      return 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
    }
  }

  /**
   * Generic tracking function - sends events to API endpoint
   * @param {string} eventType - Type of event (e.g., 'search', 'store_view')
   * @param {object} eventData - Additional event data
   */
  function trackEvent(eventType, eventData) {
    try {
      const event = {
        eventType: eventType,
        sessionId: getSessionId(),
        timestamp: new Date().toISOString(),
        ...eventData
      };
      
      // Log to console for debugging (can be removed in production)
      console.log(`Analytics: ${eventType}`, event);
      
      // Send to API endpoint - shop will be determined by app proxy authentication
      const apiUrl = `/apps/storetrail/analytics`;
      
      // Use fetch with error handling - don't await to avoid blocking
      fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })
      .then(response => {
        if (!response.ok) {
          console.warn(`Analytics API returned ${response.status} for ${eventType}`);
          return response.text().then(text => {
            console.warn('Analytics API error response:', text);
            throw new Error(`API returned ${response.status}`);
          });
        }
        return response.json();
      })
      .then(data => {
        if (!data.success) {
          console.warn(`Analytics tracking failed for ${eventType}:`, data.error);
        } else {
          console.log(`Analytics: ${eventType} tracked successfully`, data);
        }
      })
      .catch(error => {
        // Log errors for debugging
        console.warn('Analytics tracking error (non-blocking):', error);
      });
    } catch (error) {
      // Silently fail - analytics should never break the app
      console.warn('Analytics tracking failed:', error);
    }
  }

  /**
   * Track search event
   * @param {string} query - Search query string
   * @param {number} resultsCount - Number of results returned
   * @param {number} radius - Search radius value
   */
  function trackSearch(query, resultsCount, radius) {
    currentSearchQuery = query;
    currentRadius = radius;
    trackEvent('search', {
      query: query,
      resultsCount: resultsCount,
      radius: radius,
      radiusUnit: window.radiusUnit || 'miles'
    });
  }

  /**
   * Track store view event
   * @param {object} store - Store object with id, name, distance properties
   * @param {string} viewType - Type of view ('list' or 'map_marker')
   * @param {number} rankInResults - Position in search results (1-based)
   */
  function trackStoreView(store, viewType, rankInResults) {
    // store.distance is always in kilometers (from haversineDistance function)
    // Convert to user's preferred unit if needed
    const distance = store.distance 
      ? (window.radiusUnit === 'miles' 
          ? parseFloat((store.distance / 1.60934).toFixed(2)) // Convert km to miles
          : parseFloat(store.distance.toFixed(2))) // Keep in km
      : null;

    trackEvent('store_view', {
      storeId: store.id || null,
      storeName: store.name,
      viewType: viewType, // 'list' or 'map_marker'
      searchQuery: currentSearchQuery,
      distanceFromUser: distance,
      rankInResults: rankInResults
    });
  }

  /**
   * Track store contact action (phone or website click)
   * @param {object} store - Store object with id, name properties
   * @param {string} contactType - Type of contact ('phone_click' or 'website_click')
   */
  function trackStoreContact(store, contactType) {
    trackEvent('store_contact', {
      storeId: store.id || null,
      storeName: store.name,
      contactType: contactType, // 'phone_click' or 'website_click'
      searchQuery: currentSearchQuery
    });
  }

  /**
   * Track radius change event
   * @param {number} oldRadius - Previous radius value
   * @param {number} newRadius - New radius value
   */
  function trackRadiusChange(oldRadius, newRadius) {
    trackEvent('radius_change', {
      oldRadius: oldRadius,
      newRadius: newRadius,
      radiusUnit: window.radiusUnit || 'miles'
    });
  }

  /**
   * Get current search query
   * @returns {string|null} Current search query
   */
  function getCurrentSearchQuery() {
    return currentSearchQuery;
  }

  /**
   * Get current radius
   * @returns {number|null} Current radius value
   */
  function getCurrentRadius() {
    return currentRadius;
  }

  // Expose tracking functions to global scope
  window.StoreLocatorAnalytics = {
    trackSearch: trackSearch,
    trackStoreView: trackStoreView,
    trackStoreContact: trackStoreContact,
    trackRadiusChange: trackRadiusChange,
    getCurrentSearchQuery: getCurrentSearchQuery,
    getCurrentRadius: getCurrentRadius
  };

})();

