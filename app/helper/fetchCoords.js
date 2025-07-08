export async function generateCoords(address, state, city, zip) {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  console.log("API Key is:", apiKey);
  if (!apiKey) {
    throw new Error("Google Maps API key not found in environment variables.");
  }

  const fullAddress = `${address}, ${city}, ${state}, ${zip}`;
  const encodedAddress = encodeURIComponent(fullAddress);

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK" || !data.results.length) {
    console.error("Geocoding failed:", data);
    return { latitude: null, longitude: null };
  }

  const location = data.results[0].geometry.location;

  return {
    latitude: location.lat,
    longitude: location.lng,
  };
}
