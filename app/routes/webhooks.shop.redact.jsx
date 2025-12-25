import { authenticate } from "../shopify.server";
import db from "../db.server";

/**
 * Mandatory compliance webhook: shop/redact
 * 
 * 48 hours after a store owner uninstalls your app, Shopify sends this webhook.
 * This provides the store's shop_id and shop_domain so you can erase all data
 * for that store from your database.
 * 
 * This is similar to app/uninstalled but is specifically for GDPR compliance
 * and is sent 48 hours after uninstall (giving you time to process app/uninstalled first).
 */
export const action = async ({ request }) => {
  // authenticate.webhook() will throw a Response with 401 status if HMAC is invalid
  // Let it propagate - Remix will handle it correctly
  const { shop, topic, payload } = await authenticate.webhook(request);
  
  console.log(`Received ${topic} webhook for ${shop}`);
  console.log("Shop redact payload:", JSON.stringify(payload, null, 2));
  
  // Clean up all shop-specific data (idempotent - safe to run multiple times)
  // This is the same cleanup as app/uninstalled, but this webhook is specifically
  // for GDPR compliance and is sent 48 hours after uninstall
  const cleanupShopData = async (shop) => {
    await db.store.deleteMany({ where: { shop } });
    await db.storeSubmission.deleteMany({ where: { shop } });
    await db.savedView.deleteMany({ where: { shop } });
    await db.storeAnalyticsEvent.deleteMany({ where: { shop } });
    await db.storeAnalyticsAggregate.deleteMany({ where: { shop } });
  };
  
  await cleanupShopData(shop);
  console.log(`GDPR compliance: Cleaned up all data for shop: ${shop}`);
  
  return new Response(null, { status: 200 });
};

