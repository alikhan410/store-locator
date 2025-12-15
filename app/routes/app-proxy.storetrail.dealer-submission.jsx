import { db } from "../db.server.js";
import { stateOptions } from "../helper/options.js";
import { authenticate } from "../shopify.server.js";

export const loader = async ({ request }) => {
  // Authenticate the app proxy request (validates it's from Shopify)
  await authenticate.public.appProxy(request);
  return { stateOptions };
};

export const action = async ({ request }) => {
  console.log("Dealer submission action called:", request.method, request.url);
  
  // Authenticate the app proxy request (validates it's from Shopify)
  await authenticate.public.appProxy(request);
  
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid method" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let data;
  try {
    data = await request.json();
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const {
    storeName,
    contactName,
    contactEmail,
    contactPhone,
    address,
    city,
    state,
    zip,
    storeType,
    description,
    tags,
    website,
    shop,
  } = data;

  if (
    !storeName ||
    !contactName ||
    !contactEmail ||
    !address ||
    !city ||
    !state ||
    !zip
  ) {
    return new Response(
      JSON.stringify({ success: false, error: "Please fill in all required fields." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Create submission in database
    const submission = await db.storeSubmission.create({
      data: {
        storeName,
        contactName,
        contactEmail,
        contactPhone,
        address,
        city,
        state,
        zip,
        storeType,
        description,
        tags,
        website,
        shop: shop || "public",
        status: "pending",
      },
    });

    return new Response(
      JSON.stringify({ success: true, submissionId: submission.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Submission error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to submit store information. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export default null;
