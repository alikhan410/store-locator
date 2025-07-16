# Shopify App Migration Checklist: Single-Store to Multi-Tenant

## Executive Summary

This document outlines the migration plan to transform the current store locator app from a single-store application into a fully multi-tenant, Shopify App Store compliant application.

**Current State:** The app already has a solid foundation with OAuth, PostgreSQL database, and proper session management. However, the store data is not shop-specific, creating a critical multi-tenancy issue.

**Critical Issue:** All stores are currently shared across all shops - this is a **major data privacy and security concern** that must be addressed immediately.

---

## 1. Authentication Layer ✅ **MOSTLY COMPLETE**

### Current State Assessment
- ✅ OAuth 2.0 flow implemented via `@shopify/shopify-app-remix`
- ✅ Session storage with Prisma (`PrismaSessionStorage`)
- ✅ Per-store access tokens stored securely in `Session` table
- ✅ App configured for App Store distribution (`AppDistribution.AppStore`)
- ✅ Proper authentication middleware in place

### Required Actions
- [ ] **PRIORITY 1**: Add session validation to ensure shop context in all admin routes
- [ ] Add shop-specific middleware for data isolation
- [ ] Test OAuth flow with multiple development stores

---

## 2. Data Model **🚨 CRITICAL - NOT SHOP-AWARE**

### Current Issues
- 🚨 **CRITICAL**: `Store` model has NO shop association - all stores are global
- 🚨 **CRITICAL**: All database operations are shop-agnostic
- 🚨 **CRITICAL**: Data privacy violation - shops can see each other's stores

### Required Schema Changes

#### 2.1 Update Store Model
```sql
-- Add shop field to Store table
ALTER TABLE "Store" ADD COLUMN "shop" TEXT NOT NULL;
-- Add index for performance
CREATE INDEX "Store_shop_idx" ON "Store"("shop");
-- Add composite index for shop-specific queries
CREATE INDEX "Store_shop_createdAt_idx" ON "Store"("shop", "createdAt");
```

#### 2.2 Update Prisma Schema
```prisma
model Store {
  id        String   @id @default(cuid())
  shop      String   // NEW: Associate with shop domain
  name      String
  link      String?
  address   String
  address2  String?
  city      String
  state     String
  zip       String
  country   String  @default("United States")
  phone     String?
  lat       Float?
  lng       Float?
  createdAt DateTime @default(now())
  
  @@index([shop])
  @@index([shop, createdAt])
}
```

### Required Code Changes

#### 2.3 Update All Store Operations
- [ ] **app/routes/app.add-store.jsx**: Add shop context to store creation
- [ ] **app/routes/app.view-stores.jsx**: Filter stores by shop
- [ ] **app/routes/filter.jsx**: Add shop filter to all queries
- [ ] **app/routes/import-stores.jsx**: Associate imported stores with shop
- [ ] **app/routes/app-proxy.store-locations.jsx**: Filter by shop
- [ ] **app/helper/createStore.js**: Add shop parameter

#### 2.4 Create Shop-Aware Helper Functions
```javascript
// app/helper/shopAware.js
export async function getShopFromRequest(request) {
  const { session } = await authenticate.admin(request);
  return session.shop;
}

export function withShopFilter(query, shop) {
  return {
    ...query,
    where: {
      ...query.where,
      shop: shop
    }
  };
}
```

---

## 3. Webhooks ✅ **MOSTLY COMPLETE**

### Current State
- ✅ `app/uninstalled` webhook configured and implemented
- ✅ `app/scopes_update` webhook configured and implemented
- ✅ Proper webhook signature validation via `authenticate.webhook`

### Required Actions
- [ ] **PRIORITY 2**: Add data cleanup in `app/uninstalled` webhook to remove shop-specific stores
- [ ] Test webhook delivery and signature validation
- [ ] Add error handling and retry logic for webhook failures

#### 3.1 Update Uninstall Webhook
```javascript
// app/routes/webhooks.app.uninstalled.jsx
export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  
  console.log(`Received ${topic} webhook for ${shop}`);
  
  if (session) {
    // Clean up session data
    await db.session.deleteMany({ where: { shop } });
    
    // NEW: Clean up shop-specific store data
    await db.store.deleteMany({ where: { shop } });
  }
  
  return new Response();
};
```

