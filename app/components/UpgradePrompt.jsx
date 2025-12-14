import {
  Banner,
  Button,
  Text,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import { useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useFeatureGate } from "../helper/featureGating";

/**
 * Upgrade Prompt Component
 * Displays when users try to access features not available on their current plan
 */
export default function UpgradePrompt({
  upgradePrompt,
  variant = "info",
  showUpgradeButton = true,
  showFeatureDescription = true,
  className = "",
}) {
  const navigate = useNavigate();
  const shopify = useAppBridge();

  if (!upgradePrompt) {
    return null;
  }

  const handleUpgrade = () => {
    // Navigate to billing page with feature context
    navigate(`/app/billing?feature=${upgradePrompt.feature}`);
  };

  const handleLearnMore = () => {
    // Show a toast with more information
    shopify.toast.show(
      `${upgradePrompt.featureDescription} is available on the ${upgradePrompt.requiredPlan} plan. Upgrade to unlock this feature and many more!`,
      { duration: 5000 },
    );
  };

  return (
    <Banner
      title={`Upgrade to ${upgradePrompt.requiredPlan} Plan`}
      tone={variant}
      action={
        showUpgradeButton
          ? {
              content: "Upgrade Now",
              onAction: handleUpgrade,
            }
          : undefined
      }
      secondaryAction={
        !showUpgradeButton
          ? {
              content: "Learn More",
              onAction: handleLearnMore,
            }
          : undefined
      }
      className={className}
    >
      <BlockStack gap="200">
        {showFeatureDescription && (
          <Text variant="bodyMd">{upgradePrompt.message}</Text>
        )}

        <Text variant="bodySm" tone="subdued">
          Current plan: {upgradePrompt.currentPlan || "Free"}
        </Text>
      </BlockStack>
    </Banner>
  );
}

/**
 * Compact Upgrade Prompt
 * Smaller version for inline use
 */
export function CompactUpgradePrompt({ upgradePrompt, variant = "info" }) {
  const navigate = useNavigate();

  if (!upgradePrompt) {
    return null;
  }

  return (
    <Banner
      title={`${upgradePrompt.featureDescription} requires ${upgradePrompt.requiredPlan} plan`}
      tone={variant}
      action={{
        content: "Upgrade",
        onAction: () =>
          navigate(`/app/billing?feature=${upgradePrompt.feature}`),
      }}
    >
      <Text variant="bodySm">
        Upgrade to unlock this feature and many more premium capabilities.
      </Text>
    </Banner>
  );
}

/**
 * Feature Lock Icon Component
 * Shows a locked icon with upgrade prompt on hover
 */
export function FeatureLockIcon({ feature, subscription, size = "small" }) {
  const { isEnabled, upgradePrompt } = useFeatureGate(feature, subscription);

  if (isEnabled) {
    return null; // Don't show lock for enabled features
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        cursor: "help",
        opacity: 0.6,
      }}
      title={upgradePrompt?.message || "Feature requires upgrade"}
    >
      <span style={{ fontSize: "12px" }}>🔒</span>
    </div>
  );
}

/**
 * Feature Gate Wrapper
 * Wraps content with feature gate checking
 */
export function FeatureGate({
  feature,
  subscription,
  children,
  fallback = null,
  showUpgradePrompt = true,
}) {
  const { isEnabled, upgradePrompt } = useFeatureGate(feature, subscription);

  if (isEnabled) {
    return children;
  }

  if (fallback) {
    return fallback;
  }

  if (showUpgradePrompt) {
    return <UpgradePrompt upgradePrompt={upgradePrompt} />;
  }

  return null;
}

/**
 * Feature Button Component
 * Button that shows upgrade prompt when feature is not available
 */
export function FeatureButton({
  feature,
  subscription,
  children,
  onClick,
  disabled = false,
  ...buttonProps
}) {
  const { isEnabled, upgradePrompt } = useFeatureGate(feature, subscription);
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (isEnabled && onClick) {
      onClick(e);
    } else if (!isEnabled) {
      // Navigate to billing page
      navigate(`/app/billing?feature=${feature}`);
    }
  };

  return (
    <Button
      {...buttonProps}
      disabled={disabled}
      onClick={handleClick}
      icon={!isEnabled ? "🔒" : buttonProps.icon}
    >
      {children}
    </Button>
  );
}
