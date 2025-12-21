# Store Locator Analytics - Tracking Plan

## Overview
Track customer behavior on the store locator to provide merchants with actionable insights about where customers are searching, what stores are popular, and how customers interact with the locator.

---

## Data Points to Track

### 1. **Search Events** (Most Important)

#### A. Location Searches
```javascript
{
  eventType: "search",
  searchType: "location", // or "zipcode", "address", "city"
  query: "90210", // The actual search term
  queryType: "zipcode", // zipcode, city, address, coordinates
  timestamp: "2025-12-18T10:30:00Z",
  sessionId: "abc123", // Anonymous session ID
  
  // Geolocation data
  userLocation: {
    latitude: 34.0522,
    longitude: -118.2437,
    city: "Los Angeles",
    state: "CA",
    country: "US"
  },
  
  // Search results
  resultsCount: 12,
  resultsShown: 10, // How many displayed
  topResultDistance: 2.3, // miles to closest store
  
  // User context
  deviceType: "mobile", // mobile, tablet, desktop
  browser: "Chrome",
  source: "storefront", // or "product_page", "homepage"
  
  // Shop context
  shop: "example-store.myshopify.com"
}
```

#### B. Product Searches (Future Feature)
```javascript
{
  eventType: "search",
  searchType: "product",
  query: "iPhone 15 Pro",
  productId: "gid://shopify/Product/123",
  productTitle: "iPhone 15 Pro",
  timestamp: "2025-12-18T10:30:00Z",
  sessionId: "abc123",
  
  // Results
  storesWithProduct: 8,
  resultsShown: 8,
  nearestStoreDistance: 5.2,
  
  // Context
  userLocation: { ... },
  shop: "example-store.myshopify.com"
}
```

### 2. **Store Interaction Events**

#### A. Store View
```javascript
{
  eventType: "store_view",
  storeId: "store_123",
  storeName: "Downtown LA Store",
  viewType: "list", // or "map_marker", "detail_page"
  timestamp: "2025-12-18T10:31:00Z",
  sessionId: "abc123",
  
  // Context
  searchQuery: "90210", // What led to this view
  distanceFromUser: 2.3, // miles
  rankInResults: 1, // Position in search results
  
  shop: "example-store.myshopify.com"
}
```

#### B. Get Directions Click
```javascript
{
  eventType: "directions_click",
  storeId: "store_123",
  storeName: "Downtown LA Store",
  timestamp: "2025-12-18T10:32:00Z",
  sessionId: "abc123",
  
  // Journey
  searchQuery: "90210",
  distanceFromUser: 2.3,
  
  // Destination
  destinationType: "google_maps", // or "apple_maps", "waze"
  
  shop: "example-store.myshopify.com"
}
```

#### C. Store Contact Actions
```javascript
{
  eventType: "store_contact",
  storeId: "store_123",
  contactType: "phone_click", // or "website_click", "email_click"
  timestamp: "2025-12-18T10:33:00Z",
  sessionId: "abc123",
  
  shop: "example-store.myshopify.com"
}
```

### 3. **Filter Usage**

```javascript
{
  eventType: "filter_applied",
  filterType: "tag", // or "distance", "hours"
  filterValue: "Open Now",
  timestamp: "2025-12-18T10:34:00Z",
  sessionId: "abc123",
  
  // Before/after
  resultsBeforeFilter: 50,
  resultsAfterFilter: 12,
  
  shop: "example-store.myshopify.com"
}
```

### 4. **Map Interactions**

```javascript
{
  eventType: "map_interaction",
  interactionType: "zoom", // or "pan", "marker_click"
  timestamp: "2025-12-18T10:35:00Z",
  sessionId: "abc123",
  
  // Map state
  zoomLevel: 12,
  centerLat: 34.0522,
  centerLng: -118.2437,
  visibleStoresCount: 8,
  
  shop: "example-store.myshopify.com"
}
```

### 5. **Session Summary** (Aggregated)

```javascript
{
  eventType: "session_summary",
  sessionId: "abc123",
  startTime: "2025-12-18T10:30:00Z",
  endTime: "2025-12-18T10:40:00Z",
  duration: 600, // seconds
  
  // Activity summary
  searchCount: 3,
  storesViewed: 5,
  directionsClicked: 1,
  filtersUsed: 2,
  
  // Outcome
  convertedToDirections: true, // Did they get directions?
  
  shop: "example-store.myshopify.com"
}
```

---

## Database Schema