---

## 4. App Proxy / Client-Side Optimization **🚨 NEEDS SHOP AWARENESS**

### Current Issues
- 🚨 **CRITICAL**: App proxy endpoint returns ALL stores regardless of shop
- ⚠️  Extension uses static JSON files instead of dynamic shop data
- ⚠️  No caching strategy for shop-specific data

### Required Changes

#### 4.1 Fix App Proxy Shop Awareness
```javascript
// app/routes/app-proxy.store-locations.jsx
export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query") || "";
    const shop = url.searchParams.get("shop"); // Get shop from query params
    
    if (!shop) {
      return new Response("Shop parameter required", { status: 400 });
    }
    
    const stores = await prisma.store.findMany({
      where: {
        shop: shop, // NEW: Filter by shop
        OR: [
          { city: { contains: query, mode: "insensitive" } },
          { state: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
    });
    
    return { stores };
  } catch (error) {
    console.error("Failed to load stores", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
```

#### 4.2 Update Extension to Use Shop-Specific Data
```javascript
// extensions/store-locator-block/blocks/store-locator.liquid
// Update JavaScript to include shop context
fetch(`/apps/store-locations?query=${encodeURIComponent(query)}&shop={{ shop.domain }}`)
```

#### 4.3 Add Caching Strategy
- [ ] Implement Redis cache for shop-specific store data
- [ ] Add cache invalidation on store updates
- [ ] Consider CDN caching for static assets

---

## 5. Shopify App Store Compliance **🚨 MISSING CRITICAL ELEMENTS**

### Current State
- ✅ Embedded app setup with App Bridge
- ✅ Proper error boundaries and navigation
- ✅ Polaris design system implementation

### Missing Critical Elements

#### 5.1 Onboarding Flow
- [ ] Create welcome/onboarding screen for new installs
- [ ] Add guided tour for first-time users
- [ ] Implement usage analytics

#### 5.2 Billing Implementation (if monetized)
```javascript
// app/billing.server.js
import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";

export async function ensureBilling(request, isTest = true) {
  const { billing } = await authenticate.admin(request);
  
  const billingCheck = await billing.require({
    plans: [MONTHLY_PLAN],
    isTest,
    returnUrl: `${process.env.SHOPIFY_APP_URL}/app`,
  });
  
  return billingCheck;
}
```

#### 5.3 App Store Requirements
- [ ] Add proper app description and screenshots
- [ ] Implement privacy policy and terms of service
- [ ] Add GDPR compliance for customer data
- [ ] Create app listing with proper metadata

#### 5.4 Performance & UX
- [ ] Add loading states for all async operations
- [ ] Implement error handling with user-friendly messages
- [ ] Add offline support where applicable
- [ ] Optimize bundle size and lazy loading

---

## 6. Deployment Checklist **⚠️ NEEDS SECURITY HARDENING**

### Current State
- ✅ PostgreSQL database configured
- ✅ Vercel deployment ready
- ✅ Environment variables structured

### Required Improvements

#### 6.1 Security & Rate Limiting
```javascript
// app/middleware/rateLimit.js
export async function rateLimitByShop(request, limit = 100) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  
  // Implement Redis-based rate limiting per shop
  // Return 429 if limit exceeded
}
```

#### 6.2 Monitoring & Logging
- [ ] Add structured logging with shop context
- [ ] Implement error tracking (Sentry, etc.)
- [ ] Add performance monitoring
- [ ] Create health check endpoints

#### 6.3 Database Optimization
- [ ] Add database connection pooling
- [ ] Implement database migrations strategy
- [ ] Add backup and disaster recovery plan
- [ ] Monitor query performance

---

## 7. Extension Updates **🚨 CRITICAL - NOT SHOP-SPECIFIC**

### Current Issues
- 🚨 **CRITICAL**: Static JSON files shared across all shops
- 🚨 **CRITICAL**: No shop context in Liquid templates
- ⚠️  Hardcoded API endpoints

### Required Changes

