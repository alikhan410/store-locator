export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const address = url.searchParams.get("address");

  if (!address) {
    return { error: "Missing address" };
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address,
    )}&key=${process.env.GEOCODING_API_KEY}`,
  );

  const data = await response.json();

  if (data.status !== "OK") {
    return { error: "Geocoding failed", status: data.status };
  }

  const location = data.results[0].geometry.location;

  return { lat: location.lat, lng: location.lng };
};
