# StoreTrail App - Complete Codebase Reference

**Last Updated:** January 2025  
**App Name:** StoreTrail  
**Client ID:** fc0568978e5a7a64c4020dc35c935330  
**Framework:** Remix + Shopify App Remix  
**Database:** PostgreSQL (via Prisma)

---

## 📊 Database Schema

### Models Overview

All models are **shop-scoped** for multi-tenancy and GDPR compliance. Every query must filter by `shop` field.

#### 1. **Session** (Shopify OAuth Sessions)
- **Purpose:** Stores Shopify OAuth session data
- **Key Fields:**
  - `id` (String, primary key)
  - `shop` (String) - Shop domain
  - `accessToken` (String) - Shopify API access token
  - `userId`, `firstName`, `lastName`, `email` - User info
  - `isOnline`, `accountOwner`, `collaborator` - Access flags
- **Managed By:** `@shopify/shopify-app-session-storage-prisma`

#### 2. **Store** (Store Locations)
- **Purpose:** Physical store locations for merchants
- **Key Fields:**
  - `id` (String, cuid)
  - `shop` (String) - **REQUIRED for all queries**
  - `name`, `address`, `address2`, `city`, `state`, `zip`, `country`
  - `phone`, `link` (website URL)
  - `lat`, `lng` (coordinates for mapping)
  - `notes` (internal notes)
  - `createdAt`
- **Relationships:** None (standalone)
- **Indexes:** Shop-based queries

#### 3. **StoreSubmission** (Dealer/Store Submissions)
- **Purpose:** Stores dealer submissions for new locations (pending approval)
- **Key Fields:**
  - `id` (String, cuid)
  - `shop` (String) - **REQUIRED for all queries**
  - `storeName`, `storeType`
  - `contactName`, `contactEmail`, `contactPhone`
  - `address`, `address2`, `city`, `state`, `zip`, `country`, `website`
  - `status` (PENDING, APPROVED, REJECTED)
  - `notes` (submission notes)
  - `adminNotes` (internal admin review notes)
  - `createdAt`, `updatedAt`
- **Workflow:** PENDING → APPROVED (creates Store) or REJECTED

#### 4. **SavedView** (Saved Filter Views)
- **Purpose:** Merchants can save filter combinations for quick access
- **Key Fields:**
  - `id` (String, cuid)
  - `shop` (String) - **REQUIRED for all queries**
  - `name` (String) - View name
  - `filters` (String) - JSON string of filter values
  - `isDefault` (Boolean) - System-generated views (e.g., "Missing Coordinates")
  - `createdAt`, `updatedAt`
- **Unique Constraint:** `[shop, name]` - One view name per shop

#### 5. **StoreAnalyticsEvent** (Analytics Events)
- **Purpose:** Tracks customer interactions with store locator
- **Key Fields:**
  - `id` (String, cuid)
  - `shop` (String) - **REQUIRED for all queries**
  - `sessionId` (String) - Anonymous session ID (sessionStorage-based)
  - `eventType` ('search', 'store_view', 'store_contact', 'radius_change')
  - **Search Data:** `searchQuery`, `resultsCount`, `radius`, `radiusUnit`
  - **Store Data:** `storeId`, `storeName`, `viewType`, `distanceFromUser`, `rankInResults`
  - **Contact Data:** `contactType` ('phone_click', 'website_click')
  - **Radius Data:** `oldRadius`, `newRadius`
  - `timestamp`, `createdAt`
- **Indexes:** shop, eventType, timestamp, sessionId, storeId, searchQuery
- **Privacy:** No customer PII - only anonymous session IDs

#### 6. **StoreAnalyticsAggregate** (Pre-computed Analytics)
- **Purpose:** Aggregated analytics for performance (daily/weekly/monthly)
- **Key Fields:**
  - `id` (String, cuid)
  - `shop` (String) - **REQUIRED for all queries**
  - `periodType` ('day', 'week', 'month')
  - `periodStart` (DateTime)
  - `totalSearches`, `uniqueSessions`
  - `topSearchQueries` (JSON array)
  - `topStores` (JSON array)
  - `totalContacts`
  - `updatedAt`
- **Unique Constraint:** `[shop, periodType, periodStart]`

---

## 🛣️ Routes Structure

### Admin Routes (App Routes)
All routes under `/app/*` require authentication via `authenticate.admin(request)`

#### **app._index.jsx** - Dashboard
- **Purpose:** Main dashboard showing store metrics, analytics, and distribution
- **Features:**
  - Store count and health metrics
  - State distribution chart (choropleth data)
  - Analytics (last 30 days): searches, sessions, top queries, top stores
  - Quick actions and setup guides

