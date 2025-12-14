# Feature Gating System - Store Locator App

## Overview

The Store Locator app implements a comprehensive feature gating system that controls access to premium features based on the user's subscription plan. This system ensures that users on different plans (Free, Basic, Pro) have appropriate access to features while encouraging upgrades through non-intrusive feedback.

## Table of Contents

1. [Architecture](#architecture)
2. [Core Components](#core-components)
3. [Implementation Guide](#implementation-guide)
4. [User Experience](#user-experience)
5. [Best Practices](#best-practices)
6. [Examples](#examples)
7. [Troubleshooting](#troubleshooting)

---

## Architecture

### File Structure

```
app/
├── helper/
│   ├── featureGating.js          # Core feature gating logic
│   ├── featureGatingComponents.jsx # React HOCs and components
│   └── planLimits.js             # Plan configuration and limits
├── components/
│   └── UpgradePrompt.jsx         # UI components for upgrade prompts
└── routes/
    └── app.view-stores.jsx       # Example implementation
```

### Data Flow

1. **Subscription Check** → `useFeatureGate(feature, subscription)`
2. **Feature Validation** → `isFeatureEnabledForSubscription()`
3. **UI Response** → Toast message or feature access
4. **User Action** → Continue or upgrade

---

## Core Components

### 1. Feature Definitions (`featureGating.js`)

```javascript
export const FEATURES = {
  CSV_IMPORT: "csv_import",
  CSV_EXPORT: "csv_export",
  ADVANCED_SEARCH: "advanced_search",
  ANALYTICS: "analytics",
  PRIORITY_SUPPORT: "priority_support",
  WHITE_LABEL: "white_label",
  // ... more features
};

export const FEATURE_DESCRIPTIONS = {
  [FEATURES.CSV_IMPORT]: "Bulk import stores from CSV files",
  [FEATURES.CSV_EXPORT]: "Export all stores to CSV format",
  // ... more descriptions
};
```

### 2. Plan Configuration (`planLimits.js`)

```javascript
export const PLAN_LIMITS = {
  FREE: {
    name: "Free Plan",
    storeLimit: 5,
    features: ["basic_store_management", "google_maps_integration"],
  },
  STARTUP: {
    name: "startup",
    storeLimit: 50,
    features: ["csv_import", "csv_export", "advanced_search", "white_label"],
  },
  PRO: {
    name: "pro",
    storeLimit: 500,
    features: ["analytics", "priority_support", "api_access"],
  },
};
```

### 3. Feature Gate Hook

```javascript
export const useFeatureGate = (feature, subscription) => {
  const isEnabled = isFeatureEnabledForSubscription(feature, subscription);
  const upgradePrompt = isEnabled
    ? null
    : getUpgradePrompt(feature, subscription?.name);

  return {
    isEnabled,
    upgradePrompt,
    feature,
    subscription,
  };
};
```

---

## Implementation Guide

### Step 1: Import Required Hooks

```javascript
import { useFeatureGate } from "../helper/featureGating";
```

### Step 2: Define Feature Gates

```javascript
// In your React component
const csvExportGate = useFeatureGate("csv_export", subscription);
const csvImportGate = useFeatureGate("csv_import", subscription);
```

### Step 3: Implement Conditional Logic

```javascript
const handleExportClick = () => {
  if (csvExportGate.isEnabled) {
    // Feature is available - proceed normally
    shopify.modal.show("export-modal");
  } else {
    // Feature is not available - show upgrade prompt
    shopify.toast.show(
      `CSV Export is available on the Basic plan and higher. Upgrade to unlock bulk export functionality and many more features!`,
      { duration: 5000 },
    );
  }
};
```

### Step 4: Use in UI Components

```javascript
// Secondary actions example
secondaryActions={[
  {
    icon: ExportIcon,
    content: "Export",
    onAction: handleExportClick,
  },
]}
```

---

## User Experience

### For Users with Feature Access

1. **Button is always visible** (no confusing disabled states)
2. **Click button** → Feature works immediately
3. **No interruptions** to workflow
4. **Seamless experience**

### For Users Without Feature Access

1. **Button is always visible** (encourages exploration)
2. **Click button** → Toast message appears
3. **Read helpful message** (5 seconds duration)
4. **Continue using app** or manually upgrade
5. **No forced redirects**

### Toast Message Examples

```
✅ Good: "CSV Export is available on the Basic plan and higher. Upgrade to unlock bulk export functionality and many more features!"

❌ Bad: "Upgrade now!" (too pushy)
❌ Bad: "Feature not available" (not helpful)
```

---

## Best Practices

### 1. Always Show Buttons

```javascript
// ✅ Good - Button always visible
<Button onAction={handleFeatureClick}>Export</Button>;

// ❌ Bad - Button hidden when feature disabled
{
  csvExportGate.isEnabled && <Button>Export</Button>;
}
```

### 2. Use Toast for Feedback

```javascript
// ✅ Good - Non-intrusive feedback
shopify.toast.show(message, { duration: 5000 });

// ❌ Bad - Immediate redirect
navigate("/app/billing");
```

### 3. Provide Clear Upgrade Path

```javascript
// ✅ Good - Specific plan information
"Available on the Basic plan and higher";

// ❌ Bad - Vague messaging
"Upgrade to access this feature";
```

### 4. Follow Rules of Hooks

```javascript
// ✅ Good - Hooks at top level
const csvExportGate = useFeatureGate("csv_export", subscription);

// ❌ Bad - Hooks in conditional blocks
if (subscription) {
  const csvExportGate = useFeatureGate("csv_export", subscription);
}
```

### 5. Consistent Feature Names

```javascript
// ✅ Good - Use constants
const csvExportGate = useFeatureGate(FEATURES.CSV_EXPORT, subscription);

// ❌ Bad - Hardcoded strings
const csvExportGate = useFeatureGate("csv_export", subscription);
```

---

## Examples

### Example 1: Export Button Implementation

```javascript
// In your component
const csvExportGate = useFeatureGate("csv_export", subscription);

const handleExportClick = () => {
  if (csvExportGate.isEnabled) {
    shopify.modal.show("export-modal");
  } else {
    shopify.toast.show(
      `CSV Export is available on the Basic plan and higher. Upgrade to unlock bulk export functionality and many more features!`,
      { duration: 5000 },
    );
  }
};

// In your JSX
<Button onAction={handleExportClick}>Export</Button>;
```

### Example 2: Advanced Search Implementation

```javascript
// Feature gate
const advancedSearchGate = useFeatureGate("advanced_search", subscription);

// Conditional rendering
{
  advancedSearchGate.isEnabled && (
    <Box padding="400">
      <AdvancedFilters />
    </Box>
  );
}
```

### Example 3: Bulk Actions Implementation

```javascript
// Check multiple features
const bulkActions = [
  {
    icon: ExportIcon,
    content: "Export Selected",
    onAction: () => {
      if (csvExportGate.isEnabled) {
        exportSelectedStores();
      } else {
        shopify.toast.show("Export requires Basic plan or higher");
      }
    },
  },
];
```

---

## Troubleshooting

### Common Issues

#### 1. "Rendered more hooks than during the previous render"

**Cause:** Hooks called conditionally
**Solution:** Move all hooks to the top level of your component

```javascript
// ✅ Fix
const csvExportGate = useFeatureGate("csv_export", subscription);

// ❌ Problem
if (subscription) {
  const csvExportGate = useFeatureGate("csv_export", subscription);
}
```

#### 2. Toast not showing

**Cause:** `shopify` global variable not available
**Solution:** Ensure you're in a Shopify app context

```javascript
// ✅ Correct usage
shopify.toast.show(message, { duration: 5000 });

// ❌ Wrong usage
toast.show(message);
```

#### 3. Feature always disabled

**Cause:** Subscription object not passed correctly
**Solution:** Check subscription structure

```javascript
// ✅ Correct subscription object
{
  name: 'Basic',
  status: 'ACTIVE'
}

// ❌ Wrong subscription object
{
  plan: 'Basic',
  active: true
}
```

### Debug Checklist

- [ ] All hooks called at top level
- [ ] Subscription object has correct structure
- [ ] Feature names match constants
- [ ] Toast messages are descriptive
- [ ] No immediate redirects after toast
- [ ] Buttons always visible

---

## Advanced Usage

### Custom Upgrade Prompts

```javascript
const customUpgradePrompt = {
  feature: "csv_export",
  featureDescription: "Bulk export functionality",
  currentPlan: "Free",
  requiredPlan: "Basic",
  message: "Upgrade to Basic plan to export your stores!",
  upgradeUrl: "/app/billing?feature=csv_export",
};
```

### Multiple Feature Checks

```javascript
const checkMultipleFeatures = (features, subscription) => {
  return features.map((feature) => ({
    feature,
    enabled: isFeatureEnabledForSubscription(feature, subscription),
    upgradePrompt: getUpgradePrompt(feature, subscription?.name),
  }));
};
```

### Feature Recommendations

```javascript
const getPlanRecommendation = (desiredFeatures, currentPlan) => {
  // Logic to recommend the best plan based on desired features
  return {
    recommended: "Basic",
    reason: "Upgrade to Basic plan to access CSV import/export",
    missingFeatures: ["csv_import", "csv_export"],
  };
};
```

---

## Conclusion

The feature gating system provides a **clean, user-friendly experience** that:

1. **Encourages upgrades** without being pushy
2. **Maintains clean UI** with always-visible buttons
3. **Provides helpful feedback** through toast messages
4. **Follows React best practices** with proper hook usage
5. **Scales easily** with new features and plans

This implementation ensures users can explore premium features while understanding the value proposition of upgrading their plan.
