// import prisma from "../db.server";
// import { getBoundingBox, haversineDistance } from "../helper/geoUtils";

// export const loader = async ({ request }) => {
//   try {
//     const url = new URL(request.url);
//     const lat = parseFloat(url.searchParams.get("lat") || "0");
//     const lng = parseFloat(url.searchParams.get("lng") || "0");
//     const radiusKm = parseFloat(url.searchParams.get("radius") || "50");
//     console.log("radius is: ", radiusKm, " km");

//     const { minLat, maxLat, minLng, maxLng } = getBoundingBox(
//       lat,
//       lng,
//       radiusKm,
//     );

//     // Rough pre-filter using bounding box excluding where lat and lng are null
//     const nearbyCandidates = await prisma.store.findMany({
//       where: {
//         lat: { not: null, gte: minLat, lte: maxLat },
//         lng: { not: null, gte: minLng, lte: maxLng },
//       },
//     });

//     // Precise filter using Haversine
//     const stores = nearbyCandidates
//       .map((store) => {
//         const distance = haversineDistance(lat, lng, store.lat, store.lng);
//         return { ...store, distance };
//       })
//       .filter((store) => store.distance <= radiusKm)
//       .sort((a, b) => a.distance - b.distance)
//       .map((store) => ({ ...store, distance: store.distance.toFixed(2) }));

//     return { stores };
//   } catch (error) {
//     console.error("Failed to load stores", error);
//     return new Response("Internal Server Error", { status: 500 });
//   }
// };
import prisma from "../db.server";
import { getBoundingBox, haversineDistance } from "../helper/geoUtils";

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get("lat") || "0");
    const lng = parseFloat(url.searchParams.get("lng") || "0");
    const radiusKm = parseFloat(url.searchParams.get("radius") || "50");
    console.log("radius is: ", radiusKm, " km");

    let nearbyCandidates;

    if (radiusKm >= 20) {
      // Use bounding box for performance on large radius
      const paddingFactor = 1.1;
      const { minLat, maxLat, minLng, maxLng } = getBoundingBox(
        lat,
        lng,
        radiusKm * paddingFactor,
      );

      nearbyCandidates = await prisma.store.findMany({
        where: {
          lat: { not: null, gte: minLat, lte: maxLat },
          lng: { not: null, gte: minLng, lte: maxLng },
        },
      });
    } else {
      // For small radius, fetch all with lat/lng
      nearbyCandidates = await prisma.store.findMany({
        where: {
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
