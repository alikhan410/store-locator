import { isFeatureEnabledForSubscription, getUpgradePrompt } from './featureGating';

/**
 * Create a feature gate component wrapper (React HOC)
 * @param {string} feature - Feature key
 * @param {Object} subscription - Subscription object
 * @param {React.Component} FallbackComponent - Component to show when feature is disabled
 * @returns {React.Component} Wrapped component or fallback
 */
export const withFeatureGate = (feature, subscription, FallbackComponent) => {
  return (Component) => {
    return (props) => {
      const isEnabled = isFeatureEnabledForSubscription(feature, subscription);
      if (isEnabled) {
        return <Component {...props} />;
      }
      const upgradePrompt = getUpgradePrompt(feature, subscription?.name);
      return <FallbackComponent upgradePrompt={upgradePrompt} {...props} />;
    };
  };
};