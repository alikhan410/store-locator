import { authenticate } from "../shopify.server";

/**
 * Mandatory compliance webhook: customers/redact
 * 
 * When a store owner requests deletion of customer data on behalf of a customer,
 * Shopify sends this webhook. The app must delete or redact the customer's data.
 * 
 * Since this app doesn't collect customer data (only store location data for merchants),
 * we acknowledge the request but have no customer data to delete.
 */
export const action = async ({ request }) => {
  // authenticate.webhook() will throw a Response with 401 status if HMAC is invalid
  // Let it propagate - Remix will handle it correctly
  const { shop, topic, payload } = await authenticate.webhook(request);
  
  console.log(`Received ${topic} webhook for ${shop}`);
  console.log("Customer redact payload:", JSON.stringify(payload, null, 2));
  
  // This app doesn't collect customer data - only merchant store location data
  // We acknowledge the request but have no customer data to delete
  
  // If you need to delete customer data in the future, you would:
  // 1. Query your database for customer data matching the request
  // 2. Delete or anonymize the data
  // 3. Log the deletion for audit purposes
  
  return new Response(null, { status: 200 });
};

