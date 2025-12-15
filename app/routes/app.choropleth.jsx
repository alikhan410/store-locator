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
    const stateStats = Object.entries(storesByState)
      .map(([stateCode, stateStores]) => ({
        stateCode,
        stateName: US_STATES_PLACE_IDS[stateCode] ? stateCode : stateCode,
        storeCount: stateStores.length,
        storesWithCoords: stateStores.filter((store) => store.lat && store.lng)
          .length,
        storesWithoutCoords: stateStores.filter(
          (store) => !store.lat || !store.lng,
        ).length,
      }))
      .sort((a, b) => b.storeCount - a.storeCount); // Sort by store count descending

    return {
      storesWithCoordinates,
      storesWithoutCoordinates,
      storesByState,
      stateStats,
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

  const handleViewStores = () => {
    navigate("/app/view-stores");
  };

  const handleStateClick = (stateCode) => {
    setSelectedState(stateCode);
    // Phase 4.2 will add zoom functionality here
  };

  return (
    <Page
      title="Store Distribution Map"
      primaryAction={{
        content: "View All Stores",
        onAction: handleViewStores,
      }}
    >
      <TitleBar title="Store Distribution Map" />

      <Layout>
        <Layout.Section>
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
        </Layout.Section>

        <Layout.Section secondary>
          {/* Phase 5.2: Statistics Sidebar */}
          <Card>
            <BlockStack gap="400">
              <div>
                <Text variant="headingMd" as="h3" fontWeight="bold">
                  Statistics
                </Text>
                <BlockStack gap="200">
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text variant="bodyMd">Total Stores:</Text>
                    <Badge tone="info">{stores.length}</Badge>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text variant="bodyMd">On Map:</Text>
                    <Badge tone="success">{storesWithCoordinates.length}</Badge>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text variant="bodyMd">States Covered:</Text>
                    <Badge tone="info">{stateStats.length}</Badge>
                  </div>
                </BlockStack>
              </div>

              {/* Phase 5.4: Stores without coordinates warning */}
              {storesWithoutCoordinates.length > 0 && (
                <Banner tone="warning">
                  <Text variant="bodySm">
                    {storesWithoutCoordinates.length} store(s) missing
                    coordinates
                  </Text>
                </Banner>
              )}

              {/* Phase 5.3: Top States List */}
              <div>
                <Text variant="headingMd" as="h3" fontWeight="bold">
                  Top States
                </Text>
                <BlockStack gap="200">
                  {stateStats.slice(0, 10).map((state) => (
                    <div
                      key={state.stateCode}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px",
                        cursor: "pointer",
                        borderRadius: "4px",
                        backgroundColor:
                          selectedState === state.stateCode
                            ? "#f6f6f7"
                            : "transparent",
                      }}
                      onClick={() => handleStateClick(state.stateCode)}
                    >
                      <Text variant="bodyMd">{state.stateCode}</Text>
                      <Badge tone="info">{state.storeCount}</Badge>
                    </div>
                  ))}
                </BlockStack>
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
