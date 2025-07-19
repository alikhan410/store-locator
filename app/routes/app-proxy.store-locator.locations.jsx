import prisma from "../db.server";
import { getBoundingBox, haversineDistance } from "../helper/geoUtils";

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get("lat") || "0");
    const lng = parseFloat(url.searchParams.get("lng") || "0");
    const radiusKm = parseFloat(url.searchParams.get("radius") || "50");
    const shop = url.searchParams.get("shop");
    console.log("radius is: ", radiusKm, " km");

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

    return { stores };
  } catch (error) {
    console.error("Failed to load stores", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
