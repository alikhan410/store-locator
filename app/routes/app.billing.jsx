import { Card, Page, Text, BlockStack, InlineStack, Badge, Banner, Button } from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { checkStoreLimit, getPlanFeatures } from "../helper/planLimits";

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const prisma = (await import("../db.server")).default;

  const { appSubscriptions } = await billing.check();
  const subscription = appSubscriptions?.[0];

  const currentStoreCount = await prisma.store.count({
    where: { shop: session.shop },
  });

  const limitCheck = checkStoreLimit(subscription, currentStoreCount);

  return {
    plan: subscription?.name || "No Active Plan",
    status: subscription?.status || "INACTIVE",
    storeLimit: limitCheck.limit,
    currentStoreCount,
    remainingSlots: limitCheck.remaining,
    canAdd: limitCheck.canAdd,
    features: getPlanFeatures(subscription?.name),
  };
};

export default function Settings() {
  const { plan, status, storeLimit, currentStoreCount, remainingSlots, canAdd, features } =
    useLoaderData();

  const statusBadge = (
    <Badge tone={status === "ACTIVE" ? "success" : "critical"}>
      {status}
    </Badge>
  );

  const usagePercentage = storeLimit > 0 ? (currentStoreCount / storeLimit) * 100 : 0;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 100;

  return (
    <Page title="Settings">
      <BlockStack gap="500">
        {/* Warning Banner for Near Limit */}
        {isNearLimit && !isAtLimit && (
          <Banner
            title="Approaching Store Limit"
            tone="warning"
            action={{ content: "Upgrade Plan", url: "https://admin.shopify.com/charges/store-locator-176/pricing_plans" }}
          >
            <p>You're using {usagePercentage.toFixed(0)}% of your store limit. Consider upgrading to add more stores.</p>
          </Banner>
        )}

        {/* Error Banner for At Limit */}
        {isAtLimit && (
          <Banner
            title="Store Limit Reached"
            tone="critical"
            action={{ content: "Upgrade Plan", url: "https://admin.shopify.com/charges/store-locator-176/pricing_plans" }}
          >
            <p>You've reached your store limit. Upgrade your plan to add more stores.</p>
          </Banner>
        )}

        <Card title="Subscription Plan" sectioned>
          <InlineStack gap="400" align="space-between">
            <BlockStack gap="100">
              <Text variant="headingMd">Plan: {plan}</Text>
              <Text>Status: {statusBadge}</Text>
            </BlockStack>
            <BlockStack gap="100" align="end">
              <Text>
                Store Usage: {currentStoreCount} / {storeLimit}
              </Text>
              <Text variant="bodySm" tone={isNearLimit ? "critical" : "subdued"}>
                You have {remainingSlots} store slot
                {remainingSlots === 1 ? "" : "s"} left.
              </Text>
            </BlockStack>
          </InlineStack>
        </Card>

        {/* Plan Features */}
        {features && features.length > 0 && (
          <Card title="Plan Features" sectioned>
            <InlineStack gap="200" wrap>
              {features.map((feature, index) => (
                <Badge key={index} tone="info">
                  {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              ))}
            </InlineStack>
          </Card>
        )}

        <Card sectioned>
          <Text as="p">
            Want to change your plan?{" "}
            <a
              href="https://admin.shopify.com/charges/store-locator-176/pricing_plans"
              target="_blank"
              rel="noopener noreferrer"
            >
              View plans
            </a>{" "}
            on Shopify.
          </Text>
        </Card>
      </BlockStack>
    </Page>
  );
}