### Table: `store_analytics_events`

```sql
CREATE TABLE store_analytics_events (
  id SERIAL PRIMARY KEY,
  shop VARCHAR(255) NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'search', 'store_view', 'directions_click', etc.
  
  -- Search data
  search_query TEXT,
  search_type VARCHAR(50), -- 'location', 'zipcode', 'product'
  query_type VARCHAR(50), -- 'zipcode', 'city', 'address'
  
  -- Store data
  store_id VARCHAR(255),
  store_name VARCHAR(255),
  
  -- Results data
  results_count INTEGER,
  rank_in_results INTEGER,
  distance_from_user DECIMAL(10, 2),
  
  -- User location
  user_latitude DECIMAL(10, 7),
  user_longitude DECIMAL(10, 7),
  user_city VARCHAR(255),
  user_state VARCHAR(100),
  user_country VARCHAR(100),
  
  -- Context
  device_type VARCHAR(50), -- 'mobile', 'tablet', 'desktop'
  browser VARCHAR(100),
  source VARCHAR(100), -- 'storefront', 'product_page'
  
  -- Additional data (JSON for flexibility)
  metadata JSONB,
  
  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_shop (shop),
  INDEX idx_event_type (event_type),
  INDEX idx_timestamp (timestamp),
  INDEX idx_session (session_id),
  INDEX idx_store (store_id),
  INDEX idx_search_query (search_query),
  INDEX idx_user_location (user_city, user_state)
);
```

### Table: `store_analytics_aggregates` (Pre-computed for performance)

```sql
CREATE TABLE store_analytics_aggregates (
  id SERIAL PRIMARY KEY,
  shop VARCHAR(255) NOT NULL,
  period_type VARCHAR(20) NOT NULL, -- 'day', 'week', 'month'
  period_start DATE NOT NULL,
  
  -- Search metrics
  total_searches INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  
  -- Top queries (JSON array)
  top_search_queries JSONB, -- [{"query": "90210", "count": 45}, ...]
  top_cities JSONB, -- [{"city": "Los Angeles", "count": 120}, ...]
  top_zipcodes JSONB, -- [{"zipcode": "90210", "count": 45}, ...]
  
  -- Store metrics
  top_stores JSONB, -- [{"storeId": "123", "views": 234, "directions": 89}, ...]
  
  -- Geographic distribution
  search_locations JSONB, -- For heatmap [{"lat": 34.05, "lng": -118.24, "count": 10}, ...]
  
  -- Conversion metrics
  direction_clicks INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2), -- % of sessions that led to directions
  
  -- Device breakdown
  mobile_searches INTEGER DEFAULT 0,
  desktop_searches INTEGER DEFAULT 0,
  tablet_searches INTEGER DEFAULT 0,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE (shop, period_type, period_start),
  INDEX idx_shop_period (shop, period_type, period_start)
);
```

---

## Implementation Plan

### Phase 1: Client-Side Tracking

#### A. Create Analytics Service (`app/services/analyticsService.js`)

