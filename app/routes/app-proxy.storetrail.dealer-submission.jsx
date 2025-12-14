import { db } from "../db.server.js";
import { stateOptions } from "../helper/options.js";

export const loader = async ({ request }) => {
  return { stateOptions };
};

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return { success: false, error: "Invalid method" };
  }

  try {
    const data = await request.json();
  } catch (error) {
    return { success: false, error: "Invalid JSON" };
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
    return { success: false, error: "Please fill in all required fields." };
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

    // Send notification to Klaviyo (reuse logic)
    try {
      const { sendKlaviyoNotification } = await import(
        "./app.dealer-submission.jsx"
      );
      await sendKlaviyoNotification(submission, data.shop || "public");
    } catch (klaviyoError) {
      console.error("Failed to send Klaviyo notification:", klaviyoError);
    }

    return { success: true, submissionId: submission.id };
  } catch (error) {
    console.error("Submission error:", error);
    return {
      success: false,
      error: "Failed to submit store information. Please try again.",
    };
  }
};

export default null;
