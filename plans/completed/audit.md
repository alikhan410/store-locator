## Cursor AI Prompt: Audit and Roadmap for Shopify App Migration to Marketplace

**Goal:**
Audit the current single-store Shopify app codebase and generate a migration roadmap to turn it into a database-driven, multi-tenant Shopify app suitable for the Shopify App Store.

**Prompt for Cursor AI Agent:**

---

**Audit Objective:**
Review the codebase and configuration of this Shopify app and create a migration plan to evolve it from a single-store app using local JSON array storage into a database-backed, multi-tenant Shopify marketplace app. 

**Key Migration Goals:**
1. Add support for OAuth-based multi-store authentication
2. Replace JSON-based data with a proper database model (preferably Postgres via Supabase)
3. Implement store-specific API token storage and access
4. Add per-store data isolation and routing
5. Integrate Shopify webhook handling
6. Comply with Shopify’s app store requirements
7. Create internal tooling to view/manage stores and their data

**Tasks for You (Cursor AI):**
- Audit the current app’s structure and identify:
  - Where JSON data is stored or manipulated
  - Hardcoded store-specific logic
  - Any lack of token or store-aware handling
- Propose a migration roadmap checklist in `./plans/shopify-app-migration-checklist.md` with the following sections:
  
### 1. Authentication Layer
- Add Shopify OAuth 2.0 flow
- Store per-store access tokens securely
- Create `stores` table with shop domains and tokens

### 2. Data Model
- Design a Postgres schema with tables that reference `store_id`
- Refactor all functions to be store-aware
- Remove JSON blob dependencies

### 3. Webhooks
- Register per-store webhooks after installation
- Add webhook handlers and signature validation
- Add cleanup flow on `app/uninstalled`

### 4. App Proxy / Client-Side Optimization
- Identify any use of app proxy
- Propose CDN caching or metafields caching where helpful

### 5. Shopify App Store Compliance
- Ensure embedded app setup using App Bridge
- Create onboarding screen and uninstall handling
- Implement Shopify Billing API if needed

### 6. Deployment Checklist
- Secure FastAPI deployment
- Add rate limiting and logging per store
- Add Redis cache layer if needed

### 7. Developer Notes
- Document assumptions
- List any TODOs or open questions

---

**Output Path:** `./plans/shopify-app-migration-checklist.md`

**Reminder:** This is a multi-tenant architecture migration. Data privacy and isolation per store is critical. All stateful logic must reference `store_id` or `shop` domain.

---

You may now begin the audit and roadmap proposal. Use best practices for Shopify embedded apps, FastAPI service patterns, and database normalization.
