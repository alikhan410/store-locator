/**
 * Plan limits configuration and utilities
 * Centralizes all plan-related logic to avoid duplication
 */

// Allow environment variable overrides for testing/different environments
const getPlanLimit = (defaultLimit, envKey) => {
  // Only access process.env on server-side
  const envValue = typeof process !== 'undefined' ? process.env[envKey] : undefined;
  return envValue ? parseInt(envValue, 10) : defaultLimit;
};

/**
 * Plan Limits Configuration
 * Note: All plans now have the same features.
 * Plans differ only by store limits:
 * - FREE: 10 stores
 * - BASIC: 500 stores
 * - PRO: Unlimited stores (-1)
 * - PARTNER: Unlimited stores (-1)
 */
export const PLAN_LIMITS = {
  FREE: {
    name: 'free',
    storeLimit: getPlanLimit(10, 'FREE_PLAN_STORE_LIMIT'),
    features: ['basic_store_management', 'google_maps_integration', 'csv_import', 'csv_export', 'advanced_search', 'white_label', 'custom_css', 'bulk_operations', 'dealer_submission_form', 'choropleth']
  },
  BASIC: {
    name: 'basic', 
    storeLimit: getPlanLimit(500, 'BASIC_PLAN_STORE_LIMIT'),
    features: ['basic_store_management', 'google_maps_integration', 'csv_import', 'csv_export', 'advanced_search', 'white_label', 'custom_css', 'bulk_operations', 'dealer_submission_form', 'choropleth']
  },
  PRO: {
    name: 'pro',
    storeLimit: getPlanLimit(-1, 'PRO_PLAN_STORE_LIMIT'), // -1 means unlimited
    features: ['basic_store_management', 'google_maps_integration', 'csv_import', 'csv_export', 'advanced_search', 'white_label', 'custom_css', 'bulk_operations', 'dealer_submission_form', 'choropleth']
  },
  PARTNER: {
    name: 'partner',
    storeLimit: getPlanLimit(-1, 'PARTNER_PLAN_STORE_LIMIT'), // -1 means unlimited
    features: ['basic_store_management', 'google_maps_integration', 'csv_import', 'csv_export', 'advanced_search', 'white_label', 'custom_css', 'bulk_operations', 'dealer_submission_form', 'choropleth']
  }
};

/**
 * Get plan limits by subscription name
 * @param {string} planName - The subscription plan name
 * @returns {Object} Plan configuration or null if invalid
 */
export const getPlanLimits = (planName) => {
  if (!planName) return PLAN_LIMITS.FREE; // Default to free plan if no plan name
  
  const normalizedName = planName.toLowerCase();
  
  // Direct match with our plan names
  for (const [key, plan] of Object.entries(PLAN_LIMITS)) {
    if (plan.name.toLowerCase() === normalizedName) {
      return plan;
    }
  }
  
  // If no exact match, default to free plan
  console.warn(`Unknown plan name: "${planName}", defaulting to free plan`);
  return PLAN_LIMITS.FREE;
};

/**
 * Check if user can add more stores
 * @param {Object} subscription - Shopify subscription object
 * @param {number} currentStoreCount - Current number of stores
 * @returns {Object} Result with canAdd, remaining, limit, and error message
 */
export const checkStoreLimit = (subscription, currentStoreCount) => {
  // If no subscription or inactive, treat as free plan
  if (!subscription || subscription.status !== 'ACTIVE') {
    const freePlan = PLAN_LIMITS.FREE;
    const remaining = Math.max(freePlan.storeLimit - currentStoreCount, 0);
    
    return {
      canAdd: remaining > 0,
      remaining,
      limit: freePlan.storeLimit,
      error: remaining === 0 
        ? `You've reached the limit of ${freePlan.storeLimit} stores for the free plan. Please upgrade to add more stores.`
        : null
    };
  }

  const plan = getPlanLimits(subscription.name);
  const remaining = plan.storeLimit === -1 ? -1 : Math.max(plan.storeLimit - currentStoreCount, 0);
  
  return {
    canAdd: plan.storeLimit === -1 || remaining > 0,
    remaining: plan.storeLimit === -1 ? 'Unlimited' : remaining,
    limit: plan.storeLimit === -1 ? 'Unlimited' : plan.storeLimit,
    error: (plan.storeLimit !== -1 && remaining === 0)
      ? `You've reached the limit of ${plan.storeLimit} stores for your current plan.`
      : null
  };
};

/**
 * Validate import size against plan limits
 * @param {Object} subscription - Shopify subscription object
 * @param {number} currentStoreCount - Current number of stores
 * @param {number} importSize - Number of stores to import
 * @returns {Object} Result with allowedImport, skipped, and error message
 */
export const validateImportSize = (subscription, currentStoreCount, importSize) => {
  const limitCheck = checkStoreLimit(subscription, currentStoreCount);
  
  if (!limitCheck.canAdd) {
    return {
      allowedImport: 0,
      skipped: importSize,
      error: limitCheck.error
    };
  }

  const allowedImport = Math.min(importSize, limitCheck.remaining);
  const skipped = importSize - allowedImport;

  return {
    allowedImport,
    skipped,
    error: skipped > 0 
      ? `${skipped} store(s) skipped due to plan limit of ${limitCheck.limit}`
      : null
  };
};

/**
 * Get plan features for display
 * @param {string} planName - The subscription plan name
 * @returns {Array} Array of feature names
 */
export const getPlanFeatures = (planName) => {
  const plan = getPlanLimits(planName);
  return plan ? plan.features : [];
};

// Simple cache for plan limit checks to reduce database queries
const planLimitCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Cached version of checkStoreLimit for better performance
 * @param {Object} subscription - Shopify subscription object
 * @param {number} currentStoreCount - Current number of stores
 * @param {string} shop - Shop domain for cache key
 * @returns {Object} Result with canAdd, remaining, limit, and error message
 */
export const checkStoreLimitCached = (subscription, currentStoreCount, shop) => {
  const cacheKey = `${shop}-${subscription?.name}-${currentStoreCount}`;
  const cached = planLimitCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  
  const result = checkStoreLimit(subscription, currentStoreCount);
  planLimitCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });
  
  return result;
};

/**
 * Clear the plan limit cache (useful for testing or when limits change)
 */
export const clearPlanLimitCache = () => {
  planLimitCache.clear();
}; 