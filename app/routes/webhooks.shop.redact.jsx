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
 * 
 * IMPORTANT: authenticate.webhook() reads the raw request body for HMAC verification.
 * Do NOT read request.json() or request.text() before calling authenticate.webhook(),
 * as this will consume the body stream and HMAC verification will fail.
 */
export const action = async ({ request }) => {
  // authenticate.webhook() validates HMAC and throws Response with 401 if invalid
  // Must be called FIRST before any body parsing - it needs the raw body stream
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
  
  // Return 200 OK quickly (Shopify requires response within 5 seconds)
  // Using new Response() without status defaults to 200, matching working webhooks
  return new Response();
};

