import prisma from "../db.server.js";
import { authenticate } from "../shopify.server.js";

/**
 * Analytics tracking endpoint
 * Receives analytics events from the store locator frontend
 * 
 * POST /apps/storetrail/analytics/track?shop=your-shop.myshopify.com
 * Body: {
 *   eventType: 'search' | 'store_view' | 'store_contact' | 'radius_change',
 *   sessionId: string,
 *   timestamp: string (ISO), // optional
 *   ...event-specific data
 * }
 */
export const action = async ({ request }) => {
  // Authenticate the app proxy request (validates it's from Shopify)
  // Get shop from the authenticated request URL
  try {
    await authenticate.public.appProxy(request);
  } catch (authError) {
    return new Response(
      JSON.stringify({ success: false, error: "Authentication failed" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Get shop from authenticated URL (app proxy includes shop in the URL)
  const url = new URL(request.url);
  let shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(
      JSON.stringify({ success: false, error: "Shop parameter missing" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let eventData;
  try {
    eventData = await request.json();
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validate required fields
  const { eventType, sessionId, timestamp } = eventData;

  if (!eventType || !sessionId) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Missing required fields: eventType and sessionId are required" 
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Validate eventType
  const validEventTypes = ['search', 'store_view', 'store_contact', 'radius_change'];
  if (!validEventTypes.includes(eventType)) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` 
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Parse timestamp (use provided timestamp or current time)
  let eventTimestamp;
  if (timestamp) {
    eventTimestamp = new Date(timestamp);
    if (isNaN(eventTimestamp.getTime())) {
      eventTimestamp = new Date(); // Fallback to current time if invalid
    }
  } else {
    eventTimestamp = new Date();
  }

  try {
    // Create analytics event in database
    const analyticsEvent = await prisma.storeAnalyticsEvent.create({
      data: {
        shop: shop,
        sessionId: sessionId,
        eventType: eventType,
        timestamp: eventTimestamp,
        
        // Search event data
        searchQuery: eventData.query || null,
        resultsCount: eventData.resultsCount != null ? parseInt(eventData.resultsCount, 10) : null,
        radius: eventData.radius != null ? parseFloat(eventData.radius) : null,
        radiusUnit: eventData.radiusUnit || null,
        
        // Store event data
        storeId: eventData.storeId || null,
        storeName: eventData.storeName || null,
        viewType: eventData.viewType || null,
        distanceFromUser: eventData.distanceFromUser != null
          ? parseFloat(eventData.distanceFromUser) 
          : null,
        rankInResults: eventData.rankInResults != null ? parseInt(eventData.rankInResults, 10) : null,
        
        // Contact event data
        contactType: eventData.contactType || null,
        
        // Radius change event data
        oldRadius: eventData.oldRadius != null ? parseFloat(eventData.oldRadius) : null,
        newRadius: eventData.newRadius != null ? parseFloat(eventData.newRadius) : null,
      },
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId: analyticsEvent.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Failed to save analytics event",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// GET endpoint for health check or testing
export const loader = async ({ request }) => {
  try {
    await authenticate.public.appProxy(request);
  } catch (authError) {
    return new Response(
      JSON.stringify({ success: false, error: "Authentication failed" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "Analytics endpoint is active",
      method: "Use POST to track events"
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};

