import { createMap, updateMapAndList } from "./map.js";
import { setupAutocomplete } from "./autocomplete.js";

document.addEventListener("DOMContentLoaded", () => {
  const mapEl = document.getElementById("store-map");
  const resultsEl = document.getElementById("search-results");
  const locateBtn = document.getElementById("locate-btn");
  const radiusSelect = document.getElementById("radius");
  const locationInput = document.getElementById("user-location");

  const suggestionBox = document.createElement("div");
  suggestionBox.className = "autocomplete-suggestions";
  locationInput.parentNode.appendChild(suggestionBox);

  let selectedCoords = null;
  const map = createMap(mapEl);
  const markers = [];

  function fetchAndUpdate(coords) {
    const radiusKm = parseInt(radiusSelect.value, 10);
    const shopDomain = window.Shopify?.shop?.domain;
    
    if (!shopDomain) {
      console.error('Shop domain not available');
      return;
    }
    
    fetch(`/apps/storetrail/locations?lat=${coords.lat}&lng=${coords.lng}&radius=${radiusKm}&shop=${shopDomain}`)
      .then((res) => res.json())
      .then((data) => {
        updateMapAndList(
          { map, resultsEl, markers },
          coords,
          data.stores,
          radiusKm,
          data.showBranding
        );
      })
      .catch((error) => {
        console.error('Failed to fetch stores:', error);
        resultsEl.innerHTML = '<p>Unable to load store locations. Please try again.</p>';
      });
  }

  locateBtn.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        selectedCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        fetchAndUpdate(selectedCoords);
      },
      () => alert("Location access denied or unavailable."),
    );
  });

  document.querySelector(".search-btn").addEventListener("click", () => {
    if (!selectedCoords) {
      alert("Please select a location from suggestions first.");
      return;
    }
    fetchAndUpdate(selectedCoords);
  });

  setupAutocomplete(locationInput, suggestionBox, (coords) => {
    selectedCoords = coords;
  });
});
