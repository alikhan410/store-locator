import { useEffect, useState } from "react";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  Badge,
  Icon,
  EmptyState,
  Spinner,
  Divider,
  ProgressBar,
} from "@shopify/polaris";
import { 
  TitleBar, 
  useAppBridge 
} from "@shopify/app-bridge-react";
import { 
  AlertMinor, 
  LocationMajor, 
  PhoneMajor,
  ExportMinor,
  ImportMinor,
  PlusMinor,
  ViewMinor
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  const prisma = (await import("../db.server")).default;
  
  // Get all stores with metrics
  const stores = await prisma.store.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Calculate metrics
  const totalStores = stores.length;
  const recentStores = stores.filter(store => new Date(store.createdAt) > oneWeekAgo);
  const uniqueStates = [...new Set(stores.map(store => store.state))];
  const geocodedStores = stores.filter(store => store.lat && store.lng);
  const storesWithPhone = stores.filter(store => store.phone);
  const storesWithLink = stores.filter(store => store.link);
  
  // Health metrics
  const missingCoordinates = stores.filter(store => !store.lat || !store.lng).length;
  const missingPhone = stores.filter(store => !store.phone).length;
  
  return {
    stores: stores.slice(0, 10), // Recent 10 for activity feed
    metrics: {
      totalStores,
      recentStoresCount: recentStores.length,
      uniqueStatesCount: uniqueStates.length,
      geocodedPercent: totalStores > 0 ? Math.round((geocodedStores.length / totalStores) * 100) : 0,
      storesWithPhone: storesWithPhone.length,
      storesWithLink: storesWithLink.length,
      missingCoordinates,
      missingPhone,
    }
  };
};

