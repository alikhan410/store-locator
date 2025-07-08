export function setupAutocomplete(inputEl, suggestionBox, setCoordsCallback) {
  let photonTimeout = null;

  inputEl.addEventListener("input", () => {
    const query = inputEl.value.trim();
    if (!query || query.length < 3) {
      suggestionBox.innerHTML = "";
      return;
    }

    clearTimeout(photonTimeout);
    photonTimeout = setTimeout(() => {
      fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
      )
        .then((res) => res.json())
        .then((data) => {
          suggestionBox.innerHTML = "";
          data.features.forEach((feature) => {
            const item = document.createElement("div");
            item.className = "suggestion-item";
            item.textContent =
              feature.properties.name +
              (feature.properties.city ? `, ${feature.properties.city}` : "");
            item.addEventListener("click", () => {
              inputEl.value = item.textContent;
              suggestionBox.innerHTML = "";

              setCoordsCallback({
                lat: feature.geometry.coordinates[1],
                lng: feature.geometry.coordinates[0],
              });
            });
            suggestionBox.appendChild(item);
          });
        });
    }, 300);
  });
}
