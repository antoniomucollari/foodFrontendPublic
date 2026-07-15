// Google Maps configuration
export const GOOGLE_MAPS_CONFIG = {
  // Pulls your key securely from Vercel/Vite environment variables
  API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,

  // API endpoints
  PLACES_API_BASE: "https://maps.googleapis.com/maps/api/place",

  // Default options
  DEFAULT_OPTIONS: {
    // Restrict autocomplete suggestions exclusively to Albania ('al')
    componentRestrictions: { country: "al" },
    types: ["address"],
  },

  // Highly Recommended: Default fallback coordinates for Albania (e.g., Tirana)
  DEFAULT_CENTER: {
    lat: 41.3275, // Tirana latitude
    lng: 19.8187  // Tirana longitude
  },
  DEFAULT_ZOOM: 13,
};

// Helper function to check if Google Maps is loaded
export const isGoogleMapsLoaded = () => {
  return (
      typeof window !== "undefined" &&
      typeof window.google !== "undefined" &&
      typeof window.google.maps !== "undefined" &&
      typeof window.google.maps.places !== "undefined"
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