export default function Index() {
  const { stores, metrics } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();
  const [showImport, setShowImport] = useState(false);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'Yesterday';
    }
    if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    }
    return date.toLocaleDateString();
  };
  
  const handleExportStores = () => {
    // Import the export function and call it
    import("../helper/exportAction").then(({ exportAllStoresToCSV }) => {
      exportAllStoresToCSV(stores);
      shopify.toast.show("Stores exported successfully!");
    });
  };
  
  const handleFixGeocoding = () => {
    shopify.toast.show("Geocoding fix feature coming soon!");
    // This would trigger a background job to geocode missing stores
  };

  return (
    <Page>
      <TitleBar title="Store Locator Dashboard" />
      <BlockStack gap="500">
        
        {/* Welcome message for new users */}
        {metrics.totalStores === 0 && (
          <Card>
            <EmptyState
              heading="Welcome to Store Locator! 🎉"
              action={{
                content: "Add Your First Store",
                onAction: () => navigate("/app/add-store"),
              }}
              secondaryAction={{
                content: "Import Multiple Stores",
                onAction: () => navigate("/app/view-stores"),
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <Text variant="bodyMd" as="p">
                Get started by adding your store locations to help customers find you easily.
              </Text>
            </EmptyState>
          </Card>
        )}
        
        {/* Dashboard metrics - only show if there are stores */}
        {metrics.totalStores > 0 && (
          <>
            {/* Hero Dashboard Cards */}
            <Layout>
              <Layout.Section>
                <InlineStack gap="400">
                  <Card>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text variant="headingMd" as="h2">Total Stores</Text>
                        <Icon source={LocationMajor} color="base" />
                      </InlineStack>
                      <Text variant="heading2xl" as="p" color="success">
                        {metrics.totalStores}
                      </Text>
                      <Text variant="bodyMd" color="subdued">
                        {metrics.recentStoresCount > 0 
                          ? `+${metrics.recentStoresCount} added this week`
                          : "No new stores this week"
                        }
                      </Text>
                    </BlockStack>
                  </Card>
                  
                  <Card>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text variant="headingMd" as="h2">Store Coverage</Text>
                        <Badge status="info">{metrics.uniqueStatesCount}</Badge>
                      </InlineStack>
                      <Text variant="heading2xl" as="p">
                        {metrics.uniqueStatesCount}
                      </Text>
                      <Text variant="bodyMd" color="subdued">
                        {metrics.uniqueStatesCount === 1 ? 'state covered' : 'states covered'}
                      </Text>
                    </BlockStack>
                  </Card>
                  
                  <Card>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text variant="headingMd" as="h2">Geocoded</Text>
                        <Badge status={metrics.geocodedPercent === 100 ? "success" : "warning"}>
                          {metrics.geocodedPercent}%
                        </Badge>
                      </InlineStack>
                      <Text variant="heading2xl" as="p">
                        {metrics.geocodedPercent}%
                      </Text>
                      <Text variant="bodyMd" color="subdued">
                        stores have coordinates
                      </Text>
                      {metrics.geocodedPercent < 100 && (
                        <ProgressBar progress={metrics.geocodedPercent} size="small" />
                      )}
                    </BlockStack>
                  </Card>
                </InlineStack>
              </Layout.Section>
            </Layout>

            {/* Quick Actions */}
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Quick Actions</Text>
                <InlineStack gap="200">
                  <Button 
                    primary 
                    icon={PlusMinor}
                    onClick={() => navigate("/app/add-store")}
                  >
                    Add New Store
                  </Button>
                  <Button 
                    icon={ViewMinor}
                    onClick={() => navigate("/app/view-stores")}
                  >
                    Manage Stores
                  </Button>
                  <Button 
                    icon={ImportMinor}
                    onClick={() => navigate("/app/view-stores")}
                  >
                    Import CSV
                  </Button>
                  <Button 
                    icon={ExportMinor}
                    onClick={handleExportStores}
                  >
                    Export Data
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>

            {/* Store Health Check */}
            {(metrics.missingCoordinates > 0 || metrics.missingPhone > 0) && (
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">Store Health</Text>
                  <List>
                    {metrics.missingCoordinates > 0 && (
                      <List.Item>
                        <InlineStack gap="200" align="space-between">
                          <InlineStack gap="200">
                            <Icon source={AlertMinor} color="warning" />
                            <Text>
                              {metrics.missingCoordinates} stores need geocoding
                            </Text>
                          </InlineStack>
                          <Button size="micro" onClick={handleFixGeocoding}>
                            Fix Now
                          </Button>
                        </InlineStack>
                      </List.Item>
                    )}
                    {metrics.missingPhone > 0 && (
                      <List.Item>
                        <InlineStack gap="200" align="space-between">
                          <InlineStack gap="200">
                            <Icon source={PhoneMajor} color="base" />
                            <Text>
                              {metrics.missingPhone} stores missing phone numbers
                            </Text>
                          </InlineStack>
                          <Button 
                            size="micro" 
                            onClick={() => navigate("/app/view-stores")}
                          >
                            Review
                          </Button>
                        </InlineStack>
                      </List.Item>
                    )}
                  </List>
                </BlockStack>
              </Card>
            )}

            {/* Recent Activity */}
            <Layout>
              <Layout.Section>
                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between">
                      <Text variant="headingMd" as="h2">Recent Activity</Text>
                      <Link url="/app/view-stores">View all stores</Link>
                    </InlineStack>
                    {stores.length > 0 ? (
                      <List>
                        {stores.slice(0, 5).map(store => (
                          <List.Item key={store.id}>
                            <InlineStack gap="200" align="space-between">
                              <BlockStack gap="100">
                                <Text variant="bodyMd" fontWeight="medium">
                                  {store.name}
                                </Text>
                                <Text variant="bodyMd" color="subdued">
                                  {store.address}, {store.city}, {store.state}
                                </Text>
                              </BlockStack>
                              <Text variant="bodyMd" color="subdued">
                                {formatDate(store.createdAt)}
                              </Text>
                            </InlineStack>
                          </List.Item>
                        ))}
                      </List>
                    ) : (
                      <Text variant="bodyMd" color="subdued">
                        No recent activity
                      </Text>
                    )}
                  </BlockStack>
                </Card>
              </Layout.Section>
              
              {/* Store Overview Sidebar */}
              <Layout.Section variant="oneThird">
                <Card>
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h2">Store Overview</Text>
                    <Box 
                      padding="400" 
                      background="bg-surface-secondary"
                      borderRadius="200"
                      borderWidth="025"
                      borderColor="border"
                    >
                      <BlockStack gap="200">
                        <InlineStack align="space-between">
                          <Text variant="bodyMd">Total Stores</Text>
                          <Badge>{metrics.totalStores}</Badge>
                        </InlineStack>
                        <InlineStack align="space-between">
                          <Text variant="bodyMd">With Phone</Text>
                          <Badge status="info">{metrics.storesWithPhone}</Badge>
                        </InlineStack>
                        <InlineStack align="space-between">
                          <Text variant="bodyMd">With Website</Text>
                          <Badge status="info">{metrics.storesWithLink}</Badge>
                        </InlineStack>
                        <InlineStack align="space-between">
                          <Text variant="bodyMd">States Covered</Text>
                          <Badge status="success">{metrics.uniqueStatesCount}</Badge>
                        </InlineStack>
                      </BlockStack>
                    </Box>
                    <Button 
                      fullWidth 
                      onClick={() => navigate("/app/view-stores")}
                    >
                      View All Stores
                    </Button>
                  </BlockStack>
                </Card>
              </Layout.Section>
            </Layout>
          </>
        )}
      </BlockStack>
    </Page>
  );
}
