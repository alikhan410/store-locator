export function getBoundingBox(lat, lng, radiusKm) {
  // Convert radius to degrees
  // 1 degree of latitude = ~111 km
  // 1 degree of longitude = ~111 km * cos(latitude)
  const deltaLat = radiusKm / 111;
  const deltaLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  // Clamp longitude to valid range (-180 to 180)
  let minLng = lng - deltaLng;
  let maxLng = lng + deltaLng;
  
  // Handle longitude wraparound at 180/-180 boundary
  if (minLng < -180) minLng = -180;
  if (maxLng > 180) maxLng = 180;

  return {
    minLat: Math.max(lat - deltaLat, -90), // Clamp to valid latitude range
    maxLat: Math.min(lat + deltaLat, 90),
    minLng,
    maxLng,
  };
}

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
