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
  console.log("Customer data request payload:", JSON.stringify(payload, null, 2));
  
  // This app doesn't collect customer data - only merchant store location data
  // We acknowledge the request but have no customer data to provide
  // The store owner will receive an empty response or can be notified that
  // this app doesn't store customer data
  
  // If you need to provide customer data in the future, you would:
  // 1. Query your database for customer data matching the request
  // 2. Format it according to Shopify's requirements
  // 3. Send it to the store owner via email or API
  
  // Return 200 OK quickly (Shopify requires response within 5 seconds)
  // Using new Response() without status defaults to 200, matching working webhooks
  return new Response();
};

