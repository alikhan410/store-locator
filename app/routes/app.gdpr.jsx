import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Banner,
  Divider,
  List,
  Badge,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { exportAllStoresToCSV } from "../helper/exportAction";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const prisma = (await import("../db.server")).default;

  // Get store count for the current shop
  const storeCount = await prisma.store.count({
    where: {
      shop: session.shop,
    },
  });

  return {
    storeCount,
    shop: session.shop,
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const prisma = (await import("../db.server")).default;
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "export") {
    // Export all store data for the shop
    const stores = await prisma.store.findMany({
      where: {
        shop: session.shop,
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      success: true,
      data: stores,
      message: "Data export completed successfully",
    });
  }

  if (action === "delete") {
    // Delete all store data for the shop (GDPR right to be forgotten)
    const deletedCount = await prisma.store.deleteMany({
      where: {
        shop: session.shop,
      },
    });

    return Response.json({
      success: true,
      deletedCount: deletedCount.count,
      message: `Successfully deleted ${deletedCount.count} stores`,
    });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
};

export default function GDPRPage() {
  const { storeCount, shop } = useLoaderData();
  const navigate = useNavigate();
  const shopify = useAppBridge();

  const handleExportData = async () => {
    try {
      const formData = new FormData();
      formData.append("action", "export");

      const response = await fetch("/app/gdpr", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Export the data as CSV
        exportAllStoresToCSV(result.data);
        shopify.toast.show("Data exported successfully!");
      } else {
        shopify.toast.show("Export failed", { isError: true });
      }
    } catch (error) {
      console.error("Export error:", error);
      shopify.toast.show("Export failed", { isError: true });
    }
  };

  const handleDeleteData = async () => {
    if (!confirm("Are you sure you want to delete ALL your store data? This action cannot be undone.")) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("action", "delete");

      const response = await fetch("/app/gdpr", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        shopify.toast.show(result.message);
        // Redirect to dashboard after deletion
        navigate("/app");
      } else {
        shopify.toast.show("Deletion failed", { isError: true });
      }
    } catch (error) {
      console.error("Deletion error:", error);
      shopify.toast.show("Deletion failed", { isError: true });
    }
  };

  return (
    <Page>
      <TitleBar title="Data Privacy & GDPR" />
      <BlockStack gap="500">
        <Banner
          title="Your Data Privacy Rights"
          tone="info"
        >
          <Text variant="bodyMd" as="p">
            Under GDPR and other privacy regulations, you have the right to access, 
            export, and delete your personal data. This page allows you to exercise 
            these rights for your store location data.
          </Text>
        </Banner>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Data Summary
                </Text>
                <InlineStack align="space-between">
                  <Text variant="bodyMd" as="p">
                    Total stores in your account:
                  </Text>
                  <Badge tone="info">{storeCount}</Badge>
                </InlineStack>
                <InlineStack align="space-between">
                  <Text variant="bodyMd" as="p">
                    Shop domain:
                  </Text>
                  <Text variant="bodyMd" as="p" color="subdued">
                    {shop}
                  </Text>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Privacy Policy & Legal
                </Text>
                <Text variant="bodyMd" as="p">
                  We are committed to protecting your privacy and ensuring compliance with data protection regulations.
                </Text>
                <InlineStack gap="200">
                  <Button
                    url="https://mbernier.com/privacy"
                    target="_blank"
                    external
                  >
                    View Privacy Policy
                  </Button>
                  <Button
                    url="mailto:mkbernier@gmail.com?subject=Privacy%20Policy%20Question"
                    external
                  >
                    Contact Us
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Export Your Data
                </Text>
                <Text variant="bodyMd" as="p">
                  Download all your store location data in CSV format. This includes:
                </Text>
                <List type="bullet">
                  <List.Item>Store names and addresses</List.Item>
                  <List.Item>Contact information (phone, website)</List.Item>
                  <List.Item>Geographic coordinates</List.Item>
                  <List.Item>Creation dates and notes</List.Item>
                </List>
                <Button
                  primary
                  onClick={handleExportData}
                  disabled={storeCount === 0}
                >
                  Export All Store Data
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Delete Your Data
                </Text>
                <Banner tone="warning">
                  <Text variant="bodyMd" as="p">
                    <strong>Warning:</strong> This action will permanently delete ALL 
                    your store location data. This action cannot be undone and will 
                    remove all stores from your account.
                  </Text>
                </Banner>
                <Text variant="bodyMd" as="p">
                  If you choose to delete your data:
                </Text>
                <List type="bullet">
                  <List.Item>All store locations will be permanently removed</List.Item>
                  <List.Item>Your store locator widget will no longer function</List.Item>
                  <List.Item>You will need to re-add stores if you reinstall the app</List.Item>
                </List>
                <Button
                  destructive
                  onClick={handleDeleteData}
                  disabled={storeCount === 0}
                >
                  Delete All Store Data
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Data Retention Policy
                </Text>
                <Text variant="bodyMd" as="p">
                  We retain your store location data only as long as:
                </Text>
                <List type="bullet">
                  <List.Item>Your app remains installed on your Shopify store</List.Item>
                  <List.Item>You actively use the store locator functionality</List.Item>
                  <List.Item>Required for legal or regulatory compliance</List.Item>
                </List>
                <Text variant="bodyMd" as="p">
                  When you uninstall the app, all your data is automatically deleted 
                  within 30 days. You can also manually delete your data at any time 
                  using the button above.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
} 