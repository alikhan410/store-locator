import {
  Page,
  Layout,
  Card,
  Text,
  Badge,
  BlockStack,
  Banner,
  Box,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useRef, useMemo, useState } from "react";
import { loadGoogleMaps } from "../helper/loadGoogleMaps";
import {
  createStatesDataForChoropleth,
  US_STATES_PLACE_IDS,
} from "../helper/states";
import { authenticate } from "../shopify.server";
import { cleanupGoogleMapsInstances } from "../helper/googleMapsLoader";

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const prisma = (await import("../db.server")).default;

  // Get subscription information
  const { appSubscriptions } = await billing.check();
  const subscription = appSubscriptions?.[0];

  const stores = await prisma.store.findMany({
    where: {
      shop: session.shop,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    stores,
    subscription,
    googleMapsApiKey: process.env.GOOGLE_MAPS_PUBLIC_KEY,
  };
};

export default function ChoroplethPage() {
  const { stores, subscription, googleMapsApiKey } = useLoaderData();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [selectedState, setSelectedState] = useState(null);

  // Phase 3: Data Processing
  const {
    storesWithCoordinates,
    storesWithoutCoordinates,
    storesByState,
    stateStats,
    growthMetrics,
  } = useMemo(() => {
    // 3.1: Filter stores with coordinates
    const storesWithCoordinates = stores.filter(
      (store) => store.lat && store.lng,
    );

    // 3.2: Filter stores without coordinates
    const storesWithoutCoordinates = stores.filter(
      (store) => !store.lat || !store.lng,
    );

    // 3.3: Group stores by state
    const storesByState = stores.reduce((acc, store) => {
      if (store.state) {
        if (!acc[store.state]) {
          acc[store.state] = [];
        }
        acc[store.state].push(store);
      }
      return acc;
    }, {});

    // 3.4: Calculate state statistics and sort
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    
    const stateStats = Object.entries(storesByState)
      .map(([stateCode, stateStores]) => {
        const storesWithCoords = stateStores.filter((store) => store.lat && store.lng).length;
        const storesWithoutCoords = stateStores.filter((store) => !store.lat || !store.lng).length;
        const recentStores = stateStores.filter(
          (store) => new Date(store.createdAt) > oneWeekAgo
        ).length;
        const monthlyStores = stateStores.filter(
          (store) => new Date(store.createdAt) > oneMonthAgo
        ).length;
        const geocodingPercent = stateStores.length > 0 
          ? Math.round((storesWithCoords / stateStores.length) * 100)
          : 0;
        
        return {
          stateCode,
          stateName: US_STATES_PLACE_IDS[stateCode] ? stateCode : stateCode,
          storeCount: stateStores.length,
          storesWithCoords,
          storesWithoutCoords,
          recentStores,
          monthlyStores,
          geocodingPercent,
        };
      })
      .sort((a, b) => b.storeCount - a.storeCount); // Sort by store count descending

    // 3.5: Calculate growth metrics (moved from inline JSX)
    const weeklyGrowth = stores.filter((s) => new Date(s.createdAt) > oneWeekAgo).length;
    const monthlyGrowth = stores.filter((s) => new Date(s.createdAt) > oneMonthAgo).length;
    const sixMonthGrowth = stores.filter((s) => new Date(s.createdAt) > sixMonthsAgo).length;

    // Calculate monthly breakdown for chart
    const monthCounts = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = stores.filter(
        (s) => new Date(s.createdAt) >= monthStart && new Date(s.createdAt) <= monthEnd
      ).length;
      monthCounts.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        count,
      });
    }

    const growthMetrics = {
      weeklyGrowth,
      monthlyGrowth,
      sixMonthGrowth,
      monthCounts,
      maxMonthCount: Math.max(...monthCounts.map(m => m.count), 1),
    };

    return {
      storesWithCoordinates,
      storesWithoutCoordinates,
      storesByState,
      stateStats,
      growthMetrics,
    };
  }, [stores]);

  // Phase 5.1: Color legend data with Tailwind teal colors (slate for 0)
  const colorLegend = [
    { color: "#e2e8f0", label: "0 stores", count: 0 }, // slate-200
    { color: "#ccfbf1", label: "1-4 stores", count: 1 }, // teal-100
    { color: "#99f6e4", label: "5-9 stores", count: 5 }, // teal-200
    { color: "#5eead4", label: "10-19 stores", count: 10 }, // teal-300
    { color: "#14b8a6", label: "20-49 stores", count: 20 }, // teal-500
    { color: "#0f766e", label: "50+ stores", count: 50 }, // teal-700
  ];

  // Create states data for choropleth using helper
  const states = createStatesDataForChoropleth(stores);

  useEffect(() => {
    if (!mapRef.current || !googleMapsApiKey) return;

    let isMounted = true;

    const initMap = async () => {
      await loadGoogleMaps(googleMapsApiKey);

      if (!isMounted || !mapRef.current) return;

      const { Map } = await google.maps.importLibrary("maps");

      const map = new Map(mapRef.current, {
        center: { lat: 40.76, lng: -101.64 },
        zoom: 5,
        mapId: "7ba16be0c9375fa7",
        draggable: true,
        zoomControl: true,
        scrollwheel: true,
        disableDoubleClickZoom: false,
        streetViewControl: true,
        mapTypeControl: true,
        fullscreenControl: true,
      });

      // Store map instance for cleanup
      mapInstanceRef.current = map;

      const featureLayer = map.getFeatureLayer(
        google.maps.FeatureType.ADMINISTRATIVE_AREA_LEVEL_1,
      );

      featureLayer.style = (featureStyleFunctionOptions) => {
        const placeFeature = featureStyleFunctionOptions.feature;
        const storeCount = states[placeFeature.placeId] || 0;

        let fillColor;
        if (storeCount === 0) {
          fillColor = "#e2e8f0"; // slate-200
        } else if (storeCount < 5) {
          fillColor = "#ccfbf1"; // teal-100
        } else if (storeCount < 10) {
          fillColor = "#99f6e4"; // teal-200
        } else if (storeCount < 20) {
          fillColor = "#5eead4"; // teal-300
        } else if (storeCount < 50) {
          fillColor = "#14b8a6"; // teal-500
        } else {
          fillColor = "#0f766e"; // teal-700
        }

        return {
          fillColor,
          fillOpacity: 0.8,
        };
      };
    };

    initMap();

    // Cleanup function
    return () => {
      isMounted = false;
      cleanupGoogleMapsInstances(
        mapInstanceRef.current,
        null, // no marker
        null, // no autocomplete
      );
      mapInstanceRef.current = null;
    };
  }, [stores, googleMapsApiKey, states]);



  const handleStateClick = (stateCode) => {
    setSelectedState(stateCode);
    // Phase 4.2 will add zoom functionality here
  };

  return (
    <Page
      title="Choropleth Map"
      secondaryActions={[
        {
          content: "View All Stores",
          onAction: () => navigate("/app/view-stores"),
        },
      ]}
    >
      <TitleBar title="Store Distribution Map" />

      <Box paddingBlockEnd="2400">
        <Layout>
        <Layout.Section>
          {/* Analytics Cards */}
          <InlineStack gap="400" align="stretch" wrap>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  Total Stores
                </Text>
                <Text variant="heading2xl" as="p">
                  {stores.length}
                </Text>
                <Text variant="bodyMd" color="subdued">
                  All store locations
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  On Map
                </Text>
                <Text variant="heading2xl" as="p" color="success">
                  {storesWithCoordinates.length}
                </Text>
                <Text variant="bodyMd" color="subdued">
                  {stores.length > 0
                    ? `${Math.round((storesWithCoordinates.length / stores.length) * 100)}% geocoded`
                    : "0% geocoded"}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  States Covered
                </Text>
                <Text variant="heading2xl" as="p">
                  {stateStats.length}
                </Text>
                <Text variant="bodyMd" color="subdued">
                  {stateStats.length === 1 ? "state" : "states"} with stores
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h3">
                  Avg per State
                </Text>
                <Text variant="heading2xl" as="p">
                  {stateStats.length > 0
                    ? Math.round((stores.length / stateStats.length) * 10) / 10
                    : 0}
                </Text>
                <Text variant="bodyMd" color="subdued">
                  Average stores per state
                </Text>
              </BlockStack>
            </Card>
          </InlineStack>

          <Box paddingBlockStart="400">
            <Card>
            <div
              ref={mapRef}
              style={{
                width: "100%",
                height: "600px",
                position: "relative",
              }}
            />

            {/* Phase 5.1: Color Legend */}
            <div
              style={{
                position: "absolute",
                bottom: "20px",
                left: "20px",
                background: "white",
                padding: "12px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                fontSize: "12px",
                zIndex: 1000,
              }}
            >
              <Text variant="headingMd" as="h3" fontWeight="bold">
                Store Count
              </Text>
              <BlockStack gap="200">
                {colorLegend.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "16px",
                        height: "16px",
                        backgroundColor: item.color,
                        border: "1px solid #ccc",
                      }}
                    />
                    <Text variant="bodySm">{item.label}</Text>
                  </div>
                ))}
              </BlockStack>
            </div>
          </Card>
          </Box>
        </Layout.Section>

        <Layout.Section secondary>
          <BlockStack gap="400">
            {/* Growth & Activity Card */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h3" fontWeight="bold">
                  Growth & Activity
                </Text>

                {/* Recent Activity Metrics */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f6f6f7",
                      borderRadius: "8px",
                    }}
                  >
                    <BlockStack gap="100">
                      <Text variant="bodySm" tone="subdued">
                        This Week
                      </Text>
                      <Text variant="headingLg" as="p" fontWeight="bold">
                        +{growthMetrics.weeklyGrowth}
                      </Text>
                      <Text variant="bodySm" tone="success">
                        New stores
                      </Text>
                    </BlockStack>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f6f6f7",
                      borderRadius: "8px",
                    }}
                  >
                    <BlockStack gap="100">
                      <Text variant="bodySm" tone="subdued">
                        This Month
                      </Text>
                      <Text variant="headingLg" as="p" fontWeight="bold">
                        +{growthMetrics.monthlyGrowth}
                      </Text>
                      <Text variant="bodySm" tone="subdued">
                        New stores
                      </Text>
                    </BlockStack>
                  </div>

                  <div
                    style={{
                      padding: "16px",
                      backgroundColor: "#f6f6f7",
                      borderRadius: "8px",
                    }}
                  >
                    <BlockStack gap="100">
                      <Text variant="bodySm" tone="subdued">
                        Last 6 Months
                      </Text>
                      <Text variant="headingLg" as="p" fontWeight="bold">
                        +{growthMetrics.sixMonthGrowth}
                      </Text>
                      <Text variant="bodySm" tone="subdued">
                        New stores
                      </Text>
                    </BlockStack>
                  </div>
                </div>

                {/* Growth Timeline Visualization */}
                {stores.length > 0 && (
                  <BlockStack gap="200">
                    <Text variant="bodyMd" fontWeight="semibold">
                      Monthly Growth Trend
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "8px",
                        height: "140px",
                        padding: "12px",
                        backgroundColor: "#f6f6f7",
                        borderRadius: "8px",
                      }}
                    >
                      {growthMetrics.monthCounts.map((month, idx) => {
                        const barHeight = growthMetrics.maxMonthCount > 0 
                          ? (month.count / growthMetrics.maxMonthCount) * 100 
                          : 0;
                        return (
                          <div
                            key={idx}
                            style={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                height: "100px",
                                display: "flex",
                                alignItems: "flex-end",
                                justifyContent: "center",
                              }}
                            >
                              <div
                                style={{
                                  width: "70%",
                                  height: `${barHeight}%`,
                                  backgroundColor: "#008060",
                                  borderRadius: "4px 4px 0 0",
                                  transition: "height 0.3s",
                                  minHeight: month.count > 0 ? "8px" : "0",
                                }}
                                title={`${month.count} stores`}
                              />
                            </div>
                            <Text variant="bodySm" tone="subdued">
                              {month.month}
                            </Text>
                          </div>
                        );
                      })}
                    </div>
                    <Text variant="bodySm" tone="subdued">
                      Store additions over the last 6 months
                    </Text>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
      </Box>
    </Page>
  );
}