#### **app.add-store.jsx** - Add Store
- **Purpose:** Form to manually add a new store location
- **Features:**
  - Address form with geocoding
  - Phone validation
  - Plan limit checking
  - Auto-geocoding on address entry

#### **app.edit-store.$storeId.jsx** - Edit Store
- **Purpose:** Edit existing store details
- **Features:**
  - Pre-populated form
  - Update coordinates
  - Delete store option

#### **app.view-stores.jsx** - Store Management
- **Purpose:** Main store listing with filtering, search, and bulk operations
- **Features:**
  - IndexTable with pagination (50 per page)
  - Filters: search query, hasCoordinates, hasPhone, hasLink, state, city
  - Saved views (tabs)
  - Bulk delete
  - Export (all, filtered, current page, selected)
  - CSV import modal
  - Real-time URL-based filtering

#### **app.submissions.jsx** - Store Submissions
- **Purpose:** Review and approve/reject dealer submissions
- **Features:**
  - Submission list with status badges
  - Review modal with full submission details
  - Approve (creates Store) or Reject workflow
  - Admin notes (sent in emails)
  - Analytics cards (total, pending, approved, rejected)
  - Plan limit checking before approval

#### **app.choropleth.jsx** - Distribution Map
- **Purpose:** Visual state-based store distribution map
- **Features:**
  - Choropleth map showing store density by state
  - Click states to filter stores
  - Analytics overlay

#### **app.billing.jsx** - Billing
- **Purpose:** Shopify billing integration
- **Features:**
  - Plan selection (Free, Basic, Pro, Partner)
  - Subscription management
  - Plan limits display

#### **app.support.jsx** - Support
- **Purpose:** Self-help resources and support request form
- **Features:**
  - Documentation links
  - Support request form (sends email via SendGrid)
  - Legal links (Privacy, GDPR, Terms)

#### **app.gdpr.jsx** - GDPR Compliance
- **Purpose:** Data export and deletion for merchants
- **Features:**
  - Export all shop data (JSON)
  - Delete all shop data
  - GDPR compliance tools

#### **app.export-stores.jsx** - Export Endpoint
- **Purpose:** Server-side CSV export
- **Features:**
  - Supports scopes: all, filtered, current, selected
  - Respects all filters from URL params
  - Returns CSV with proper headers

### App Proxy Routes (Public Storefront)
Routes under `/app-proxy/storetrail/*` are publicly accessible via Shopify app proxy

#### **app-proxy.storetrail.locations.jsx** - Store Search API
- **Purpose:** Find stores near a location
- **Method:** GET
- **Params:** `lat`, `lng`, `radius` (km), `shop`
- **Returns:** JSON array of stores with distance
- **Features:**
  - Haversine distance calculation
  - Bounding box optimization for large radius
  - Radius limit (5000km max)

