import { googleMapsFallback } from './googleMapsFallback.js';

export async function generateCoords(address, state, city, zip) {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  
  if (!apiKey) {
    console.warn("Google Maps API key not found, using fallback geocoding");
    return await googleMapsFallback.geocodeFallback(address, city, state, zip);
  }

  try {
    // Check if Google Maps is available
    const isAvailable = await googleMapsFallback.checkAvailability(apiKey);
    
    if (!isAvailable) {
      console.warn("Google Maps API unavailable, using fallback geocoding");
      return await googleMapsFallback.geocodeFallback(address, city, state, zip);
    }

    const fullAddress = `${address}, ${city}, ${state}, ${zip}`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    const response = await fetch(url, { timeout: 10000 });
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
        source: 'google'
      };
    } else {
      console.warn("Google Maps geocoding failed:", data.status);
      // Try fallback geocoding
      return await googleMapsFallback.geocodeFallback(address, city, state, zip);
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    // Use fallback geocoding
    return await googleMapsFallback.geocodeFallback(address, city, state, zip);
  }
}
