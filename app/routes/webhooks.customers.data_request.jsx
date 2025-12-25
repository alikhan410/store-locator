import { authenticate } from "../shopify.server";

/**
 * Mandatory compliance webhook: customers/data_request
 * 
 * When a customer requests their data from a store owner, Shopify sends this webhook
 * to all apps installed on that store. The app must provide the requested customer data
 * to the store owner.
 * 
 * Since this app doesn't collect customer data (only store location data for merchants),
 * we acknowledge the request but have no customer data to return.
 */
export const action = async ({ request }) => {
  // authenticate.webhook() will throw a Response with 401 status if HMAC is invalid
  // Let it propagate - Remix will handle it correctly
  const { shop, topic, payload } = await authenticate.webhook(request);
  
  console.log(`Received ${topic} webhook for ${shop}`);
  console.log("Customer data request payload:", JSON.stringify(payload, null, 2));
  
  // This app doesn't collect customer data - only merchant store location data
  // We acknowledge the request but have no customer data to provide
  // The store owner will receive an empty response or can be notified that
  // this app doesn't store customer data
  
  // If you need to provide customer data in the future, you would:
  // 1. Query your database for customer data matching the request
  // 2. Format it according to Shopify's requirements
  // 3. Send it to the store owner via email or API
  
  return new Response(null, { status: 200 });
};

