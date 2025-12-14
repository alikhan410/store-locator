import { describe, it, expect, beforeEach } from 'vitest';
import { 
  FEATURES,
  FEATURE_DESCRIPTIONS,
  isFeatureEnabled,
  isFeatureEnabledForSubscription,
  getUpgradePrompt,
  getFeaturesRequiringUpgrade,
  getFeatureAccessSummary,
  checkMultipleFeatures,
  getPlanRecommendation
} from '../../../app/helper/featureGating';

describe('Feature Gating System', () => {
  describe('FEATURES', () => {
    it('should have all required features defined', () => {
      expect(FEATURES.BASIC_STORE_MANAGEMENT).toBe('basic_store_management');
      expect(FEATURES.CSV_IMPORT).toBe('csv_import');
      expect(FEATURES.CSV_EXPORT).toBe('csv_export');
      expect(FEATURES.ANALYTICS).toBe('analytics');
      expect(FEATURES.WHITE_LABEL).toBe('white_label');
    });

    it('should have descriptions for all features', () => {
      Object.values(FEATURES).forEach(feature => {
        expect(FEATURE_DESCRIPTIONS[feature]).toBeDefined();
        expect(typeof FEATURE_DESCRIPTIONS[feature]).toBe('string');
      });
    });
  });

  describe('isFeatureEnabled', () => {
    it('should return true for features available in plan', () => {
      expect(isFeatureEnabled('basic_store_management', 'free')).toBe(true);
      expect(isFeatureEnabled('csv_import', 'startup')).toBe(true);
      expect(isFeatureEnabled('analytics', 'pro')).toBe(true);
    });

    it('should return false for features not available in plan', () => {
      expect(isFeatureEnabled('csv_import', 'free')).toBe(false);
      expect(isFeatureEnabled('analytics', 'free')).toBe(false);
      expect(isFeatureEnabled('analytics', 'startup')).toBe(false);
    });

    it('should handle invalid inputs', () => {
      expect(isFeatureEnabled(null, 'free')).toBe(false);
      expect(isFeatureEnabled('csv_import', null)).toBe(false);
      expect(isFeatureEnabled('', 'free')).toBe(false);
      expect(isFeatureEnabled('csv_import', '')).toBe(false);
    });
  });

  describe('isFeatureEnabledForSubscription', () => {
    const mockActiveSubscription = (name) => ({
      name,
      status: 'ACTIVE'
    });

    const mockInactiveSubscription = (name) => ({
      name,
      status: 'INACTIVE'
    });

    it('should return true for enabled features with active subscription', () => {
      expect(isFeatureEnabledForSubscription('basic_store_management', mockActiveSubscription('free'))).toBe(true);
      expect(isFeatureEnabledForSubscription('csv_import', mockActiveSubscription('startup'))).toBe(true);
      expect(isFeatureEnabledForSubscription('analytics', mockActiveSubscription('pro'))).toBe(true);
    });

    it('should return false for disabled features with active subscription', () => {
      expect(isFeatureEnabledForSubscription('csv_import', mockActiveSubscription('free'))).toBe(false);
      expect(isFeatureEnabledForSubscription('analytics', mockActiveSubscription('startup'))).toBe(false);
    });

    it('should return false for inactive subscription', () => {
      expect(isFeatureEnabledForSubscription('basic_store_management', mockInactiveSubscription('free'))).toBe(false);
      expect(isFeatureEnabledForSubscription('csv_import', mockInactiveSubscription('startup'))).toBe(false);
    });

    it('should handle null/undefined subscription', () => {
      expect(isFeatureEnabledForSubscription('basic_store_management', null)).toBe(false);
      expect(isFeatureEnabledForSubscription('basic_store_management', undefined)).toBe(false);
    });
  });

  describe('getUpgradePrompt', () => {
    it('should return correct upgrade prompt for Basic features', () => {
      const prompt = getUpgradePrompt('csv_import', 'free');
      expect(prompt.feature).toBe('csv_import');
      expect(prompt.currentPlan).toBe('free');
      expect(prompt.requiredPlan).toBe('Basic');
      expect(prompt.message).toContain('Bulk import stores from CSV files');
    });

    it('should return correct upgrade prompt for Pro features', () => {
      const prompt = getUpgradePrompt('analytics', 'free');
      expect(prompt.feature).toBe('analytics');
      expect(prompt.currentPlan).toBe('free');
      expect(prompt.requiredPlan).toBe('Pro');
      expect(prompt.message).toContain('Store performance analytics and reporting');
    });

    it('should handle unknown features', () => {
      const prompt = getUpgradePrompt('unknown_feature', 'free');
      expect(prompt.feature).toBe('unknown_feature');
      expect(prompt.requiredPlan).toBe('Basic');
    });
  });

  describe('getFeaturesRequiringUpgrade', () => {
    it('should return all features requiring upgrade for free plan', () => {
      const features = getFeaturesRequiringUpgrade('free');
      expect(features).toContain('csv_import');
      expect(features).toContain('csv_export');
      expect(features).toContain('analytics');
      expect(features).toContain('white_label');
    });

    it('should return only Pro features for basic plan', () => {
      const features = getFeaturesRequiringUpgrade('basic');
      expect(features).toContain('analytics');
      expect(features).toContain('api_access');
      expect(features).not.toContain('csv_import'); // Should be available
    });

    it('should return empty array for pro plan', () => {
      const features = getFeaturesRequiringUpgrade('pro');
      expect(features).toEqual([]);
    });
  });

  describe('getFeatureAccessSummary', () => {
    it('should return correct summary for free plan', () => {
      const summary = getFeatureAccessSummary('free');
      expect(summary.enabled).toContain('basic_store_management');
      expect(summary.enabled).toContain('google_maps_integration');
      expect(summary.disabled).toContain('csv_import');
      expect(summary.disabled).toContain('analytics');
      expect(summary.enabledCount).toBe(2);
      expect(summary.disabledCount).toBeGreaterThan(0);
    });

    it('should return correct summary for basic plan', () => {
      const summary = getFeatureAccessSummary('basic');
      expect(summary.enabled).toContain('csv_import');
      expect(summary.enabled).toContain('csv_export');
      expect(summary.disabled).toContain('analytics');
      expect(summary.enabledCount).toBeGreaterThan(2);
    });

    it('should return correct summary for pro plan', () => {
      const summary = getFeatureAccessSummary('pro');
      expect(summary.enabled).toContain('analytics');
      expect(summary.enabled).toContain('api_access');
      expect(summary.disabled).toEqual([]);
      expect(summary.disabledCount).toBe(0);
    });
  });

  describe('checkMultipleFeatures', () => {
    const mockSubscription = (name) => ({
      name,
      status: 'ACTIVE'
    });

    it('should check multiple features correctly', () => {
      const result = checkMultipleFeatures(
        ['basic_store_management', 'csv_import', 'analytics'],
        mockSubscription('basic')
      );

      expect(result.basic_store_management.enabled).toBe(true);
      expect(result.csv_import.enabled).toBe(true);
      expect(result.analytics.enabled).toBe(false);
      expect(result.analytics.upgradePrompt).toBeDefined();
    });

    it('should handle empty features array', () => {
      const result = checkMultipleFeatures([], mockSubscription('free'));
      expect(result).toEqual({});
    });
  });

  describe('getPlanRecommendation', () => {
    it('should recommend current plan if all features are available', () => {
      const recommendation = getPlanRecommendation(
        ['basic_store_management', 'google_maps_integration'],
        'free'
      );
      expect(recommendation.recommended).toBe('free');
      expect(recommendation.missingFeatures).toEqual([]);
    });

    it('should recommend Basic plan for CSV features', () => {
      const recommendation = getPlanRecommendation(
        ['basic_store_management', 'csv_import'],
        'free'
      );
      expect(recommendation.recommended).toBe('Basic');
      expect(recommendation.missingFeatures).toContain('csv_import');
    });

    it('should recommend Pro plan for analytics features', () => {
      const recommendation = getPlanRecommendation(
        ['basic_store_management', 'analytics'],
        'free'
      );
      expect(recommendation.recommended).toBe('Pro');
      expect(recommendation.missingFeatures).toContain('analytics');
    });

    it('should recommend Pro plan when both Basic and Pro features are needed', () => {
      const recommendation = getPlanRecommendation(
        ['csv_import', 'analytics'],
        'free'
      );
      expect(recommendation.recommended).toBe('Pro');
      expect(recommendation.missingFeatures).toContain('csv_import');
      expect(recommendation.missingFeatures).toContain('analytics');
    });
  });
}); 