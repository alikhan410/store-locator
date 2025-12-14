import { describe, it, expect } from 'vitest';

describe('Support Level System', () => {
  describe('Free Plan Support', () => {
    it('should return free support for no subscription', () => {
      const subscription = null;
      const supportInfo = getSupportInfo(subscription);
      
      expect(supportInfo.level).toBe('free');
      expect(supportInfo.name).toBe('Email Support');
      expect(supportInfo.responseTime).toBe('24-48 hours');
      expect(supportInfo.color).toBe('base');
    });

    it('should return free support for inactive subscription', () => {
      const subscription = {
        name: 'pro',
        status: 'CANCELLED'
      };
      const supportInfo = getSupportInfo(subscription);
      
      expect(supportInfo.level).toBe('free');
      expect(supportInfo.name).toBe('Email Support');
      expect(supportInfo.responseTime).toBe('24-48 hours');
    });

    it('should return free support for unknown plan', () => {
      const subscription = {
        name: 'unknown_plan',
        status: 'ACTIVE'
      };
      const supportInfo = getSupportInfo(subscription);
      
      expect(supportInfo.level).toBe('free');
      expect(supportInfo.name).toBe('Email Support');
    });
  });

  describe('Basic Plan Support', () => {
    it('should return basic support for basic plan', () => {
      const subscription = {
        name: 'basic',
        status: 'ACTIVE'
      };
      const supportInfo = getSupportInfo(subscription);
      
      expect(supportInfo.level).toBe('basic');
      expect(supportInfo.name).toBe('Priority Email');
      expect(supportInfo.responseTime).toBe('12-24 hours');
      expect(supportInfo.color).toBe('success');
    });

    it('should return basic support for startup plan (backward compatibility)', () => {
      const subscription = {
        name: 'startup',
        status: 'ACTIVE'
      };
      const supportInfo = getSupportInfo(subscription);
      
      expect(supportInfo.level).toBe('basic');
      expect(supportInfo.name).toBe('Priority Email');
      expect(supportInfo.responseTime).toBe('12-24 hours');
    });

    it('should handle case-insensitive plan names', () => {
      const subscription = {
        name: 'BASIC',
        status: 'ACTIVE'
      };
      const supportInfo = getSupportInfo(subscription);
      
      expect(supportInfo.level).toBe('basic');
      expect(supportInfo.name).toBe('Priority Email');
    });
  });

  describe('Pro Plan Support', () => {
    it('should return pro support for pro plan', () => {
      const subscription = {
        name: 'pro',
        status: 'ACTIVE'
      };
      const supportInfo = getSupportInfo(subscription);
      
      expect(supportInfo.level).toBe('pro');
      expect(supportInfo.name).toBe('Premium Support');
      expect(supportInfo.responseTime).toBe('4-8 hours');
      expect(supportInfo.color).toBe('success');
    });

    it('should handle case-insensitive pro plan name', () => {
      const subscription = {
        name: 'PRO',
        status: 'ACTIVE'
      };
      const supportInfo = getSupportInfo(subscription);
      
      expect(supportInfo.level).toBe('pro');
      expect(supportInfo.name).toBe('Premium Support');
    });
  });

  describe('Support Features', () => {
    it('should have correct features for free plan', () => {
      const subscription = null;
      const features = getSupportFeatures(subscription);
      
      expect(features).toContain('Email support only');
      expect(features).toContain('24-48 hour response time');
      expect(features).toContain('Basic troubleshooting');
      expect(features).toContain('Documentation access');
    });

    it('should have correct features for basic plan', () => {
      const subscription = {
        name: 'basic',
        status: 'ACTIVE'
      };
      const features = getSupportFeatures(subscription);
      
      expect(features).toContain('Priority email support');
      expect(features).toContain('12-24 hour response time');
      expect(features).toContain('Advanced troubleshooting');
      expect(features).toContain('Setup assistance');
    });

    it('should have correct features for pro plan', () => {
      const subscription = {
        name: 'pro',
        status: 'ACTIVE'
      };
      const features = getSupportFeatures(subscription);
      
      expect(features).toContain('Priority email support');
      expect(features).toContain('Live chat during business hours');
      expect(features).toContain('Phone support option');
      expect(features).toContain('4-8 hour response time');
      expect(features).toContain('Dedicated account assistance');
    });
  });

  describe('Support Upgrade Prompts', () => {
    it('should show upgrade prompt for free plan', () => {
      const subscription = null;
      const shouldShowUpgrade = shouldShowUpgradePrompt(subscription);
      
      expect(shouldShowUpgrade).toBe(true);
    });

    it('should show upgrade prompt for basic plan', () => {
      const subscription = {
        name: 'basic',
        status: 'ACTIVE'
      };
      const shouldShowUpgrade = shouldShowUpgradePrompt(subscription);
      
      expect(shouldShowUpgrade).toBe(true);
    });

    it('should not show upgrade prompt for pro plan', () => {
      const subscription = {
        name: 'pro',
        status: 'ACTIVE'
      };
      const shouldShowUpgrade = shouldShowUpgradePrompt(subscription);
      
      expect(shouldShowUpgrade).toBe(false);
    });
  });
});

// Helper functions for testing
function getSupportInfo(subscription) {
  if (!subscription || subscription.status !== 'ACTIVE') {
    return {
      level: 'free',
      name: 'Email Support',
      responseTime: '24-48 hours',
      color: 'base',
      description: 'Standard email support'
    };
  }
  
  const planName = subscription.name?.toLowerCase();
  
  if (planName === 'startup' || planName === 'basic') {
    return {
      level: 'basic',
      name: 'Priority Email',
      responseTime: '12-24 hours',
      color: 'success',
      description: 'Enhanced email support'
    };
  }
  
  if (planName === 'pro') {
    return {
      level: 'pro',
      name: 'Premium Support',
      responseTime: '4-8 hours',
      color: 'success',
      description: 'Live chat & phone support'
    };
  }
  
  return {
    level: 'free',
    name: 'Email Support',
    responseTime: '24-48 hours',
    color: 'base',
    description: 'Standard email support'
  };
}

function getSupportFeatures(subscription) {
  if (!subscription || subscription.status !== 'ACTIVE') {
    return [
      'Email support only',
      '24-48 hour response time',
      'Basic troubleshooting',
      'Documentation access'
    ];
  }
  
  const planName = subscription.name?.toLowerCase();
  
  if (planName === 'startup' || planName === 'basic') {
    return [
      'Priority email support',
      '12-24 hour response time',
      'Advanced troubleshooting',
      'Setup assistance',
      'Documentation access'
    ];
  }
  
  if (planName === 'pro') {
    return [
      'Priority email support',
      'Live chat during business hours',
      'Phone support option',
      '4-8 hour response time',
      'Dedicated account assistance',
      'Setup and onboarding support'
    ];
  }
  
  return [
    'Email support only',
    '24-48 hour response time',
    'Basic troubleshooting',
    'Documentation access'
  ];
}

function shouldShowUpgradePrompt(subscription) {
  if (subscription && subscription.status === 'ACTIVE') {
    const planName = subscription.name?.toLowerCase();
    if (planName === 'pro') {
      return false; // Already at highest level
    }
  }
  
  return true;
} 