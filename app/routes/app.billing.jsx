import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { checkStoreLimit } from "../helper/planLimits";

export const loader = async ({ request }) => {
  const { session, billing } = await authenticate.admin(request);
  const prisma = (await import("../db.server")).default;

  const { appSubscriptions } = await billing.check();
  const subscription = appSubscriptions?.[0];

  const currentStoreCount = await prisma.store.count({
    where: { shop: session.shop },
  });

  const limitCheck = checkStoreLimit(subscription, currentStoreCount);

  // Determine plan name for display
  let planName = "Free Plan";
  let planStatus = "ACTIVE";
  
  if (subscription) {
    planName = subscription.name || "Free Plan";
    planStatus = subscription.status || "ACTIVE";
  }

  return {
    plan: planName,
    status: planStatus,
    storeLimit: limitCheck.limit,
    currentStoreCount,
    remainingSlots: limitCheck.remaining,
    canAdd: limitCheck.canAdd,
  };
};

export default function Billing() {
  const { plan, status, storeLimit, currentStoreCount, remainingSlots, canAdd } =
    useLoaderData();

  const usagePercentage = storeLimit > 0 ? (currentStoreCount / storeLimit) * 100 : 0;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = usagePercentage >= 100;

  return (
    <s-page heading="Billing & Subscription">
      <ui-title-bar title="Billing & Subscription" />
      <s-stack direction="block" gap="large-200">
        {/* Warning Banner for Near Limit */}
        {isNearLimit && !isAtLimit && (
          <s-banner
            heading="Approaching Store Limit"
            tone="warning"
          >
            <s-paragraph>You're using {Math.floor(usagePercentage)}% of your store limit. Consider upgrading to add more stores.</s-paragraph>
            <s-button
              slot="secondary-actions"
              variant="secondary"
              onClick={() => {
                window.open("https://admin.shopify.com/charges/storetrail/pricing_plans", "_blank");
              }}
            >
              Upgrade Plan
            </s-button>
          </s-banner>
        )}

        {/* Error Banner for At Limit */}
        {isAtLimit && (
          <s-banner
            heading="Store Limit Reached"
            tone="critical"
          >
            <s-paragraph>You've reached your store limit. Upgrade your plan to add more stores.</s-paragraph>
            <s-button
              slot="secondary-actions"
              variant="secondary"
              onClick={() => {
                window.open("https://admin.shopify.com/charges/storetrail/pricing_plans", "_blank");
              }}
            >
              Upgrade Plan
            </s-button>
          </s-banner>
        )}

        <s-section heading="Subscription Plan">
          <s-stack direction="block" gap="base">
            <s-grid gridTemplateColumns="1fr 1fr" gap="large-400" alignItems="start">
              <s-stack direction="block" gap="small-200">
                <s-text color="subdued">Plan</s-text>
                <s-heading>{plan}</s-heading>
              </s-stack>
              <s-stack direction="block" gap="small-200">
                <s-text color="subdued">Status</s-text>
                <s-badge tone={status === "ACTIVE" ? "success" : "critical"}>{status}</s-badge>
              </s-stack>
            </s-grid>
            <s-divider />
            <s-grid gridTemplateColumns="1fr 1fr" gap="large-400" alignItems="start">
              <s-stack direction="block" gap="small-200">
                <s-text color="subdued">Store Usage</s-text>
                <s-text>
                  {currentStoreCount} / {storeLimit}
                </s-text>
              </s-stack>
              <s-stack direction="block" gap="small-200">
                <s-text color="subdued">Remaining Slots</s-text>
                {isNearLimit ? (
                  <s-text tone="critical">
                    {remainingSlots} store slot{remainingSlots === 1 ? "" : "s"} remaining
                  </s-text>
                ) : (
                  <s-text>
                    {remainingSlots} store slot{remainingSlots === 1 ? "" : "s"} remaining
                  </s-text>
                )}
              </s-stack>
            </s-grid>
          </s-stack>
        </s-section>

        <s-section>
          <s-paragraph>
            Want to change your plan?{" "}
            <s-link
              href="https://admin.shopify.com/charges/storetrail/pricing_plans"
              target="_blank"
            >
              View plans
            </s-link>{" "}
            on Shopify.
          </s-paragraph>
        </s-section>
      </s-stack>
    </s-page>
  );
}
