import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const prisma = (await import("../db.server")).default;

  // Get all stores for the current shop with metrics
  const stores = await prisma.store.findMany({
    where: {
      shop: session.shop, // GDPR compliance: only show stores for current shop
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Calculate metrics
  const totalStores = stores.length;
  const recentStores = stores.filter(
    (store) => new Date(store.createdAt) > oneWeekAgo,
  );
  const uniqueStates = [...new Set(stores.map((store) => store.state))];
  const geocodedStores = stores.filter((store) => store.lat && store.lng);
  const storesWithPhone = stores.filter((store) => store.phone);
  const storesWithLink = stores.filter((store) => store.link);

  // Health metrics
  const missingCoordinates = stores.filter(
    (store) => !store.lat || !store.lng,
  ).length;
  const missingPhone = stores.filter((store) => !store.phone).length;

  // Calculate store distribution by state for chart
  const storesByState = stores.reduce((acc, store) => {
    if (store.state) {
      acc[store.state] = (acc[store.state] || 0) + 1;
    }
    return acc;
  }, {});

  // Get top states sorted by count
  const topStates = Object.entries(storesByState)
    .filter(([stateCode, count]) => stateCode && count > 0) // Filter out empty states
    .map(([stateCode, count]) => ({ stateCode, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8 states

  // Calculate max count (ensure at least 1 to avoid division by zero)
  const maxStateCount = topStates.length > 0 
    ? Math.max(...topStates.map(s => s.count), 1) 
    : 1;

  // Get analytics data (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Total searches
  const totalSearches = await prisma.storeAnalyticsEvent.count({
    where: {
      shop: session.shop,
      eventType: 'search',
      timestamp: { gte: thirtyDaysAgo }
    }
  });

  // Unique sessions
  const uniqueSessions = await prisma.storeAnalyticsEvent.findMany({
    where: {
      shop: session.shop,
      timestamp: { gte: thirtyDaysAgo }
    },
    distinct: ['sessionId'],
    select: { sessionId: true }
  });

  // Top search queries (last 30 days)
  const topSearchQueries = await prisma.storeAnalyticsEvent.findMany({
    where: {
      shop: session.shop,
      eventType: 'search',
      searchQuery: { not: null },
      timestamp: { gte: thirtyDaysAgo }
    },
    select: {
      searchQuery: true
    },
    take: 100 // Get more to aggregate
  });

  // Aggregate search queries
  const queryCounts = topSearchQueries.reduce((acc, event) => {
    const query = event.searchQuery;
    if (query) {
      acc[query] = (acc[query] || 0) + 1;
    }
    return acc;
  }, {});

  const topQueries = Object.entries(queryCounts)
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Most viewed stores (last 30 days)
  const storeViews = await prisma.storeAnalyticsEvent.findMany({
    where: {
      shop: session.shop,
      eventType: 'store_view',
      storeId: { not: null },
      timestamp: { gte: thirtyDaysAgo }
    },
    select: {
      storeId: true,
      storeName: true
    },
    take: 500 // Get more to aggregate
  });

  // Aggregate store views
  const storeViewCounts = storeViews.reduce((acc, event) => {
    const storeId = event.storeId;
    if (storeId) {
      if (!acc[storeId]) {
        acc[storeId] = { name: event.storeName || 'Unknown', count: 0 };
      }
      acc[storeId].count++;
    }
    return acc;
  }, {});

  const topViewedStores = Object.entries(storeViewCounts)
    .map(([storeId, data]) => ({ storeId, name: data.name, views: data.count }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  // Total store contacts (phone + website clicks)
  const totalContacts = await prisma.storeAnalyticsEvent.count({
    where: {
      shop: session.shop,
      eventType: 'store_contact',
      timestamp: { gte: thirtyDaysAgo }
    }
  });

  return {
    stores: stores.slice(0, 10), // Recent 10 for activity feed
    metrics: {
      totalStores,
      recentStoresCount: recentStores.length,
      uniqueStatesCount: uniqueStates.length,
      geocodedPercent:
        totalStores > 0
          ? Math.round((geocodedStores.length / totalStores) * 100)
          : 0,
      storesWithPhone: storesWithPhone.length,
      storesWithLink: storesWithLink.length,
      missingCoordinates,
      missingPhone,
    },
    stateDistribution: {
      topStates,
      maxStateCount,
    },
    analytics: {
      totalSearches,
      uniqueSessions: uniqueSessions.length,
      topQueries,
      topViewedStores,
      totalContacts,
    },
    contactUrl: process.env.CONTACT_URL || "https://storetrail.app/support",
  };
};

export default function Index() {
  const { stores, metrics, stateDistribution, analytics, contactUrl } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  
  const [dismissed, setDismissed] = useState({
    stateDistribution: false,
    setupGuide: false,
    dealerSubmission: false,
  });
  const [expanded, setExpanded] = useState({
    setupGuide: true,
    step1: true,
    step2: false,
    step3: false,
  });
  const [setupCompleted, setSetupCompleted] = useState({
    step1: false,
    step2: false,
    step3: false,
  });

  // Load setup completion from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('setup_completed');
    if (stored) {
      setSetupCompleted(JSON.parse(stored));
    }
  }, []);

  // Load dismissed sections from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('dashboard_dismissed');
    if (stored) {
      setDismissed(JSON.parse(stored));
    }
  }, []);

  // Save dismissed state to localStorage
  const handleDismiss = (section) => {
    const newDismissed = { ...dismissed, [section]: true };
    setDismissed(newDismissed);
    localStorage.setItem('dashboard_dismissed', JSON.stringify(newDismissed));
  };

  // Calculate setup progress based on checked state OR actual completion
  const setupProgress = () => {
    let completed = 0;
    // Step 1: Checked OR has stores
    if (setupCompleted.step1 || metrics.totalStores > 0) completed++;
    // Step 2: Checked (manual)
    if (setupCompleted.step2) completed++;
    // Step 3: Checked (manual)
    if (setupCompleted.step3) completed++;
    return completed;
  };

  const progress = setupProgress();

  const handleStepComplete = (step) => {
    const newCompleted = { ...setupCompleted, [step]: !setupCompleted[step] };
    setSetupCompleted(newCompleted);
    localStorage.setItem('setup_completed', JSON.stringify(newCompleted));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return "Yesterday";
    }
    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }
    return date.toLocaleDateString();
  };

  return (
    <s-page heading="Store Locator Dashboard">
      <ui-title-bar title="Store Locator Dashboard" />
      
      {/* Primary and Secondary Actions */}
      <s-button 
        slot="primary-action" 
        onClick={() => navigate("/app/add-store")}
        icon="plus"
      >
        Add New Store
      </s-button>
      <s-button 
        slot="secondary-actions" 
        onClick={() => navigate("/app/view-stores")}
      >
        Manage Stores
      </s-button>
      <s-button 
        slot="secondary-actions" 
        onClick={() => navigate("/app/choropleth")}
      >
        Distribution Map
      </s-button>

      <s-stack direction="block" gap="large-200" paddingBlockStart="large" paddingBlockEnd="large" paddingInlineStart="base" paddingInlineEnd="base">
        {/* Setup Guide - Show for new users only, if not dismissed */}
        {!dismissed.setupGuide && metrics.totalStores === 0 && (
          <s-section>
            <s-grid gap="small">
              <s-grid gap="small-200">
                <s-grid gridTemplateColumns="1fr auto auto" gap="small-300" alignItems="center">
                  <s-heading>Setup Guide</s-heading>
                  <s-button
                    accessibilityLabel="Dismiss Guide"
                    onClick={() => handleDismiss('setupGuide')}
                    variant="tertiary"
                    tone="neutral"
                    icon="x"
                  />
                  <s-button
                    accessibilityLabel="Toggle setup guide"
                    onClick={() => setExpanded({ ...expanded, setupGuide: !expanded.setupGuide })}
                    variant="tertiary"
                    tone="neutral"
                    icon={expanded.setupGuide ? "chevron-up" : "chevron-down"}
                  />
                </s-grid>
                <s-paragraph>
                  Use this personalized guide to get your store locator ready.
                </s-paragraph>
                <s-paragraph color="subdued">
                  {progress} out of 3 steps completed
                </s-paragraph>
              </s-grid>
              
              {expanded.setupGuide && (
                <s-box borderRadius="base" border="base" background="base">
                  {/* Step 1: Add Your First Store */}
                  <s-box>
                    <s-grid gridTemplateColumns="1fr auto" gap="base" padding="small" alignItems="center">
                      <s-checkbox 
                        label="Add your first store location"
                        checked={setupCompleted.step1 || metrics.totalStores > 0}
                        onInput={(e) => handleStepComplete('step1')}
                      />
                      <s-button
                        onClick={() => setExpanded({ ...expanded, step1: !expanded.step1 })}
                        accessibilityLabel="Toggle step 1 details"
                        variant="tertiary"
                        icon={expanded.step1 ? "chevron-up" : "chevron-down"}
                      />
                    </s-grid>
                    {expanded.step1 && (
                      <s-box padding="small" paddingBlockStart="none">
                        <s-box padding="base" background="subdued" borderRadius="base">
                          <s-grid gridTemplateColumns="1fr auto" gap="base" alignItems="center">
                            <s-grid gap="small-200">
                              <s-paragraph>
                                Add your first store location with complete address details. The app will automatically geocode the address to get coordinates for the map.
                              </s-paragraph>
                              <s-button 
                                variant="primary"
                                onClick={() => navigate("/app/add-store")}
                              >
                                Add Store
                              </s-button>
                            </s-grid>
                          </s-grid>
                        </s-box>
                      </s-box>
                    )}
                  </s-box>
                  
                  <s-divider />
                  
                  {/* Step 2: Import Stores */}
                  <s-box>
                    <s-grid gridTemplateColumns="1fr auto" gap="base" padding="small" alignItems="center">
                      <s-checkbox 
                        label="Import stores"
                        checked={setupCompleted.step2}
                        onInput={(e) => handleStepComplete('step2')}
                      />
                      <s-button
                        onClick={() => setExpanded({ ...expanded, step2: !expanded.step2 })}
                        accessibilityLabel="Toggle step 2 details"
                        variant="tertiary"
                        icon={expanded.step2 ? "chevron-up" : "chevron-down"}
                      />
                    </s-grid>
                    {expanded.step2 && (
                      <s-box padding="small" paddingBlockStart="none">
                        <s-box padding="base" background="subdued" borderRadius="base">
                          <s-grid gap="small-200">
                            <s-paragraph>
                              Import multiple stores at once using a CSV file. This is the fastest way to add all your store locations.
                            </s-paragraph>
                            <s-stack direction="block" gap="small-100">
                              <s-text>1. Go to "View All Stores" page</s-text>
                              <s-text>2. Click "Import Stores" button</s-text>
                              <s-text>3. Upload your CSV file with store data</s-text>
                              <s-text>4. Review and confirm the import</s-text>
                            </s-stack>
                            <s-button 
                              variant="primary"
                              onClick={() => navigate("/app/view-stores")}
                            >
                              Import Stores
                            </s-button>
                          </s-grid>
                        </s-box>
                      </s-box>
                    )}
                  </s-box>
                  
                  <s-divider />
                  
                  {/* Step 3: Enable Theme Extension */}
                  <s-box>
                    <s-grid gridTemplateColumns="1fr auto" gap="base" padding="small" alignItems="center">
                      <s-checkbox 
                        label="Add store locator to your theme"
                        checked={setupCompleted.step3}
                        onInput={(e) => handleStepComplete('step3')}
                      />
                      <s-button
                        onClick={() => setExpanded({ ...expanded, step3: !expanded.step3 })}
                        accessibilityLabel="Toggle step 3 details"
                        variant="tertiary"
                        icon={expanded.step3 ? "chevron-up" : "chevron-down"}
                      />
                    </s-grid>
                    {expanded.step3 && (
                      <s-box padding="small" paddingBlockStart="none">
                        <s-box padding="base" background="subdued" borderRadius="base">
                          <s-grid gap="small-200">
                            <s-paragraph>
                              Add the Store Locator block to your theme so customers can find your stores.
                            </s-paragraph>
                            <s-stack direction="block" gap="small-100">
                              <s-text>1. Go to Online Store → Themes → Customize</s-text>
                              <s-text>2. Add the "Store Locator" block to any page</s-text>
                              <s-text>3. Configure your Google Maps API key in block settings</s-text>
                            </s-stack>
                          </s-grid>
                        </s-box>
                      </s-box>
                    )}
                  </s-box>
                </s-box>
              )}
            </s-grid>
          </s-section>
        )}

        {/* Welcome message for new users (fallback if setup guide dismissed) */}
        {metrics.totalStores === 0 && dismissed.setupGuide && (
          <s-section>
            <s-stack direction="block" gap="large" alignItems="center" textAlign="center">
              <s-image
                src="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                alt="Welcome to Store Locator"
                width="120px"
              />
              <s-heading>Welcome to Store Locator! 🎉</s-heading>
              <s-paragraph>
                Get started by adding your store locations to help customers find you easily.
              </s-paragraph>
              <s-stack direction="inline" gap="base">
                <s-button 
                  variant="primary"
                  onClick={() => navigate("/app/add-store")}
                >
                  Add Your First Store
                </s-button>
                <s-button onClick={() => navigate("/app/view-stores")}>
                  Import Multiple Stores
                </s-button>
              </s-stack>
            </s-stack>
          </s-section>
        )}

        {/* Dashboard metrics - only show if there are stores */}
        {metrics.totalStores > 0 && (
          <>
            {/* Hero Dashboard Cards */}
            <s-grid gridTemplateColumns="repeat(auto-fit, minmax(240px, 1fr))" gap="base">
              {/* Total Stores Card */}
              <s-box background="base" border="base" borderRadius="base" padding="base">
                <s-stack direction="block" gap="small-200">
                  <s-stack direction="inline" alignItems="center" justifyContent="space-between">
                    <s-heading>Total Stores</s-heading>
                    <s-icon name="location" />
                  </s-stack>
                  <s-text variant="heading2xl" tone="success">
                        {metrics.totalStores}
                  </s-text>
                  <s-text color="subdued">
                        {metrics.recentStoresCount > 0
                          ? `+${metrics.recentStoresCount} added this week`
                          : "No new stores this week"}
                  </s-text>
                </s-stack>
              </s-box>

              {/* Store Coverage Card */}
              <s-box background="base" border="base" borderRadius="base" padding="base">
                <s-stack direction="block" gap="small-200">
                  <s-stack direction="inline" alignItems="center" justifyContent="space-between">
                    <s-heading>Store Coverage</s-heading>
                    <s-badge tone="info">{metrics.uniqueStatesCount}</s-badge>
                  </s-stack>
                  <s-text variant="heading2xl">
                        {metrics.uniqueStatesCount}
                  </s-text>
                  <s-text color="subdued">
                    {metrics.uniqueStatesCount === 1 ? "state covered" : "states covered"}
                  </s-text>
                </s-stack>
              </s-box>

              {/* Geocoded Card */}
              <s-box background="base" border="base" borderRadius="base" padding="base">
                <s-stack direction="block" gap="small-200">
                  <s-stack direction="inline" alignItems="center" justifyContent="space-between">
                    <s-heading>Geocoded</s-heading>
                    <s-badge tone={metrics.geocodedPercent === 100 ? "success" : "warning"}>
                          {metrics.geocodedPercent}%
                    </s-badge>
                  </s-stack>
                  <s-text variant="heading2xl">
                        {metrics.geocodedPercent}%
                  </s-text>
                  <s-text color="subdued">stores have coordinates</s-text>
                      {metrics.geocodedPercent < 100 && (
                    <s-box 
                      background="subdued" 
                      borderRadius="base" 
                      overflow="hidden"
                      style={{ height: "8px", width: "100%" }}
                    >
                      <s-box 
                        background="success" 
                        style={{ 
                          height: "100%", 
                          width: `${metrics.geocodedPercent}%`,
                          transition: "width 0.3s"
                        }}
                      />
                    </s-box>
                  )}
                </s-stack>
              </s-box>
            </s-grid>
            
            {/* Dealer Submission Form Section */}
            {!dismissed.dealerSubmission && metrics.totalStores > 0 && (
              <s-section>
                <s-box padding="base" background="base" border="base" borderRadius="base">
                  <s-grid
                    gridTemplateColumns="1fr auto"
                    gap="small-400"
                    alignItems="start"
                  >
                    <s-grid
                      gridTemplateColumns="@container (inline-size <= 480px) 1fr, auto auto"
                      gap="base"
                      alignItems="center"
                    >
                      <s-grid gap="small-200">
                        <s-heading>Ready to accept dealer submissions?</s-heading>
                        <s-paragraph>
                          Allow dealers and partners to submit their store locations directly through your storefront. Submissions will appear in your dashboard for review and approval.
                        </s-paragraph>
                        <s-stack direction="inline" gap="small-200">
                          <s-button onClick={() => navigate("/app/submissions")}>
                            View Submissions
                          </s-button>
                        </s-stack>
                      </s-grid>
                      <s-stack alignItems="center">
                        <s-box maxInlineSize="200px" borderRadius="base" overflow="hidden">
                          <s-image
                            src="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                            alt="Dealer submission form illustration"
                            aspectRatio="1/0.5"
                          />
                        </s-box>
                      </s-stack>
                    </s-grid>
                    <s-button
                      onClick={() => handleDismiss('dealerSubmission')}
                      icon="x"
                      tone="neutral"
                      variant="tertiary"
                      accessibilityLabel="Dismiss dealer submission form section"
                    />
                  </s-grid>
                </s-box>
              </s-section>
            )}

            {/* Store Locator Analytics Section */}
            {metrics.totalStores > 0 && (
              <s-section>
                <s-box padding="base" background="base" border="base" borderRadius="base">
                  {analytics.totalSearches > 0 ? (
                    <s-grid gap="base">
                      <s-grid gridTemplateColumns="1fr auto" alignItems="center" gap="base">
                        <s-heading>Store Locator Analytics</s-heading>
                        <s-badge tone="info">Last 30 days</s-badge>
                      </s-grid>
                      <s-paragraph color="subdued">
                        Track how customers are using your store locator to find your locations.
                      </s-paragraph>

                      {/* Analytics Metrics Cards */}
                      <s-grid gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap="base">
                        {/* Total Searches */}
                        <s-box background="subdued" borderRadius="base" padding="base">
                          <s-stack direction="block" gap="small-200">
                            <s-text color="subdued" fontWeight="medium">Total Searches</s-text>
                            <s-text variant="heading2xl">{analytics.totalSearches}</s-text>
                            <s-text color="subdued" fontSize="small">
                              {analytics.uniqueSessions} unique {analytics.uniqueSessions === 1 ? 'session' : 'sessions'}
                            </s-text>
                          </s-stack>
                        </s-box>

                        {/* Store Contacts */}
                        <s-box background="subdued" borderRadius="base" padding="base">
                          <s-stack direction="block" gap="small-200">
                            <s-text color="subdued" fontWeight="medium">Store Contacts</s-text>
                            <s-text variant="heading2xl">{analytics.totalContacts}</s-text>
                            <s-text color="subdued" fontSize="small">
                              Phone & website clicks
                            </s-text>
                          </s-stack>
                        </s-box>
                      </s-grid>

                      {/* Top Search Queries */}
                      {analytics.topQueries.length > 0 && (
                        <s-box>
                          <s-heading fontSize="base" paddingBlockEnd="small-200">
                            Top Search Queries
                          </s-heading>
                          <s-stack direction="block" gap="small-200">
                            {analytics.topQueries.map((item, idx) => (
                              <s-box
                                key={idx}
                                padding="small-300"
                                borderRadius="base"
                                background="subdued"
                              >
                                <s-grid gridTemplateColumns="1fr auto" alignItems="center" gap="base">
                                  <s-text fontWeight="medium">{item.query}</s-text>
                                  <s-badge tone="info">{item.count} {item.count === 1 ? 'search' : 'searches'}</s-badge>
                                </s-grid>
                              </s-box>
                            ))}
                          </s-stack>
                        </s-box>
                      )}

                      {/* Most Viewed Stores */}
                      {analytics.topViewedStores.length > 0 && (
                        <s-box>
                          <s-heading fontSize="base" paddingBlockEnd="small-200">
                            Most Viewed Stores
                          </s-heading>
                          <s-stack direction="block" gap="small-200">
                            {analytics.topViewedStores.map((store, idx) => (
                              <s-box
                                key={store.storeId}
                                padding="small-300"
                                borderRadius="base"
                                background="subdued"
                              >
                                <s-grid gridTemplateColumns="1fr auto" alignItems="center" gap="base">
                                  <s-text fontWeight="medium">{store.name || 'Unknown Store'}</s-text>
                                  <s-badge tone="success">{store.views} {store.views === 1 ? 'view' : 'views'}</s-badge>
                                </s-grid>
                              </s-box>
                            ))}
                          </s-stack>
                        </s-box>
                      )}
                    </s-grid>
                  ) : (
                    /* Empty State - following Shopify pattern */
                    <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
                      <s-box maxInlineSize="200px" maxBlockSize="200px">
                        <s-image
                          aspectRatio="1/0.5"
                          src="https://cdn.shopify.com/static/images/polaris/patterns/callout.png"
                          alt="Analytics empty state illustration"
                        />
                      </s-box>
                      <s-grid justifyItems="center" maxInlineSize="450px" gap="base">
                        <s-stack alignItems="center">
                          <s-heading>No analytics data yet</s-heading>
                          <s-paragraph>
                            Analytics will appear once customers start using your store locator to find your locations.
                          </s-paragraph>
                        </s-stack>
                        <s-button-group>
                          <s-button
                            slot="primary-action"
                            aria-label="View store locator settings"
                            onClick={() => navigate("/app/view-stores")}
                          >
                            Manage Stores
                          </s-button>
                        </s-button-group>
                      </s-grid>
                    </s-grid>
                  )}
                </s-box>
              </s-section>
            )}

            {/* Top States Distribution Chart */}
            {metrics.totalStores > 0 && stateDistribution.topStates.length > 0 && (
              <s-section>
                <s-heading>Store Distribution by State</s-heading>
                <s-stack direction="block" gap="small-200">
                  {stateDistribution.topStates.map((state, idx) => {
                    const barWidth = stateDistribution.maxStateCount > 0 
                      ? (state.count / stateDistribution.maxStateCount) * 100 
                      : 0;
                    return (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "35px", fontWeight: "500", flexShrink: 0 }}>
                          <s-text>{state.stateCode}</s-text>
                        </div>
                        <div
                          style={{
                            flex: 1,
                            height: "24px",
                            backgroundColor: "#f6f6f7",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${barWidth}%`,
                              height: "100%",
                              backgroundColor: "#008060",
                              borderRadius: "4px",
                              transition: "width 0.3s",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              paddingRight: "6px",
                              minWidth: state.count > 0 ? "35px" : "0",
                            }}
                          >
                            <span style={{ color: "white", fontSize: "11px", fontWeight: "600" }}>
                              {state.count}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </s-stack>
              </s-section>
            )}

            {/* Recent Activity and Store Overview */}
            <s-grid gridTemplateColumns="2fr 1fr" gap="base">
            {/* Recent Activity */}
              <s-section>
                <s-grid gridTemplateColumns="1fr auto" alignItems="center" paddingBlockEnd="small-400">
                  <s-heading>Recent Activity</s-heading>
                  <s-link href="/app/view-stores">View all stores</s-link>
                </s-grid>
                    {stores.length > 0 ? (
                  <s-stack direction="block" gap="small-300">
                    {stores.slice(0, 5).map((store) => (
                      <s-box 
                            key={store.id}
                        padding="small-300" 
                        borderRadius="base"
                        style={{ 
                          borderBottom: "1px solid var(--p-color-border-subdued)"
                        }}
                      >
                        <s-grid gridTemplateColumns="1fr auto" gap="small-500" alignItems="start">
                          <s-stack direction="block" gap="small-500">
                            <s-text fontWeight="medium">{store.name}</s-text>
                            <s-text color="subdued">
                                  {store.address}, {store.city}, {store.state}
                            </s-text>
                          </s-stack>
                          <s-text color="subdued">
                                {formatDate(store.createdAt)}
                          </s-text>
                        </s-grid>
                      </s-box>
                    ))}
                  </s-stack>
                ) : (
                  <s-paragraph color="subdued">No recent activity</s-paragraph>
                )}
              </s-section>

              {/* Store Overview Sidebar */}
              <s-section>
                <s-stack direction="block" gap="base">
                  <s-heading>Store Overview</s-heading>
                  <s-box 
                    padding="base" 
                    background="subdued" 
                    borderRadius="base"
                    border="base"
                  >
                    <s-stack direction="block" gap="small-200">
                      <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                        <s-text>Total Stores</s-text>
                        <s-badge tone="info">{metrics.totalStores}</s-badge>
                      </s-stack>
                      <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                        <s-text>With Phone</s-text>
                        <s-badge tone="info">{metrics.storesWithPhone}</s-badge>
                      </s-stack>
                      <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                        <s-text>With Website</s-text>
                        <s-badge tone="info">{metrics.storesWithLink}</s-badge>
                      </s-stack>
                      <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                        <s-text>States Covered</s-text>
                        <s-badge tone="success">{metrics.uniqueStatesCount}</s-badge>
                      </s-stack>
                    </s-stack>
                  </s-box>
                  <s-button 
                    inlineSize="fill-available"
                      onClick={() => navigate("/app/view-stores")}
                    >
                      View All Stores
                  </s-button>
                </s-stack>
              </s-section>
            </s-grid>
          </>
        )}
      </s-stack>
    </s-page>
  );
}
