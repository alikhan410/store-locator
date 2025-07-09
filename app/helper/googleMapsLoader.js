// Shared Google Maps script loader with proper async loading and error handling
let googleMapsScriptPromise = null;

export function loadGoogleMapsScript(apiKey) {
  // Return existing promise if already loading
  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  // Return resolved promise if already loaded
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }

  // Check if script is already in DOM
  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existingScript) {
    return new Promise((resolve) => {
      const check = () => {
        if (window.google && window.google.maps) {
          resolve(window.google);
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  // Create new script promise
  googleMapsScriptPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window not available'));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google);
      } else {
        reject(new Error('Google Maps failed to load'));
      }
    };
    
    script.onerror = () => {
      googleMapsScriptPromise = null;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

// Utility to clean up Google Maps instances
export function cleanupGoogleMapsInstances(mapInstance, markerInstance, autocompleteInstance) {
  // Clean up marker
  if (markerInstance) {
    markerInstance.setMap(null);
  }
  
  // Clean up map instance
  if (mapInstance && window.google && window.google.maps) {
    window.google.maps.event.clearInstanceListeners(mapInstance);
  }
  
  // Clean up autocomplete instance
  if (autocompleteInstance && window.google && window.google.maps) {
    window.google.maps.event.clearInstanceListeners(autocompleteInstance);
  }
}

// Utility to check if we're on the client
export function isClient() {
  return typeof window !== 'undefined';
} 