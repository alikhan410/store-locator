import { authenticate } from "../shopify.server";

// Helper function to build where clause from filters (same as in view-stores)
function buildWhereClause(shop, filters = {}) {
  const conditions = [
    { shop }, // GDPR compliance - always required
  ];

  const { query, hasCoordinates, hasPhone, hasLink, city, stateFilter } = filters;

  // Add search conditions if query is provided
  if (query) {
    const searchTerm = query.trim();
    if (searchTerm) {
      conditions.push({
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { address: { contains: searchTerm, mode: "insensitive" } },
          { city: { contains: searchTerm, mode: "insensitive" } },
          { state: { contains: searchTerm, mode: "insensitive" } },
          { country: { contains: searchTerm, mode: "insensitive" } },
          { phone: { contains: searchTerm, mode: "insensitive" } },
        ],
      });
    }
  }

  // Add hasCoordinates filter
  if (hasCoordinates === "has") {
    conditions.push({
      lat: { not: null },
      lng: { not: null },
    });
  } else if (hasCoordinates === "none") {
    conditions.push({
      OR: [
        { lat: null },
        { lng: null },
      ],
    });
  }

  // Add hasPhone filter
  if (hasPhone === "has") {
    conditions.push({
      phone: { not: null, not: "" },
    });
  } else if (hasPhone === "none") {
    conditions.push({
      OR: [
        { phone: null },
        { phone: "" },
      ],
    });
  }

  // Add hasLink filter
  if (hasLink === "has") {
    conditions.push({
      link: { not: null, not: "" },
    });
  } else if (hasLink === "none") {
    conditions.push({
      OR: [
        { link: null },
        { link: "" },
      ],
    });
  }

  // Add state filter if provided
  if (stateFilter && Array.isArray(stateFilter) && stateFilter.length > 0) {
    conditions.push({
      state: { in: stateFilter },
    });
  }

  // Add city filter if provided
  if (city) {
    conditions.push({
      city: { contains: city, mode: "insensitive" },
    });
  }

  return {
    AND: conditions,
  };
}

export const loader = async ({ request }) => {
  console.log("🔵 Export route hit - URL:", request.url);
  
  // authenticate.admin will throw a Response (redirect) if authentication fails
  // We must not catch it - let it propagate so Remix handles the redirect
  const { session } = await authenticate.admin(request);
  console.log("✅ Authentication successful - Shop:", session.shop);
    
    const prisma = (await import("../db.server")).default;
    
    // Parse URL parameters for filters and pagination
    const url = new URL(request.url);
    const query = url.searchParams.get("query") || "";
    const hasCoordinates = url.searchParams.get("hasCoordinates");
    const hasPhone = url.searchParams.get("hasPhone");
    const hasLink = url.searchParams.get("hasLink");
    const city = url.searchParams.get("city") || "";
    const stateFilterStr = url.searchParams.get("stateFilter");
    const stateFilter = stateFilterStr ? JSON.parse(stateFilterStr) : [];
    
    // Get scope and pagination parameters
    const scope = url.searchParams.get("scope") || "filtered"; // "all", "filtered", "current", or "selected"
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const storeIds = url.searchParams.getAll("storeIds"); // For "selected" scope
    
    console.log("📋 Filters:", { query, hasCoordinates, hasPhone, hasLink, city, stateFilter, scope, page, limit, storeIdsCount: storeIds.length });

    // Build where clause using same logic as view-stores
    const whereClause = buildWhereClause(session.shop, {
      query,
      hasCoordinates,
      hasPhone,
      hasLink,
      city,
      stateFilter,
    });
    
    console.log("🔍 Where clause:", JSON.stringify(whereClause, null, 2));

    // Fetch stores based on scope
    let stores;
    if (scope === "selected") {
      // Export only selected stores by IDs
      if (storeIds.length === 0) {
        return new Response("No stores selected", {
          status: 400,
          headers: { "Content-Type": "text/plain" },
        });
      }
      stores = await prisma.store.findMany({
        where: {
          AND: [
            { shop: session.shop }, // GDPR compliance
            { id: { in: storeIds } }, // Only selected stores
          ],
        },
        orderBy: { name: "asc" },
      });
      console.log(`📦 Found ${stores.length} selected stores`);
    } else if (scope === "current") {
      // Export only current page
      const skip = (page - 1) * limit;
      stores = await prisma.store.findMany({
        where: whereClause,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      });
      console.log(`📦 Found ${stores.length} stores for page ${page} (limit: ${limit})`);
    } else {
      // Export all filtered stores (no pagination) - for "filtered" and "all" scopes
      stores = await prisma.store.findMany({
        where: whereClause,
        orderBy: { name: "asc" },
      });
      console.log(`📦 Found ${stores.length} stores (scope: ${scope})`);
    }

  // Generate CSV content
  const headers = [
    "Name",
    "Address",
    "Address 2",
    "City",
    "State",
    "Zip",
    "Country",
    "Latitude",
    "Longitude",
    "Phone",
    "Link",
  ];

  const csvRows = [
    headers.join(","),
    ...stores.map((store) =>
      [
        store.name,
        store.address,
        store.address2 || "",
        store.city,
        store.state,
        store.zip,
        store.country,
        store.lat || "",
        store.lng || "",
        store.phone || "",
        store.link || "",
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];

    const csvContent = csvRows.join("\n");
    console.log("📄 CSV content length:", csvContent.length, "characters");

    // Generate filename based on filters
    const filterParts = [];
    if (query) filterParts.push(`search-${query.substring(0, 20)}`);
    if (hasCoordinates) filterParts.push(`coords-${hasCoordinates}`);
    if (hasPhone) filterParts.push(`phone-${hasPhone}`);
    if (hasLink) filterParts.push(`link-${hasLink}`);
    if (stateFilter.length > 0) filterParts.push(`${stateFilter.length}-states`);
    if (city) filterParts.push(`city-${city.substring(0, 15)}`);
    
    // Generate filename based on scope and filters
    let filename;
    if (scope === "selected") {
      filename = `selected-stores-${stores.length}.csv`;
    } else if (scope === "current") {
      filename = filterParts.length > 0 
        ? `stores-page-${page}-${filterParts.join("-")}-${stores.length}.csv`
        : `stores-page-${page}-${stores.length}.csv`;
    } else if (scope === "all") {
      filename = `all-stores-${stores.length}.csv`;
    } else {
      filename = filterParts.length > 0 
        ? `stores-${filterParts.join("-")}-${stores.length}.csv`
        : `filtered-stores-${stores.length}.csv`;
    }
    
    console.log("💾 Filename:", filename);
    console.log("✅ Returning CSV response");

  // Return CSV response
  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
};