```javascript
// app/services/analyticsService.js
export class StoreLocatorAnalytics {
  constructor(shop) {
    this.shop = shop;
    this.sessionId = this.getOrCreateSessionId();
    this.userLocation = null;
  }

  // Generate or retrieve session ID
  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('store_locator_session');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('store_locator_session', sessionId);
    }
    return sessionId;
  }

  // Get user location (if available)
  async getUserLocation() {
    if (this.userLocation) return this.userLocation;

    try {
      // Try IP-based geolocation first (fast, privacy-friendly)
      const response = await fetch('/api/geolocation');
      const data = await response.json();
      this.userLocation = data.location;
      return this.userLocation;
    } catch (error) {
      console.warn('Could not get user location:', error);
      return null;
    }
  }

  // Track search event
  async trackSearch(searchData) {
    const userLocation = await this.getUserLocation();
    
    const event = {
      eventType: 'search',
      searchType: searchData.type, // 'location' or 'product'
      query: searchData.query,
      queryType: this.detectQueryType(searchData.query),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userLocation,
      resultsCount: searchData.resultsCount,
      resultsShown: searchData.resultsShown,
      topResultDistance: searchData.topResultDistance,
      deviceType: this.getDeviceType(),
      browser: this.getBrowser(),
      source: searchData.source || 'storefront',
      shop: this.shop
    };

    return this.sendEvent(event);
  }

  // Track store view
  async trackStoreView(storeData) {
    const event = {
      eventType: 'store_view',
      storeId: storeData.id,
      storeName: storeData.name,
      viewType: storeData.viewType, // 'list', 'map_marker', 'detail_page'
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      searchQuery: storeData.searchQuery,
      distanceFromUser: storeData.distance,
      rankInResults: storeData.rank,
      shop: this.shop
    };

    return this.sendEvent(event);
  }

  // Track directions click
  async trackDirectionsClick(storeData) {
    const event = {
      eventType: 'directions_click',
      storeId: storeData.id,
      storeName: storeData.name,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      searchQuery: storeData.searchQuery,
      distanceFromUser: storeData.distance,
      destinationType: storeData.destinationType || 'google_maps',
      shop: this.shop
    };

    return this.sendEvent(event);
  }

  // Track filter usage
  async trackFilterApplied(filterData) {
    const event = {
      eventType: 'filter_applied',
      filterType: filterData.type,
      filterValue: filterData.value,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      resultsBeforeFilter: filterData.resultsBefore,
      resultsAfterFilter: filterData.resultsAfter,
      shop: this.shop
    };

    return this.sendEvent(event);
  }

  // Send event to server
  async sendEvent(event) {
    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        console.warn('Analytics tracking failed:', response.statusText);
      }
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
      // Don't throw - analytics should never break the app
    }
  }

  // Helper: Detect query type
  detectQueryType(query) {
    if (/^\d{5}(-\d{4})?$/.test(query)) return 'zipcode';
    if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(query)) return 'coordinates';
    if (/\d+/.test(query)) return 'address';
    return 'city';
  }

  // Helper: Get device type
  getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  // Helper: Get browser
  getBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }
}
```

#### B. Integration in Store Locator Component

```javascript
// app/routes/app.store-locator-frontend.jsx (or wherever the storefront lives)
import { useEffect, useState, useCallback } from 'react';
import { StoreLocatorAnalytics } from '../services/analyticsService';

export default function StoreLocatorFrontend() {
  const [analytics] = useState(() => new StoreLocatorAnalytics(window.shop));
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState([]);

  // Track search
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    
    // Perform search
    const results = await searchStores(query);
    setStores(results);

    // Track the search
    analytics.trackSearch({
      type: 'location',
      query,
      resultsCount: results.length,
      resultsShown: Math.min(results.length, 10),
      topResultDistance: results[0]?.distance,
      source: 'storefront'
    });
  }, [analytics]);

  // Track store view when user clicks on a store
  const handleStoreClick = useCallback((store, index) => {
    analytics.trackStoreView({
      id: store.id,
      name: store.name,
      viewType: 'list',
      searchQuery,
      distance: store.distance,
      rank: index + 1
    });
  }, [analytics, searchQuery]);

  // Track directions click
  const handleDirectionsClick = useCallback((store) => {
    analytics.trackDirectionsClick({
      id: store.id,
      name: store.name,
      searchQuery,
      distance: store.distance,
      destinationType: 'google_maps'
    });
  }, [analytics, searchQuery]);

  // Track filter changes
  const handleFilterChange = useCallback((filterType, filterValue) => {
    const resultsBefore = stores.length;
    
    // Apply filter
    const filteredStores = applyFilter(stores, filterType, filterValue);
    setStores(filteredStores);

    // Track filter usage
    analytics.trackFilterApplied({
      type: filterType,
      value: filterValue,
      resultsBefore,
      resultsAfter: filteredStores.length
    });
  }, [analytics, stores]);

  return (
    // Your store locator UI
    <div>
      <SearchInput onSearch={handleSearch} />
      <StoreList 
        stores={stores}
        onStoreClick={handleStoreClick}
        onDirectionsClick={handleDirectionsClick}
      />
      <Filters onChange={handleFilterChange} />
    </div>
  );
}
```

### Phase 2: Server-Side API Routes

#### A. Track Event Endpoint (`app/routes/api.analytics.track.jsx`)

