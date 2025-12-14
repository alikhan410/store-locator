import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
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

  // Build search conditions
  let searchConditions = [];
  if (query) {
    const searchTerms = normalizedQuery
      .split(/\s+/)
      .filter((term) => term.length > 0);

    // Simple AND search: all terms must match
    searchConditions.push({
      AND: searchTerms.map((term) => ({
        OR: [
          { name: { contains: term } },
          { address: { contains: term } },
          { city: { contains: term } },
          { state: { contains: term } },
        ],
      })),
    });
  }

  const stores = await prisma.store.findMany({
    where: {
      AND: [
        { shop: session.shop }, // GDPR compliance: only show stores for current shop
        ...searchConditions,
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
