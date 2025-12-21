import prisma from "../db.server";
import { getBoundingBox, haversineDistance } from "../helper/geoUtils";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  console.log("proxy is running");
  
  // Authenticate the app proxy request
  try {
    await authenticate.public.appProxy(request);
  } catch (authError) {
    return new Response("Authentication failed", { status: 401 });
  }
  
  try {
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get("lat") || "0");
    const lng = parseFloat(url.searchParams.get("lng") || "0");
    const radiusKm = parseFloat(url.searchParams.get("radius") || "50");
    const shop = url.searchParams.get("shop");
    console.log("shop is: ", shop);
    console.log("radius is: ", radiusKm, " km");

    // If no shop parameter, return error
    if (!shop) {
      console.error("No shop parameter provided");
      return new Response("Shop parameter required", { status: 400 });
    }
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      console.error("Invalid coordinates:", lat, lng);
      return new Response("Invalid coordinates", { status: 400 });
    }
    
    // Limit maximum radius to prevent performance issues
    const maxRadiusKm = 5000; // ~3100 miles
    if (radiusKm > maxRadiusKm) {
      console.error("Radius too large:", radiusKm, "km");
      return new Response(`Maximum radius is ${maxRadiusKm} km`, { status: 400 });
    }

    let nearbyCandidates;

    if (radiusKm >= 20) {
      const paddingFactor = 1.1;
      const { minLat, maxLat, minLng, maxLng } = getBoundingBox(
        lat,
        lng,
        radiusKm * paddingFactor,
      );

      nearbyCandidates = await prisma.store.findMany({
        where: {
          shop: shop,
          lat: { not: null, gte: minLat, lte: maxLat },
          lng: { not: null, gte: minLng, lte: maxLng },
        },
      });
    } else {
      nearbyCandidates = await prisma.store.findMany({
        where: {
          shop: shop,
          lat: { not: null },
          lng: { not: null },
        },
      });
    }

    console.log("Found", nearbyCandidates.length, "candidate stores");
    console.log("Search center:", lat, lng);
    console.log("Radius:", radiusKm, "km");

    // Apply precise Haversine filtering
    const stores = nearbyCandidates
      .map((store) => {
        const distance = haversineDistance(lat, lng, store.lat, store.lng);
        return { ...store, distance };
      })
      .filter((store) => store.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .map((store) => ({
        ...store,
        distance: store.distance.toFixed(2),
      }));

    console.log("Final stores after filtering:", stores.length);
    console.log("Stores:", stores.map(s => ({ name: s.name, city: s.city, state: s.state, distance: s.distance })));

    return { 
      stores
    };
  } catch (error) {
    console.error("Failed to load stores", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
