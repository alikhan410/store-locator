/**
 * Feature Gating System
 * Controls access to features based on user's subscription plan
 */

import { getPlanLimits, getPlanFeatures } from './planLimits';

// Feature definitions with their plan requirements
export const FEATURES = {
  // Basic features available to all plans
  BASIC_STORE_MANAGEMENT: 'basic_store_management',
  GOOGLE_MAPS_INTEGRATION: 'google_maps_integration',
  
  // Premium features that require paid plans
  CSV_IMPORT: 'csv_import',
  CSV_EXPORT: 'csv_export',
  ADVANCED_SEARCH: 'advanced_search',
  ANALYTICS: 'analytics',
  PRIORITY_SUPPORT: 'priority_support',
  WHITE_LABEL: 'white_label',
  CUSTOM_CSS: 'custom_css',
  API_ACCESS: 'api_access',
  GOOGLE_SHEETS_SYNC: 'google_sheets_sync',
  PRODUCT_FILTERING: 'product_filtering',
  BULK_OPERATIONS: 'bulk_operations',
  ADVANCED_CUSTOMIZATION: 'advanced_customization',
  MULTI_LANGUAGE: 'multi_language',
  DEALER_SUBMISSION_FORM: 'dealer_submission_form',
  CHOROPLETH: 'choropleth',
};

// Feature descriptions for upgrade prompts
export const FEATURE_DESCRIPTIONS = {
  [FEATURES.CSV_IMPORT]: 'Bulk import stores from CSV files',
  [FEATURES.CSV_EXPORT]: 'Export all stores to CSV format',
  [FEATURES.ADVANCED_SEARCH]: 'Advanced filtering and search options',
  [FEATURES.ANALYTICS]: 'Store performance analytics and reporting',
  [FEATURES.PRIORITY_SUPPORT]: 'Priority email and phone support',
  [FEATURES.WHITE_LABEL]: 'Remove "Powered by" branding',
  [FEATURES.CUSTOM_CSS]: 'Custom CSS styling options',
  [FEATURES.API_ACCESS]: 'API access for integrations',
  [FEATURES.GOOGLE_SHEETS_SYNC]: 'Sync with Google Sheets',
  [FEATURES.PRODUCT_FILTERING]: 'Filter stores by product availability',
  [FEATURES.BULK_OPERATIONS]: 'Bulk edit and delete operations',
  [FEATURES.ADVANCED_CUSTOMIZATION]: 'Advanced theme and layout options',
  [FEATURES.MULTI_LANGUAGE]: 'Multi-language support',
  [FEATURES.DEALER_SUBMISSION_FORM]: 'Public dealer submission form with admin workflow',
  [FEATURES.CHOROPLETH]: 'Store distribution choropleth map',
};

/**
 * Check if a feature is enabled for the given plan
 * @param {string} feature - Feature key from FEATURES object
 * @param {string} planName - Subscription plan name
 * @returns {boolean} True if feature is enabled
 */
export const isFeatureEnabled = (feature, planName) => {
  if (!feature || !planName) return false;
  
  const planFeatures = getPlanFeatures(planName);
  return planFeatures.includes(feature);
};

/**
 * Check if a feature is enabled for the current subscription
 * @param {string} feature - Feature key from FEATURES object
 * @param {Object} subscription - Shopify subscription object
 * @returns {boolean} True if feature is enabled
 */
export const isFeatureEnabledForSubscription = (feature, subscription) => {
  if (!subscription || subscription.status !== 'ACTIVE') {
    return false;
  }
  
  return isFeatureEnabled(feature, subscription.name);
};

/**
 * Get upgrade prompt for a feature
 * @param {string} feature - Feature key from FEATURES object
 * @param {string} currentPlan - Current plan name
 * @returns {Object} Upgrade prompt information
 */
export const getUpgradePrompt = (feature, currentPlan) => {
  const featureDescription = FEATURE_DESCRIPTIONS[feature];
  
  // Determine which plan unlocks this feature
  let requiredPlan = 'Basic';
  if ([FEATURES.ANALYTICS, FEATURES.PRIORITY_SUPPORT, FEATURES.API_ACCESS, 
       FEATURES.GOOGLE_SHEETS_SYNC, FEATURES.PRODUCT_FILTERING, FEATURES.DEALER_SUBMISSION_FORM, FEATURES.CHOROPLETH].includes(feature)) {
    requiredPlan = 'Pro';
  }
  
  return {
    feature,
    featureDescription,
    currentPlan,
    requiredPlan,
    message: `${featureDescription} is available on the ${requiredPlan} plan and higher.`,
    upgradeUrl: `/app/billing?feature=${feature}`,
  };
};

