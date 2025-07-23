import { describe, it, expect } from 'vitest';
import { 
  PLAN_LIMITS, 
  getPlanLimits, 
  checkStoreLimit, 
  validateImportSize,
  getPlanFeatures 
} from '../../../app/helper/planLimits';

describe('Plan Limits Helper', () => {
  describe('PLAN_LIMITS', () => {
    it('should have correct plan configurations', () => {
      expect(PLAN_LIMITS.FREE.storeLimit).toBe(5);
      expect(PLAN_LIMITS.STARTUP.storeLimit).toBe(50);
      expect(PLAN_LIMITS.PRO.storeLimit).toBe(500);
    });

    it('should have features for each plan', () => {
      expect(PLAN_LIMITS.FREE.features).toContain('basic_store_management');
      expect(PLAN_LIMITS.STARTUP.features).toContain('csv_import');
      expect(PLAN_LIMITS.PRO.features).toContain('analytics');
    });
  });

  describe('getPlanLimits', () => {
    it('should return correct plan for valid plan names', () => {
      expect(getPlanLimits('free')).toEqual(PLAN_LIMITS.FREE);
      expect(getPlanLimits('Free')).toEqual(PLAN_LIMITS.FREE);
      expect(getPlanLimits('STARTUP')).toEqual(PLAN_LIMITS.STARTUP);
      expect(getPlanLimits('pro')).toEqual(PLAN_LIMITS.PRO);
    });

    it('should return null for invalid plan names', () => {
      expect(getPlanLimits('invalid')).toBeNull();
      expect(getPlanLimits('')).toBeNull();
      expect(getPlanLimits(null)).toBeNull();
      expect(getPlanLimits(undefined)).toBeNull();
    });
  });

  describe('checkStoreLimit', () => {
    const mockSubscription = (name, status = 'ACTIVE') => ({
      name,
      status
    });

    it('should allow adding stores when under limit', () => {
      const result = checkStoreLimit(mockSubscription('free'), 3);
      expect(result.canAdd).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.error).toBeNull();
    });

    it('should prevent adding stores when at limit', () => {
      const result = checkStoreLimit(mockSubscription('free'), 5);
      expect(result.canAdd).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(5);
      expect(result.error).toContain('You\'ve reached the limit');
    });

    it('should prevent adding stores when over limit', () => {
      const result = checkStoreLimit(mockSubscription('free'), 6);
      expect(result.canAdd).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.limit).toBe(5);
    });

    it('should handle inactive subscription', () => {
      const result = checkStoreLimit(mockSubscription('free', 'INACTIVE'), 0);
      expect(result.canAdd).toBe(false);
      expect(result.error).toContain('No active subscription found');
    });

    it('should handle null subscription', () => {
      const result = checkStoreLimit(null, 0);
      expect(result.canAdd).toBe(false);
      expect(result.error).toContain('No active subscription found');
    });

    it('should handle unknown plan', () => {
      const result = checkStoreLimit(mockSubscription('unknown'), 0);
      expect(result.canAdd).toBe(false);
      expect(result.error).toContain('Unknown subscription plan');
    });
  });

  describe('validateImportSize', () => {
    const mockSubscription = (name, status = 'ACTIVE') => ({
      name,
      status
    });

    it('should allow full import when under limit', () => {
      const result = validateImportSize(mockSubscription('startup'), 10, 20);
      expect(result.allowedImport).toBe(20);
      expect(result.skipped).toBe(0);
      expect(result.error).toBeNull();
    });

    it('should limit import when it would exceed plan limit', () => {
      const result = validateImportSize(mockSubscription('free'), 3, 5);
      expect(result.allowedImport).toBe(2);
      expect(result.skipped).toBe(3);
      expect(result.error).toContain('3 store(s) skipped due to plan limit');
    });

    it('should block all imports when at limit', () => {
      const result = validateImportSize(mockSubscription('free'), 5, 10);
      expect(result.allowedImport).toBe(0);
      expect(result.skipped).toBe(10);
      expect(result.error).toContain('You\'ve reached the limit');
    });

    it('should handle inactive subscription', () => {
      const result = validateImportSize(mockSubscription('free', 'INACTIVE'), 0, 5);
      expect(result.allowedImport).toBe(0);
      expect(result.skipped).toBe(5);
      expect(result.error).toContain('No active subscription found');
    });
  });

  describe('getPlanFeatures', () => {
    it('should return features for valid plan', () => {
      const features = getPlanFeatures('free');
      expect(features).toContain('basic_store_management');
      expect(features).toContain('google_maps_integration');
    });

    it('should return empty array for invalid plan', () => {
      const features = getPlanFeatures('invalid');
      expect(features).toEqual([]);
    });

    it('should handle null/undefined plan', () => {
      expect(getPlanFeatures(null)).toEqual([]);
      expect(getPlanFeatures(undefined)).toEqual([]);
    });
  });
}); 