import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    // Clean up session data
    await db.session.deleteMany({ where: { shop } });
    
    // GDPR compliance: Clean up all shop-specific data
    await db.store.deleteMany({ where: { shop } });
    await db.storeSubmission.deleteMany({ where: { shop } });
    await db.savedView.deleteMany({ where: { shop } });
    await db.storeAnalyticsEvent.deleteMany({ where: { shop } });
    await db.storeAnalyticsAggregate.deleteMany({ where: { shop } });
    
    console.log(`Cleaned up all data for shop: ${shop}`);
  } else {
    // Even if session is already deleted, clean up any remaining shop data
    // This handles cases where webhook fires multiple times
    await db.store.deleteMany({ where: { shop } });
    await db.storeSubmission.deleteMany({ where: { shop } });
    await db.savedView.deleteMany({ where: { shop } });
    await db.storeAnalyticsEvent.deleteMany({ where: { shop } });
    await db.storeAnalyticsAggregate.deleteMany({ where: { shop } });
    
    console.log(`Cleaned up remaining data for shop: ${shop} (session already deleted)`);
  }

  return new Response();
};
