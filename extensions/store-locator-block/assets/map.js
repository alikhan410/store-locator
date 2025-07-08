// map.js

export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function createMap(mapEl) {
  const map = L.map(mapEl).setView([37.0902, -95.7129], 4);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  return map;
}

export function updateMapAndList({ map, resultsEl, markers }, userCoords, stores, radiusKm) {
  resultsEl.innerHTML = "";
  markers.forEach(m => map.removeLayer(m));
  markers.length = 0;

  const bounds = [];
  const nearbyStores = stores
    .map(store => {
      const dist = haversineDistance(userCoords.lat, userCoords.lng, store.lat, store.lng);
      return { ...store, distance: dist };
    })
    .filter(store => store.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);

  if (nearbyStores.length === 0) {
    resultsEl.innerHTML = "<p>No stores found within selected radius.</p>";
    return;
  }

  nearbyStores.forEach(store => {
    const marker = L.marker([store.lat, store.lng]).addTo(map);
    marker.bindPopup(`<b>${store.name}</b><br>${store.address}<br>${store.distance.toFixed(2)} km`);
    markers.push(marker);
    bounds.push([store.lat, store.lng]);

    resultsEl.innerHTML += `
      <div class="store-result">
        <strong>${store.name}</strong><br/>
        ${store.address}<br/>
        <small>${store.distance.toFixed(2)} km away</small>
      </div>
    `;
  });

  map.fitBounds(bounds, { padding: [50, 50] });
}