```javascript
// app/routes/api.analytics.track.jsx
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const event = await request.json();
    const prisma = (await import("../db.server")).default;

    // Validate event
    if (!event.eventType || !event.shop || !event.sessionId) {
      return json({ error: "Invalid event data" }, { status: 400 });
    }

    // Store event
    await prisma.storeAnalyticsEvent.create({
      data: {
        shop: event.shop,
        sessionId: event.sessionId,
        eventType: event.eventType,
        
        // Search data
        searchQuery: event.query || null,
        searchType: event.searchType || null,
        queryType: event.queryType || null,
        
        // Store data
        storeId: event.storeId || null,
        storeName: event.storeName || null,
        
        // Results
        resultsCount: event.resultsCount || null,
        rankInResults: event.rankInResults || null,
        distanceFromUser: event.distanceFromUser || null,
        
        // User location
        userLatitude: event.userLocation?.latitude || null,
        userLongitude: event.userLocation?.longitude || null,
        userCity: event.userLocation?.city || null,
        userState: event.userLocation?.state || null,
        userCountry: event.userLocation?.country || null,
        
        // Context
        deviceType: event.deviceType || null,
        browser: event.browser || null,
        source: event.source || null,
        
        // Additional data
        metadata: event.metadata || {},
        
        // Timestamp
        timestamp: new Date(event.timestamp)
      }
    });

    return json({ success: true });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    return json({ error: "Failed to track event" }, { status: 500 });
  }
};
```

#### B. Get Analytics Dashboard Data (`app/routes/app.analytics.jsx`)

```javascript
// app/routes/app.analytics.jsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  DataTable
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const prisma = (await import("../db.server")).default;
  
  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "30"; // days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  // 1. Total searches
  const totalSearches = await prisma.storeAnalyticsEvent.count({
    where: {
      shop: session.shop,
      eventType: "search",
      timestamp: { gte: startDate }
    }
  });

  // 2. Unique sessions
  const uniqueSessions = await prisma.storeAnalyticsEvent.findMany({
    where: {
      shop: session.shop,
      timestamp: { gte: startDate }
    },
    distinct: ['sessionId'],
    select: { sessionId: true }
  });

  // 3. Top search queries
  const topQueries = await prisma.$queryRaw`
    SELECT search_query, COUNT(*) as count
    FROM store_analytics_events
    WHERE shop = ${session.shop}
      AND event_type = 'search'
      AND timestamp >= ${startDate}
      AND search_query IS NOT NULL
    GROUP BY search_query
    ORDER BY count DESC
    LIMIT 20
  `;

  // 4. Top cities/locations
  const topCities = await prisma.$queryRaw`
    SELECT user_city, user_state, COUNT(*) as count
    FROM store_analytics_events
    WHERE shop = ${session.shop}
      AND event_type = 'search'
      AND timestamp >= ${startDate}
      AND user_city IS NOT NULL
    GROUP BY user_city, user_state
    ORDER BY count DESC
    LIMIT 20
  `;

  // 5. Most viewed stores
  const topStores = await prisma.$queryRaw`
    SELECT 
      store_id,
      store_name,
      COUNT(CASE WHEN event_type = 'store_view' THEN 1 END) as views,
      COUNT(CASE WHEN event_type = 'directions_click' THEN 1 END) as directions
    FROM store_analytics_events
    WHERE shop = ${session.shop}
      AND timestamp >= ${startDate}
      AND store_id IS NOT NULL
    GROUP BY store_id, store_name
    ORDER BY views DESC
    LIMIT 20
  `;

  // 6. Conversion rate (searches that led to directions)
  const conversions = await prisma.$queryRaw`
    SELECT 
      COUNT(DISTINCT CASE WHEN event_type = 'search' THEN session_id END) as total_sessions,
      COUNT(DISTINCT CASE WHEN event_type = 'directions_click' THEN session_id END) as converted_sessions
    FROM store_analytics_events
    WHERE shop = ${session.shop}
      AND timestamp >= ${startDate}
  `;

  const conversionRate = conversions[0]?.total_sessions 
    ? (conversions[0].converted_sessions / conversions[0].total_sessions * 100).toFixed(2)
    : 0;

  // 7. Device breakdown
  const deviceBreakdown = await prisma.$queryRaw`
    SELECT device_type, COUNT(*) as count
    FROM store_analytics_events
    WHERE shop = ${session.shop}
      AND event_type = 'search'
      AND timestamp >= ${startDate}
      AND device_type IS NOT NULL
    GROUP BY device_type
  `;

  // 8. Search volume over time (for chart)
  const searchTrend = await prisma.$queryRaw`
    SELECT 
      DATE(timestamp) as date,
      COUNT(*) as searches
    FROM store_analytics_events
    WHERE shop = ${session.shop}
      AND event_type = 'search'
      AND timestamp >= ${startDate}
    GROUP BY DATE(timestamp)
    ORDER BY date ASC
  `;

  // 9. Heatmap data (lat/lng with counts)
  const heatmapData = await prisma.$queryRaw`
    SELECT 
      user_latitude as lat,
      user_longitude as lng,
      COUNT(*) as count
    FROM store_analytics_events
    WHERE shop = ${session.shop}
      AND event_type = 'search'
      AND timestamp >= ${startDate}
      AND user_latitude IS NOT NULL
      AND user_longitude IS NOT NULL
    GROUP BY user_latitude, user_longitude
    HAVING COUNT(*) >= 2
  `;

  return json({
    totalSearches,
    uniqueSessions: uniqueSessions.length,
    topQueries,
    topCities,
    topStores,
    conversionRate,
    deviceBreakdown,
    searchTrend,
    heatmapData,
    period
  });
};

export default function Analytics() {
  const data = useLoaderData();

  return (
    <Page title="Store Locator Analytics">
      <Layout>
        {/* Key Metrics */}
        <Layout.Section>
          <InlineGrid columns={4} gap="400">
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">Total Searches</Text>
                <Text variant="heading2xl" as="p">{data.totalSearches}</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">Unique Sessions</Text>
                <Text variant="heading2xl" as="p">{data.uniqueSessions}</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">Conversion Rate</Text>
                <Text variant="heading2xl" as="p">{data.conversionRate}%</Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">Avg per Session</Text>
                <Text variant="heading2xl" as="p">
                  {data.uniqueSessions ? (data.totalSearches / data.uniqueSessions).toFixed(1) : 0}
                </Text>
              </BlockStack>
            </Card>
          </InlineGrid>
        </Layout.Section>

        {/* Top Search Queries */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingLg" as="h2">Top Search Queries</Text>
              <DataTable
                columnContentTypes={['text', 'numeric']}
                headings={['Search Query', 'Count']}
                rows={data.topQueries.map(q => [q.search_query, q.count])}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Top Cities */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingLg" as="h2">Top Search Locations</Text>
              <DataTable
                columnContentTypes={['text', 'text', 'numeric']}
                headings={['City', 'State', 'Searches']}
                rows={data.topCities.map(c => [c.user_city, c.user_state, c.count])}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Most Viewed Stores */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingLg" as="h2">Most Popular Stores</Text>
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric', 'numeric']}
                headings={['Store Name', 'Views', 'Directions', 'Conversion %']}
                rows={data.topStores.map(s => [
                  s.store_name,
                  s.views,
                  s.directions,
                  s.views ? ((s.directions / s.views) * 100).toFixed(1) + '%' : '0%'
                ])}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Device Breakdown */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingLg" as="h2">Device Breakdown</Text>
              <DataTable
                columnContentTypes={['text', 'numeric', 'numeric']}
                headings={['Device', 'Searches', 'Percentage']}
                rows={data.deviceBreakdown.map(d => [
                  d.device_type,
                  d.count,
                  ((d.count / data.totalSearches) * 100).toFixed(1) + '%'
                ])}
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* TODO: Add charts with Chart.js or similar */}
        {/* TODO: Add heatmap visualization */}
      </Layout>
    </Page>
  );
}
```