#### 7.1 Dynamic Store Data Loading
- [ ] Remove static `stores.json` and `store_locations.json`
- [ ] Update JavaScript to fetch shop-specific data
- [ ] Pass shop domain from Liquid context

#### 7.2 Update Extension Configuration
```javascript
// extensions/store-locator-block/assets/store-locator.js
function fetchStores(coords, radiusKm) {
  const shopDomain = window.Shopify?.shop?.domain;
  if (!shopDomain) {
    console.error('Shop domain not available');
    return;
  }
  
  fetch(`/apps/store-locations?shop=${shopDomain}&query=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      updateMapAndList(coords, data.stores, radiusKm);
    });
}
```

---

## 8. Testing Strategy

### 8.1 Multi-Tenancy Testing
- [ ] Test with multiple development stores simultaneously
- [ ] Verify data isolation between shops
- [ ] Test shop deletion and cleanup

### 8.2 Performance Testing
- [ ] Load test with multiple concurrent shops
- [ ] Test database performance with large datasets
- [ ] Verify app proxy performance

### 8.3 Security Testing
- [ ] Test shop data isolation
- [ ] Verify webhook signature validation
- [ ] Test OAuth token security

---

## 9. Migration Execution Plan

### Phase 1: **CRITICAL DATA ISOLATION** (Week 1)
1. 🚨 **STOP NEW INSTALLS** until data isolation is fixed
2. Add `shop` field to Store model
3. Update all database operations to be shop-aware
4. Migrate existing data (assign to primary shop or clean up)
5. Test data isolation thoroughly

### Phase 2: **APP PROXY & EXTENSIONS** (Week 2)
1. Fix app proxy shop awareness
2. Update extension to use dynamic data
3. Remove static JSON files
4. Test end-to-end store locator functionality

### Phase 3: **COMPLIANCE & POLISH** (Week 3-4)
1. Add onboarding flow
2. Implement billing if required
3. Add monitoring and logging
4. Security hardening
5. Performance optimization

### Phase 4: **DEPLOYMENT & MONITORING** (Week 4)
1. Deploy to production
2. Monitor for issues
3. Gather user feedback
4. Iterate and improve

---

## 10. Risk Assessment

### **HIGH RISK** 🚨
- **Data privacy violation**: Current global store access is unacceptable
- **App Store rejection**: Non-compliant multi-tenancy
- **Legal liability**: GDPR/privacy violations

### **MEDIUM RISK** ⚠️
- **Performance issues**: No caching strategy
- **Extension compatibility**: Static to dynamic migration
- **User experience**: No onboarding flow

### **LOW RISK** ✅
- **Authentication**: Solid foundation exists
- **Database**: PostgreSQL is appropriate choice
- **Framework**: Remix + Shopify App Remix is stable

---

## 11. Success Metrics

- [ ] 100% data isolation between shops
- [ ] Zero cross-shop data leakage
- [ ] App Store approval
- [ ] <2s page load times
- [ ] 99.9% uptime
- [ ] Positive merchant feedback

---

## Developer Notes & Assumptions

### Assumptions Made
1. **Data Migration**: Existing stores will be assigned to a primary shop or cleaned up
2. **Billing Model**: Freemium or one-time purchase (no subscription complexity)
3. **Scale**: Moderate scale (hundreds of shops, thousands of stores)
4. **Geographic Scope**: Primarily US-based stores (based on default country)

### Open Questions
1. **Data Migration Strategy**: How to handle existing stores in database?
2. **Billing Requirements**: Is this a paid app or free?
3. **Geographic Support**: International address formats needed?
4. **Performance Requirements**: Expected concurrent users per shop?
5. **Backup Strategy**: What's the RTO/RPO requirements?

### Technical Debt to Address
1. **Error Handling**: Inconsistent error handling across routes
2. **Type Safety**: No TypeScript implementation
3. **Testing**: No automated test suite
4. **Documentation**: Limited inline documentation
5. **Code Organization**: Some large files that could be refactored

---

**⚠️ IMPORTANT**: The current state poses a significant data privacy risk. The critical data isolation issues (Phase 1) must be addressed before any new merchants install the app. 