/**
 * Get all features that require upgrade for current plan
 * @param {string} planName - Current plan name
 * @returns {Array} Array of features requiring upgrade
 */
export const getFeaturesRequiringUpgrade = (planName) => {
  const currentFeatures = getPlanFeatures(planName);
  const allFeatures = Object.values(FEATURES);
  
  return allFeatures.filter(feature => !currentFeatures.includes(feature));
};

/**
 * Get feature access summary for a plan
 * @param {string} planName - Plan name
 * @returns {Object} Feature access summary
 */
export const getFeatureAccessSummary = (planName) => {
  const planFeatures = getPlanFeatures(planName);
  const allFeatures = Object.values(FEATURES);
  
  return {
    enabled: planFeatures,
    disabled: allFeatures.filter(feature => !planFeatures.includes(feature)),
    total: allFeatures.length,
    enabledCount: planFeatures.length,
    disabledCount: allFeatures.length - planFeatures.length,
  };
};

/**
 * Feature gate hook for React components
 * @param {string} feature - Feature key
 * @param {Object} subscription - Subscription object
 * @returns {Object} Feature gate state and helpers
 */
export const useFeatureGate = (feature, subscription) => {
  const isEnabled = isFeatureEnabledForSubscription(feature, subscription);
  const upgradePrompt = isEnabled ? null : getUpgradePrompt(feature, subscription?.name);
  
  return {
    isEnabled,
    upgradePrompt,
    feature,
    subscription,
  };
};

/**
 * Check multiple features at once
 * @param {Array} features - Array of feature keys
 * @param {Object} subscription - Subscription object
 * @returns {Object} Object with feature status for each feature
 */
export const checkMultipleFeatures = (features, subscription) => {
  const result = {};
  
  features.forEach(feature => {
    result[feature] = {
      enabled: isFeatureEnabledForSubscription(feature, subscription),
      upgradePrompt: isFeatureEnabledForSubscription(feature, subscription) 
        ? null 
        : getUpgradePrompt(feature, subscription?.name),
    };
  });
  
  return result;
};

/**
 * Get plan recommendations based on feature usage
 * @param {Array} desiredFeatures - Array of desired feature keys
 * @param {string} currentPlan - Current plan name
 * @returns {Object} Plan recommendation
 */
export const getPlanRecommendation = (desiredFeatures, currentPlan) => {
  const currentFeatures = getPlanFeatures(currentPlan);
  const missingFeatures = desiredFeatures.filter(feature => !currentFeatures.includes(feature));
  
  if (missingFeatures.length === 0) {
    return {
      recommended: currentPlan,
      reason: 'All desired features are available on your current plan',
      missingFeatures: [],
    };
  }
  
  // Determine which plan would cover all desired features
  const basicFeatures = ['csv_import', 'csv_export', 'advanced_search', 'white_label'];
  const proFeatures = ['analytics', 'priority_support', 'api_access', 'google_sheets_sync', 'product_filtering'];
  
  const needsPro = missingFeatures.some(feature => proFeatures.includes(feature));
  const needsBasic = missingFeatures.some(feature => basicFeatures.includes(feature));
  
  let recommended = 'Free';
  if (needsPro) {
    recommended = 'Pro';
  } else if (needsBasic) {
    recommended = 'Basic';
  }
  
  return {
    recommended,
    reason: `Upgrade to ${recommended} plan to access: ${missingFeatures.map(f => FEATURE_DESCRIPTIONS[f]).join(', ')}`,
    missingFeatures,
  };
};

// Export default for convenience
export default {
  FEATURES,
  FEATURE_DESCRIPTIONS,
  isFeatureEnabled,
  isFeatureEnabledForSubscription,
  getUpgradePrompt,
  getFeaturesRequiringUpgrade,
  getFeatureAccessSummary,
  useFeatureGate,
  checkMultipleFeatures,
  getPlanRecommendation,
}; 