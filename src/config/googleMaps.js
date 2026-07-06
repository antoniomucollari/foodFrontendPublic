// Google Maps configuration
export const GOOGLE_MAPS_CONFIG = {
  // Replace with your actual Google Maps API key
  // Get one from: https://console.cloud.google.com/google/maps-apis
  API_KEY:
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY",

  // API endpoints
  PLACES_API_BASE: "https://maps.googleapis.com/maps/api/place",

  // Default options
  DEFAULT_OPTIONS: {
    componentRestrictions: { country: "us" }, // Restrict to US addresses
    types: ["address"], // Only show addresses
  },
};

// Helper function to check if Google Maps is loaded
export const isGoogleMapsLoaded = () => {
  return (
    typeof window !== "undefined" &&
    window.google &&
    window.google.maps &&
    window.google.maps.places
  );
};

// Helper function to wait for Google Maps to load
export const waitForGoogleMaps = (timeout = 10000) => {
  return new Promise((resolve, reject) => {
    if (isGoogleMapsLoaded()) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isGoogleMapsLoaded()) {
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error("Google Maps API failed to load within timeout"));
      }
    }, 100);
  });
};




