import prisma from "../db.server";

// const isValidStore = (store) => {
//   const requiredFields = ["name", "link", "address", "city", "state", "zip"];

//   for (const field of requiredFields) {
//     if (typeof store[field] !== "string" || store[field].trim() === "") {
//       return false;
//     }
//   }

//   if (store.address2 && typeof store.address2 !== "string") return false;
//   if (store.phone && typeof store.phone !== "string") return false;

//   if (
//     store.lat !== undefined &&
//     store.lat !== null &&
//     isNaN(parseFloat(store.lat))
//   )
//     return false;

//   if (
//     store.lng !== undefined &&
//     store.lng !== null &&
//     isNaN(parseFloat(store.lng))
//   )
//     return false;

//   if (store.country && typeof store.country !== "string") return false;

//   return true;
// };

// export const action = async ({ request }) => {
//   try {
//     const body = await request.json();
//     const { stores } = body;

//     if (!Array.isArray(stores)) {
//       return Response.json({ error: "Invalid stores format" }, { status: 400 });
//     }

//     const sanitizedStores = [];

//     for (const store of stores) {
//       if (!isValidStore(store)) {
//         return Response.json(
//           { error: "Some store entries are invalid." },
//           { status: 400 },
//         );
//       }

//       sanitizedStores.push({
//         name: store.name.trim(),
//         link: store.link.trim(),
//         address: store.address.trim(),
//         address2: store.address2?.trim() || null,
//         city: store.city.trim(),
//         state: store.state.trim(),
//         zip: store.zip.trim(),
//         country: store.country?.trim() || "United States",
//         phone: store.phone?.trim() || null,
//         lat:
//           store.lat !== undefined && store.lat !== null
//             ? parseFloat(store.lat)
//             : null,
//         lng:
//           store.lng !== undefined && store.lng !== null
//             ? parseFloat(store.lng)
//             : null,
//       });
//     }

//     await prisma.store.createMany({
//       data: sanitizedStores,
//       // skipDuplicates: true,
//     });

//     return Response.json({ success: true, count: sanitizedStores.length });
//   } catch (error) {
//     console.error("Failed to import stores:", error);
//     return Response.json({ error: "Failed to import stores" }, { status: 500 });
//   }
// };

const isValidStore = (store) => {
  const requiredFields = ["name", "link", "address", "city", "state", "zip"];
  const errors = [];

  for (const field of requiredFields) {
    if (typeof store[field] !== "string" || store[field].trim() === "") {
      errors.push(`${field} is required`);
    }
  }

  if (store.address2 && typeof store.address2 !== "string") {
    errors.push("address2 must be a string");
  }

  if (store.phone && typeof store.phone !== "string") {
    errors.push("phone must be a string");
  }

  if (
    store.lat !== undefined &&
    store.lat !== null &&
    isNaN(parseFloat(store.lat))
  ) {
    errors.push("lat must be a valid number");
  }

  if (
    store.lng !== undefined &&
    store.lng !== null &&
    isNaN(parseFloat(store.lng))
  ) {
    errors.push("lng must be a valid number");
  }

  if (store.country && typeof store.country !== "string") {
    errors.push("country must be a string");
  }

  return errors;
};

export const action = async ({ request }) => {
  try {
    const body = await request.json();
    const { stores } = body;

    if (!Array.isArray(stores)) {
      return Response.json({ error: "Invalid stores format" }, { status: 400 });
    }

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
          name: store.name.trim(),
          link: store.link.trim(),
          address: store.address.trim(),
          address2: store.address2?.trim() || null,
          city: store.city.trim(),
          state: store.state.trim(),
          zip: store.zip.trim(),
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

    if (sanitizedStores.length > 0) {
      await prisma.store.createMany({
        data: sanitizedStores,
        // skipDuplicates: true,
      });
    }

    return Response.json({
      success: true,
      imported: sanitizedStores.length,
      skipped: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      partial: errors.length > 0,
    });
  } catch (error) {
    console.error("Failed to import stores:", error);
    return Response.json({ error: "Failed to import stores" }, { status: 500 });
  }
};
