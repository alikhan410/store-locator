import { googleMapsFallback } from "../helper/googleMapsFallback";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");

  if (!address) {
    return { error: "Missing address" };
  }

  const apiKey = process.env.GEOCODING_API_KEY;

  try {
    // Check if Google Maps is available
    const isAvailable = await googleMapsFallback.checkAvailability(apiKey);
    
    if (isAvailable && apiKey) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address,
        )}&key=${apiKey}`,
        { timeout: 10000 }
      );

      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { 
          lat: location.lat, 
          lng: location.lng,
          source: 'google'
        };
      }
    }

    // Use fallback geocoding
    console.log("Using fallback geocoding for:", address);
    const fallbackResult = await googleMapsFallback.geocodeFallback(
      address.split(',')[0] || address, // Extract street address
      address.split(',')[1]?.trim() || '', // City
      address.split(',')[2]?.trim() || '', // State
      address.split(',')[3]?.trim() || ''  // ZIP
    );

    if (fallbackResult.latitude && fallbackResult.longitude) {
      return {
        lat: fallbackResult.latitude,
        lng: fallbackResult.longitude,
        source: 'fallback'
      };
    }

    return { error: "Geocoding failed", status: "NO_RESULTS" };
  } catch (error) {
    console.error("Geocoding error:", error);
    return { error: "Geocoding service unavailable", status: "ERROR" };
  }
};
