import prisma from "../db.server.js";
import { stateOptions } from "../helper/options.js";
import { authenticate } from "../shopify.server.js";

export const loader = async ({ request }) => {
  // Authenticate the app proxy request (validates it's from Shopify)
  await authenticate.public.appProxy(request);
  return { stateOptions };
};

export const action = async ({ request }) => {
  try {
    // Authenticate the app proxy request (validates it's from Shopify)
    await authenticate.public.appProxy(request);
  } catch (authError) {
    return new Response(
      JSON.stringify({ success: false, error: "Authentication failed" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid method" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Get shop from URL (app proxy includes shop in authenticated URL)
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return new Response(
      JSON.stringify({ success: false, error: "Shop parameter missing" }),
      {
        status: 400,
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
    storeType,
    contactName,
    contactEmail,
    contactPhone,
    address,
    address2,
    city,
    state,
    zip,
    country,
    website,
    notes,
  } = data;

  if (
    !storeName ||
    !storeType ||
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
    const submission = await prisma.storeSubmission.create({
      data: {
        storeName,
        storeType,
        contactName,
        contactEmail,
        contactPhone,
        address,
        address2: address2 || null,
        city,
        state,
        zip,
        country: country || "United States",
        website: website || null,
        notes: notes || null,
        shop,
        status: "PENDING",
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
