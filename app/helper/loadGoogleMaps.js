let loader = null;
let isLoading = false;
let loadPromise = null;

export async function loadGoogleMaps(apiKey) {
  // If already loading, return the existing promise
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // If already loaded, return immediately
  if (loader && window.google && window.google.maps) {
    return Promise.resolve();
  }

  try {
    isLoading = true;
    
    const pkg = await import("@googlemaps/js-api-loader");
    const { Loader } = pkg;
    
    loader = new Loader({
      apiKey,
      libraries: ["places", "visualization"], // Added visualization library for heatmaps
      version: "beta", // Use beta channel for Data-Driven Styling features
    });

    loadPromise = loader.load();
    const result = await loadPromise;
    
    isLoading = false;
    return result;
  } catch (error) {
    isLoading = false;
    loadPromise = null;
    throw new Error(`Failed to load Google Maps: ${error.message}`);
  }
}
