import { authenticate } from "../shopify.server";

/**
 * Google Maps API Loader Endpoint
 * 
 * This endpoint serves a script that loads Google Maps JavaScript API
 * with the app's public API key (GOOGLE_MAPS_PUBLIC_KEY), removing the 
 * need for merchants to provide their own key in theme settings.
 * 
 * GET /apps/storetrail/maps-loader?shop=your-shop.myshopify.com
 * Returns: JavaScript that loads Google Maps API with callback=initMap
 */
export const loader = async ({ request }) => {
  // Authenticate the app proxy request (validates it's from Shopify)
  try {
    await authenticate.public.appProxy(request);
  } catch (authError) {
    return new Response("Authentication failed", { 
      status: 401,
      headers: { "Content-Type": "text/plain" }
    });
  }

  // Get API key from environment
  const apiKey = process.env.GOOGLE_MAPS_PUBLIC_KEY;
  
  if (!apiKey) {
    console.error("Google Maps API key not configured");
    return new Response("API key not configured", { 
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }

  // Return a script that loads Google Maps API with the callback
  // The callback=initMap ensures the existing initMap() function in the theme is called
  const script = `
    (function() {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        // Already loaded, call initMap directly if it exists
        if (typeof window.initMap === 'function') {
          window.initMap();
        }
        return;
      }
      
      // Create and inject the Google Maps script tag
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    })();
  `;
  
  return new Response(script, {
    headers: { 
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  });
};

