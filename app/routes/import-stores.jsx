import { authenticate } from "../shopify.server";
import { validateImportSize } from "../helper/planLimits";

const isValidStore = (store) => {
  const requiredFields = ["name", "address", "city", "state", "zip"];
  const errors = [];

  // Check required fields
  for (const field of requiredFields) {
    if (typeof store[field] !== "string" || store[field].trim() === "") {
      errors.push(`${field} is required`);
    }
  }

  // Validate optional fields
  if (store.address2 && typeof store.address2 !== "string") {
    errors.push("address2 must be a string");
  }

  if (store.phone && typeof store.phone !== "string") {
    errors.push("phone must be a string");
  }

  // Validate phone number format (basic validation)
  if (store.phone && store.phone.trim() !== "") {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = store.phone.replace(/[\s\-\(\)\.]/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      errors.push("phone must be a valid phone number");
    }
  }

  // Validate ZIP code format (basic US ZIP validation)
  if (store.zip && store.zip.trim() !== "") {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(store.zip.trim())) {
      errors.push("zip must be a valid ZIP code (e.g., 12345 or 12345-6789)");
    }
  }

  // Validate coordinates
  if (store.lat !== undefined && store.lat !== null && store.lat !== "") {
    const lat = parseFloat(store.lat);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push("latitude must be a valid number between -90 and 90");
    }
  }

  if (store.lng !== undefined && store.lng !== null && store.lng !== "") {
    const lng = parseFloat(store.lng);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push("longitude must be a valid number between -180 and 180");
    }
  }

  if (store.country && typeof store.country !== "string") {
    errors.push("country must be a string");
  }

  return errors;
};

// export const action = async ({ request }) => {
//   try {
//     const body = await request.json();
//     const { session } = await authenticate.admin(request);

//     const { stores } = body;

//     if (!Array.isArray(stores)) {
//       return ({ error: "Invalid stores format" }, { status: 400 });
//     }

//     const sanitizedStores = [];
//     const errors = [];

//     stores.forEach((store, index) => {
//       const storeErrors = isValidStore(store);

//       if (storeErrors.length > 0) {
//         errors.push({
//           row: index + 1,
//           errors: storeErrors,
//         });
//       } else {
//         sanitizedStores.push({
//           name: store.name?.trim() || "",
//           shop: session.shop,
//           link: store.link?.trim() || "",
//           address: store.address?.trim() || "",
//           address2: store.address2?.trim() || null,
//           city: store.city?.trim() || "",
//           state: store.state?.trim() || "",
//           zip: store.zip?.trim() || "",
//           country: store.country?.trim() || "United States",
//           phone: store.phone?.trim() || null,
//           lat:
//             store.lat !== undefined && store.lat !== null
//               ? parseFloat(store.lat)
//               : null,
//           lng:
//             store.lng !== undefined && store.lng !== null
//               ? parseFloat(store.lng)
//               : null,
//         });
//       }
//     });

//     if (sanitizedStores.length > 0) {
//       await prisma.store.createMany({
//         data: sanitizedStores,
//         // skipDuplicates: true,
//       });
//     }

//     return {
//       success: true,
//       imported: sanitizedStores.length,
//       skipped: errors.length,
//       errors: errors.length > 0 ? errors : undefined,
//       partial: errors.length > 0,
//     };
//   } catch (error) {
//     console.error("Failed to import stores:", error);
//     return ({ error: "Failed to import stores" }, { status: 500 });
//   }
// };

//Updated action with plan limits -  Need to test
export const action = async ({ request }) => {
  try {
    const body = await request.json();
    const { session, billing } = await authenticate.admin(request);
    const prisma = (await import("../db.server")).default;

    const { stores } = body;

    if (!Array.isArray(stores)) {
      return { error: "Invalid stores format" };
    }

    // Check subscription and plan limits
    const { appSubscriptions } = await billing.check();
    const subscription = appSubscriptions?.[0];

    // Count current stores
    const currentStoreCount = await prisma.store.count({
      where: { shop: session.shop },
    });

    // Validate import size against plan limits
    const importValidation = validateImportSize(subscription, currentStoreCount, stores.length);

    if (importValidation.allowedImport === 0) {
      return {
        success: false,
        error: importValidation.error,
        status: 403,
      };
    }

    // Validate and sanitize stores
    const sanitizedStores = [];
    const errors = [];

    stores.forEach((store, index) => {
      const storeErrors = isValidStore(store);

      if (storeErrors.length > 0) {
        errors.push({
          row: index + 1,
          errors: storeErrors,
        });
      } else {
        sanitizedStores.push({
          name: store.name?.trim() || "",
          shop: session.shop,
          link: store.link?.trim() || "",
          address: store.address?.trim() || "",
          address2: store.address2?.trim() || null,
          city: store.city?.trim() || "",
          state: store.state?.trim() || "",
          zip: store.zip?.trim() || "",
          country: store.country?.trim() || "United States",
          phone: store.phone?.trim() || null,
          lat:
            store.lat !== undefined && store.lat !== null
              ? parseFloat(store.lat)
              : null,
          lng:
            store.lng !== undefined && store.lng !== null
              ? parseFloat(store.lng)
              : null,
        });
      }
    });

    // Enforce max import size
    const allowedToImport = sanitizedStores.slice(0, importValidation.allowedImport);
    const skippedDueToLimit = sanitizedStores.length - allowedToImport.length;

    if (allowedToImport.length > 0) {
      await prisma.store.createMany({
        data: allowedToImport,
      });
    }

    return {
      success: true,
      imported: allowedToImport.length,
      skipped: errors.length + skippedDueToLimit,
      errors:
        errors.length > 0 || skippedDueToLimit > 0
          ? [
              ...errors,
              ...(skippedDueToLimit > 0
                ? [
                    {
                      row: "Limit",
                      errors: [
                        `${skippedDueToLimit} store(s) skipped due to plan limit of ${importValidation.limit}`,
                      ],
                    },
                  ]
                : []),
            ]
          : undefined,
      partial: errors.length > 0 || skippedDueToLimit > 0,
    };
  } catch (error) {
    console.error("Failed to import stores:", error);
    return {
      success: false,
      error: "Failed to import stores",
      status: 500,
    };
  }
};