#### **app-proxy.storetrail.analytics.jsx** - Analytics Tracking
- **Purpose:** Receive analytics events from storefront
- **Method:** POST
- **Params:** `shop` (from authenticated URL)
- **Body:** Event JSON (eventType, sessionId, eventData)
- **Returns:** Success/error response
- **Features:**
  - Validates event types
  - Stores in StoreAnalyticsEvent table
  - Non-blocking (errors don't break storefront)

#### **app-proxy.storetrail.geocode.jsx** - Geocoding
- **Purpose:** Convert address to coordinates
- **Method:** GET
- **Params:** `address`
- **Returns:** `{lat, lng}` or error
- **Features:**
  - Uses Google Maps Geocoding API
  - Fallback to OpenStreetMap if needed

#### **app-proxy.storetrail.dealer-submission.jsx** - Submission Form
- **Purpose:** Accept dealer submissions from storefront
- **Method:** POST
- **Body:** Submission form data
- **Returns:** Success/error response
- **Features:**
  - Creates StoreSubmission with PENDING status
  - Sends notification emails

### Webhook Routes

#### **webhooks.app.uninstalled.jsx**
- **Purpose:** Clean up all shop data on app uninstall
- **Actions:**
  - Delete Session
  - Delete all Stores, Submissions, SavedViews, Analytics
  - Idempotent (safe to run multiple times)

#### **webhooks.app.scopes_update.jsx**
- **Purpose:** Handle scope changes
- **Actions:** Update session scopes

#### **webhooks.customers.data_request.jsx** (Compliance)
- **Purpose:** GDPR - Customer data request
- **Actions:** Acknowledge (app doesn't collect customer data)
- **Returns:** 200 (or 401 for invalid HMAC)

#### **webhooks.customers.redact.jsx** (Compliance)
- **Purpose:** GDPR - Customer data deletion
- **Actions:** Acknowledge (app doesn't collect customer data)
- **Returns:** 200 (or 401 for invalid HMAC)

#### **webhooks.shop.redact.jsx** (Compliance)
- **Purpose:** GDPR - Shop data deletion (48 hours after uninstall)
- **Actions:** Delete all shop data (same as uninstalled)
- **Returns:** 200 (or 401 for invalid HMAC)

### Public Routes

#### **terms-of-service.jsx** - Terms of Service
- **Purpose:** Display terms of service
- **Access:** Public

#### **privacy-policy.jsx** - Privacy Policy
- **Purpose:** Display privacy policy
- **Access:** Public

---

## 🔧 Helper Functions

### **emailManager.js** - Email System
- **Service:** SendGrid
- **Functions:**
  - `sendEmail()` - Generic email sender
  - `sendSubmissionApprovedEmail()` - Approval notifications
  - `sendSubmissionRejectedEmail()` - Rejection notifications
  - `sendSupportRequestEmail()` - Support requests
- **Configuration:**
  - `FROM_EMAIL` = `noreply@mx.storetrail.app` (required by SendGrid)
  - `FROM_NAME` = `Storetrail`
  - `SUPPORT_EMAIL` = `help@storetrail.app`
  - `REPLY_TO` = `help@storetrail.app`
- **Email Recipients:**
  - Approval/Rejection: Submitter email + Support team
  - Support requests: Support team only

### **planLimits.js** - Billing & Plan Limits
- **Plans:**
  - **FREE:** 10 stores
  - **BASIC:** 500 stores
  - **PRO:** Unlimited
  - **PARTNER:** Unlimited
- **Important:** All features are available on all plans. Only store location count is restricted.
- **Functions:**
  - `checkStoreLimit()` - Check if can add stores (ONLY restriction)
  - `validateImportSize()` - Validate CSV import size against location limit
  - `getPlanFeatures()` - Returns feature list (not currently enforced)
  - `checkStoreLimitCached()` - Cached version

### **geoUtils.js** - Geographic Utilities
- **Functions:**
  - `haversineDistance()` - Calculate distance between coordinates
  - `getBoundingBox()` - Get bounding box for radius search

### **fetchCoords.js** - Geocoding
- **Purpose:** Convert address to coordinates
- **Services:** Google Maps API (primary), OpenStreetMap (fallback)

### **validateForm.js** - Form Validation
- **Purpose:** Validate store submission forms
- **Validations:** Required fields, phone format, email format

### **featureGating.js** - Feature Access Control
- **Purpose:** Control feature access by plan
- **Features:** analytics, priority_support, api_access, etc.

### **states.js** - US States List
- **Purpose:** State dropdown options for forms

---

## 🎨 Theme Extensions

### **store-locator-block** (Theme App Extension)
- **Location:** `extensions/store-locator-block/`
- **Blocks:**
  - **store-locator.liquid** - Main store locator widget
  - **submission-form.liquid** - Dealer submission form
- **Assets:**
  - `analytics-tracking.js` - Analytics event tracking (sessionStorage-based)
  - `haversineDistance.js` - Distance calculations
  - CSS files: base, components, layout, form, responsive
- **Features:**
  - Google Maps integration (merchant provides API key)
  - Location search with autocomplete
  - Radius selection
  - Store list with distance
  - Interactive map with markers
  - Analytics tracking (search, store_view, store_contact, radius_change)

---

## 📧 Email System

### Email Types

1. **Submission Approved**
   - **To Submitter:** Approval confirmation (NO admin notes)
   - **To Support:** Notification with admin notes
   - **Trigger:** Store submission approved

2. **Submission Rejected**
   - **To Submitter:** Rejection notice WITH admin notes
   - **To Support:** Notification with admin notes
   - **Trigger:** Store submission rejected

3. **Support Request**
   - **To Support:** Support request details
   - **Trigger:** Merchant submits support form

### Email Configuration
- **Provider:** SendGrid
- **From:** `noreply@mx.storetrail.app` (required by SendGrid)
- **Reply-To:** `help@storetrail.app`
- **Support Email:** `help@storetrail.app`

---

## 🔐 Security & Compliance

### GDPR Compliance
- ✅ All 3 mandatory webhooks implemented
- ✅ HMAC verification on all webhooks
- ✅ Shop-scoped data (multi-tenancy)
- ✅ Data deletion on uninstall/redact
- ✅ No customer data collected (only merchant/store data)

### Data Isolation
- **All queries MUST filter by `shop` field**
- **No cross-shop data access**
- **Session validation on all admin routes**

### Webhook Security
- Uses `authenticate.webhook()` from shopify-app-remix
- Returns 401 for invalid HMAC (automatic via Remix)
- All webhooks properly authenticated

---

## 🚀 Key Features

### 1. Store Management
- Add/edit/delete stores
- Bulk import/export (CSV)
- Advanced filtering and search
- Saved filter views
- Geocoding (auto or manual)

### 2. Dealer Submissions
- Public submission form
- Admin review workflow
- Email notifications
- Admin notes system

### 3. Analytics
- Search tracking (anonymous)
- Store view tracking
- Contact action tracking (phone/website clicks)
- Radius change tracking
- 30-day analytics dashboard
- Top queries and stores

### 4. Distribution Map
- Choropleth map by state
- Interactive state filtering
- Store density visualization

### 5. Billing Integration
- Shopify billing API
- Plan-based limits
- Feature gating

---

## ⚙️ Configuration

### **shopify.app.toml**
- **App Name:** Storetrail
- **Client ID:** fc0568978e5a7a64c4020dc35c935330
- **Scopes:** `write_app_proxy,write_themes`
- **Webhooks:**
  - Compliance: customers/data_request, customers/redact, shop/redact
  - Lifecycle: app/uninstalled, app/scopes_update
- **App Proxy:** `/app-proxy/storetrail` (prefix: `apps`, subpath: `storetrail`)

### Environment Variables
- `SENDGRID_API_KEY` - SendGrid API key
- `FROM_EMAIL` - `noreply@mx.storetrail.app`
- `FROM_NAME` - `Storetrail`
- `SUPPORT_EMAIL` - `help@storetrail.app`
- `REPLY_TO` - `help@storetrail.app`
- `CONTACT_URL` - `https://storetrail.app/support`
- `SHOPIFY_CLIENT_ID` - App client ID
- `SHOPIFY_API_SECRET` - App secret
- `PRISMA_POSTGRES_DATABASE_URL_DEV` - Database URL

---

## 📦 Dependencies

### Core
- `@shopify/shopify-app-remix` - Shopify app framework
- `@shopify/polaris` - UI components
- `@shopify/app-bridge-react` - App Bridge integration
- `@prisma/client` - Database ORM
- `@sendgrid/mail` - Email service

### Utilities
- `papaparse` - CSV parsing
- `@googlemaps/js-api-loader` - Google Maps
- `libphonenumber-js` - Phone validation

---

## 🔄 Data Flow

### Store Creation Flow
1. Merchant adds store → `app.add-store.jsx`
2. Form validation → `validateForm.js`
3. Geocoding (if needed) → `fetchCoords.js`
4. Plan limit check → `planLimits.js`
5. Create Store → Database
6. Update dashboard

### Submission Approval Flow
1. Dealer submits → `app-proxy.storetrail.dealer-submission.jsx`
2. Creates StoreSubmission (PENDING)
3. Admin reviews → `app.submissions.jsx`
4. Approve → Creates Store + Updates submission (APPROVED)
5. Email notifications → `emailManager.js`

### Analytics Flow
1. Customer uses store locator → Theme extension
2. Events tracked → `analytics-tracking.js` (sessionStorage)
3. POST to → `app-proxy.storetrail.analytics.jsx`
4. Stored in → `StoreAnalyticsEvent`
5. Aggregated → Dashboard display

---

## 🎯 Important Notes

### Multi-Tenancy
- **CRITICAL:** All database queries MUST filter by `shop` field
- Never query without shop filter
- Session always contains `session.shop`

### GDPR Compliance
- App does NOT collect customer data
- Only merchant/store location data
- All compliance webhooks return 200 (acknowledge, no data)

### Analytics Privacy
- Uses sessionStorage (not cookies)
- Anonymous session IDs only
- No PII collected
- No Google Analytics

### Email System
- SendGrid requires FROM email: `noreply@mx.storetrail.app`
- Admin notes sent to support team, NOT to submitter in approval emails
- Admin notes sent to submitter in rejection emails

### Plan Limits
- **Free:** 10 stores
- **Basic:** 500 stores
- **Pro/Partner:** Unlimited
- **Important:** All features are available on all plans. Only store location count is restricted.
- Limits enforced on add, import, and approval

---

## 📝 File Structure

```
app/
├── routes/
│   ├── app.*.jsx          # Admin routes
│   ├── app-proxy.*.jsx    # Public storefront API
│   ├── webhooks.*.jsx     # Webhook handlers
│   └── *.jsx              # Public pages
├── helper/
│   ├── emailManager.js    # Email system
│   ├── planLimits.js      # Billing/limits
│   ├── geoUtils.js        # Geography
│   └── ...                # Other utilities
└── components/
    └── modals.jsx         # Shared modals

extensions/
└── store-locator-block/   # Theme extension
    ├── blocks/            # Liquid blocks
    └── assets/            # JS/CSS

prisma/
└── schema.prisma          # Database schema
```

---

This document serves as a complete reference for the StoreTrail Shopify app codebase. Use it when working on the website or making changes to the app.