---

## Privacy Considerations

### 1. **Data Collection Best Practices**
- ✅ Use anonymous session IDs (no personally identifiable info)
- ✅ Don't store IP addresses directly
- ✅ Use IP geolocation API to get city/state, then discard IP
- ✅ No tracking cookies required
- ✅ Aggregate data after 90 days (GDPR compliance)

### 2. **GDPR Compliance**
```javascript
// Add data retention policy
async function cleanOldAnalytics() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  // Delete raw events older than 90 days
  await prisma.storeAnalyticsEvent.deleteMany({
    where: {
      timestamp: { lt: ninetyDaysAgo }
    }
  });
}
```

### 3. **User Disclosure**
Add to your app's privacy policy:
> "We collect anonymous analytics data about store locator usage including search queries, locations searched, and stores viewed. This data helps merchants improve their store locations and customer experience. No personally identifiable information is collected."

---

## Next Steps

1. ✅ Create database migration for analytics tables
2. ✅ Implement analytics service on frontend
3. ✅ Create tracking API endpoint
4. ✅ Build analytics dashboard UI
5. ✅ Add charts/visualizations (Chart.js or Recharts)
6. ✅ Implement heatmap view (Google Maps Heatmap Layer)
7. ✅ Add CSV export functionality
8. ✅ Set up data aggregation job (daily/weekly)
9. ✅ Add analytics link to main navigation

**Estimated Implementation Time: 3-4 weeks**

