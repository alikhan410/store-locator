let loader = null;

export async function loadGoogleMaps(apiKey) {
  if (!loader) {
    const pkg = await import("@googlemaps/js-api-loader");
    const { Loader } = pkg;
    loader = new Loader({
      apiKey,
      libraries: ["places"],
    });
  }

  return loader.load();
}
