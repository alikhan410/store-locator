// export const loader = async ({ request }) => {
//   const prisma = (await import("../db.server")).default;

//   const url = new URL(request.url);
//   const query = url.searchParams.get("query") || "";
//   const state = url.searchParams.get("state")?.split(",").filter(Boolean) || [];
//   const city = url.searchParams.get("city") || "";
//   const hasCoordinates = url.searchParams.get("hasCoordinates") === "true";
//   const hasPhone = url.searchParams.get("hasPhone") === "true";
//   const hasLink = url.searchParams.get("hasLink") === "true";

//   // Build Prisma where filter
//   const where = {
//     AND: [
//       query
//         ? {
//             OR: [
//               { name: { contains: query, mode: "insensitive" } },
//               { address: { contains: query, mode: "insensitive" } },
//               { city: { contains: query, mode: "insensitive" } },
//               { state: { contains: query, mode: "insensitive" } },
//             ],
//           }
//         : undefined,
//       state.length > 0 ? { state: { in: state } } : undefined,
//       city ? { city: { contains: city, mode: "insensitive" } } : undefined,
//       hasCoordinates
//         ? {
//             AND: [
//               { lat: { not: null } },
//               { lng: { not: null } },
//               { lat: { not: "" } },
//               { lng: { not: "" } },
//             ],
//           }
//         : undefined,
// hasPhone ? { phone: { not: null, notIn: [""] } } : undefined,
// hasLink ? { link: { not: null, notIn: [""] } } : undefined,
//     ].filter(Boolean), // remove undefined filters
//   };

//   const stores = await prisma.store.findMany({ where });

//   return { stores };
// };

export const loader = async ({ request }) => {
  const prisma = (await import("../db.server")).default;

  const url = new URL(request.url);
  const query = url.searchParams.get("query") || "";
  const state = url.searchParams.get("state")?.split(",").filter(Boolean) || [];
  const city = url.searchParams.get("city") || "";
  const hasCoordinates = url.searchParams.get("hasCoordinates") === "true";
  const hasPhone = url.searchParams.get("hasPhone") === "true";
  const hasLink = url.searchParams.get("hasLink") === "true";

  // Normalize user input to lowercase (assumes DB data is also lowercase)
  const normalizedQuery = query.toLowerCase();
  const normalizedCity = city.toLowerCase();

  const stores = await prisma.store.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { name: { contains: normalizedQuery } },
                { address: { contains: normalizedQuery } },
                { city: { contains: normalizedQuery } },
                { state: { contains: normalizedQuery } },
              ],
            }
          : undefined,
        state.length > 0 ? { state: { in: state } } : undefined,
        city ? { city: { contains: normalizedCity } } : undefined,
        hasCoordinates
          ? {
              lat: { not: null },
              lng: { not: null },
            }
          : undefined,
        hasPhone ? { phone: { not: null, notIn: [""] } } : undefined,
        hasLink ? { link: { not: null, notIn: [""] } } : undefined,
      ].filter(Boolean),
    },
  });

  return { stores };
};
