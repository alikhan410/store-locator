/**
 * Plan limits configuration and utilities
 * Centralizes all plan-related logic to avoid duplication
 */

// Allow environment variable overrides for testing/different environments
const getPlanLimit = (defaultLimit, envKey) => {
  const envValue = process.env[envKey];
  return envValue ? parseInt(envValue, 10) : defaultLimit;
};

export const PLAN_LIMITS = {
  FREE: {
    name: 'Free Plan',
    storeLimit: getPlanLimit(5, 'FREE_PLAN_STORE_LIMIT'),
    features: ['basic_store_management', 'google_maps_integration']
  },
  STARTUP: {
    name: 'startup', 
    storeLimit: getPlanLimit(50, 'STARTUP_PLAN_STORE_LIMIT'),
    features: ['basic_store_management', 'google_maps_integration', 'csv_import', 'advanced_search']
  },
  PRO: {
    name: 'pro',
    storeLimit: getPlanLimit(500, 'PRO_PLAN_STORE_LIMIT'),
    features: ['basic_store_management', 'google_maps_integration', 'csv_import', 'advanced_search', 'analytics', 'priority_support']
  }
};

/**
 * Get plan limits by subscription name
 * @param {string} planName - The subscription plan name
 * @returns {Object} Plan configuration or null if invalid
 */
export const getPlanLimits = (planName) => {
  if (!planName) return null;
  
  const normalizedName = planName.toLowerCase();
  
  for (const [key, plan] of Object.entries(PLAN_LIMITS)) {
    if (plan.name.toLowerCase() === normalizedName) {
      return plan;
    }
  }
  
  return null;
};

/**
 * Check if user can add more stores
 * @param {Object} subscription - Shopify subscription object
 * @param {number} currentStoreCount - Current number of stores
 * @returns {Object} Result with canAdd, remaining, limit, and error message
 */
export const checkStoreLimit = (subscription, currentStoreCount) => {
  if (!subscription || subscription.status !== 'ACTIVE') {
    return {
      canAdd: false,
      remaining: 0,
      limit: 0,
      error: 'No active subscription found. Please subscribe or activate your plan.'
    };
  }

  const plan = getPlanLimits(subscription.name);
  if (!plan) {
    return {
      canAdd: false,
      remaining: 0,
      limit: 0,
      error: 'Unknown subscription plan.'
    };
  }

  const remaining = Math.max(plan.storeLimit - currentStoreCount, 0);
  
  return {
    canAdd: remaining > 0,
    remaining,
    limit: plan.storeLimit,
    error: remaining === 0 
      ? `You've reached the limit of ${plan.storeLimit} stores for your ${subscription.name}.`
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