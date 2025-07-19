import {
  Page,
  Card,
  Layout,
  Text,
  InlineStack,
  Button,
  Spinner,
  EmptyState,
  Banner,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
import { loadGoogleMaps } from "../helper/loadGoogleMaps";

export const loader = async ({ request }) => {
  const prisma = (await import("../db.server")).default;
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: "desc" },
  });

  return {
    stores,
    googleMapsApiKey: process.env.GOOGLE_MAPS_PUBLIC_KEY,
  };
};

export default function MapPage() {
  const { stores, googleMapsApiKey } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);

  // Filter stores that have coordinates
  const storesWithCoordinates = stores.filter(store => store.lat && store.lng);
  const storesWithoutCoordinates = stores.filter(store => !store.lat || !store.lng);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setMapError(null);

        // Load Google Maps
        await loadGoogleMaps(googleMapsApiKey);

        // Initialize map
        const map = new google.maps.Map(mapRef.current, {
          zoom: 4,
          center: { lat: 39.8283, lng: -98.5795 }, // Center of US
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        mapInstanceRef.current = map;

        // Add markers for stores with coordinates
        if (storesWithCoordinates.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          
          storesWithCoordinates.forEach((store) => {
            const marker = new google.maps.Marker({
              position: { lat: store.lat, lng: store.lng },
              map: map,
              title: store.name,
              icon: {
                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" fill="#1976d2" stroke="white" stroke-width="2"/>
                    <circle cx="16" cy="16" r="6" fill="white"/>
                  </svg>
                `),
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16),
              },
            });

            // Create info window content
            const infoWindowContent = `
              <div style="padding: 8px; max-width: 250px;">
                <h3 style="margin: 0 0 8px 0; color: #1976d2; font-size: 16px;">${store.name}</h3>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #333;">
                  ${store.address}${store.address2 ? `, ${store.address2}` : ""}
                </p>
                <p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">
                  ${store.city}, ${store.state} ${store.zip}
                </p>
                ${store.phone ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">📞 ${store.phone}</p>` : ""}
                ${store.link ? `<p style="margin: 0; font-size: 14px;"><a href="${store.link}" target="_blank" style="color: #1976d2;">🌐 Visit Website</a></p>` : ""}
                <div style="margin-top: 8px;">
                  <button onclick="window.editStore('${store.id}')" style="background: #1976d2; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    Edit Store
                  </button>
                </div>
              </div>
            `;

            const infoWindow = new google.maps.InfoWindow({
              content: infoWindowContent,
            });

            // Add click listener to marker
            marker.addListener("click", () => {
              setSelectedStore(store);
              infoWindow.open(map, marker);
            });

            markersRef.current.push(marker);
            bounds.extend({ lat: store.lat, lng: store.lng });
          });

          // Fit map to show all markers
          if (storesWithCoordinates.length > 1) {
            map.fitBounds(bounds);
          } else if (storesWithCoordinates.length === 1) {
            map.setCenter({ lat: storesWithCoordinates[0].lat, lng: storesWithCoordinates[0].lng });
            map.setZoom(12);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize map:", error);
        setMapError("Failed to load the map. Please try refreshing the page.");
        setIsLoading(false);
      }
    };

    // Add global function for edit button
    window.editStore = (storeId) => {
      navigate(`/app/edit-store/${storeId}`);
    };

    initializeMap();

    // Cleanup
    return () => {
      if (window.editStore) {
        delete window.editStore;
      }
    };
  }, [storesWithCoordinates, googleMapsApiKey, navigate]);

  const handleAddStore = () => {
    navigate("/app/add-store");
  };

  const handleViewStores = () => {
    navigate("/app/view-stores");
  };

  const formatAddress = (store) => {
    return `${store.address}${store.address2 ? `, ${store.address2}` : ""}, ${store.city}, ${store.state} ${store.zip}`;
  };

  return (
    <Page
      title="Store Map"
      primaryAction={{
        content: "Add Store",
        onAction: handleAddStore,
      }}
      secondaryActions={[
        {
          content: "View All Stores",
          onAction: handleViewStores,
        },
      ]}
    >
      <TitleBar title="Store Map" />
      
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ position: "relative", height: "600px" }}>
              {isLoading && (
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 1000,
                  background: "white",
                  padding: "20px",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}>
                  <InlineStack gap="200" align="center">
                    <Spinner size="small" />
                    <Text variant="bodyMd">Loading map...</Text>
                  </InlineStack>
                </div>
              )}

              {mapError && (
                <Banner status="critical" title="Map Error">
                  <p>{mapError}</p>
                </Banner>
              )}

              {!isLoading && storesWithCoordinates.length === 0 && (
                <EmptyState
                  heading="No stores with locations found"
                  action={{
                    content: "Add your first store",
                    onAction: handleAddStore,
                  }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <Text variant="bodyMd" as="p">
                    Add stores with addresses to see them on the map. Stores without coordinates won't appear here.
                  </Text>
                </EmptyState>
              )}

              <div
                ref={mapRef}
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "600px",
                  borderRadius: "8px",
                }}
              />
            </div>
          </Card>
        </Layout.Section>

        {/* Store Statistics */}
        <Layout.Section secondary>
          <Card>
            <div style={{ padding: "16px" }}>
              <Text variant="headingMd" as="h3" fontWeight="bold">
                Store Overview
              </Text>
              
              <div style={{ marginTop: "16px" }}>
                <InlineStack align="space-between" gap="400">
                  <Text variant="bodyMd">Total Stores:</Text>
                  <Text variant="bodyMd" fontWeight="semibold">{stores.length}</Text>
                </InlineStack>
                
                <InlineStack align="space-between" gap="400" style={{ marginTop: "8px" }}>
                  <Text variant="bodyMd">On Map:</Text>
                  <Text variant="bodyMd" fontWeight="semibold" color="success">
                    {storesWithCoordinates.length}
                  </Text>
                </InlineStack>
                
                <InlineStack align="space-between" gap="400" style={{ marginTop: "8px" }}>
                  <Text variant="bodyMd">Need Coordinates:</Text>
                  <Text variant="bodyMd" fontWeight="semibold" color="warning">
                    {storesWithoutCoordinates.length}
                  </Text>
                </InlineStack>
              </div>

              {storesWithoutCoordinates.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <Banner status="warning" title="Some stores need coordinates">
                    <p>
                      {storesWithoutCoordinates.length} store{storesWithoutCoordinates.length !== 1 ? 's' : ''} don't have coordinates and won't appear on the map.
                    </p>
                    <Button
                      size="micro"
                      onClick={handleViewStores}
                      style={{ marginTop: "8px" }}
                    >
                      View All Stores
                    </Button>
                  </Banner>
                </div>
              )}

              {selectedStore && (
                <div style={{ marginTop: "16px", padding: "12px", background: "#f6f6f7", borderRadius: "6px" }}>
                  <Text variant="headingSm" as="h4" fontWeight="bold">
                    Selected Store
                  </Text>
                  <Text variant="bodyMd" as="p" style={{ marginTop: "4px" }}>
                    <strong>{selectedStore.name}</strong>
                  </Text>
                  <Text variant="bodyMd" as="p" style={{ marginTop: "4px", color: "#666" }}>
                    {formatAddress(selectedStore)}
                  </Text>
                  {selectedStore.phone && (
                    <Text variant="bodyMd" as="p" style={{ marginTop: "4px", color: "#666" }}>
                      📞 {selectedStore.phone}
                    </Text>
                  )}
                  <Button
                    size="micro"
                    onClick={() => navigate(`/app/edit-store/${selectedStore.id}`)}
                    style={{ marginTop: "8px" }}
                  >
                    Edit Store
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 