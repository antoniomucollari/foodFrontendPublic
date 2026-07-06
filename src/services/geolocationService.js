// Geolocation service for getting user's current location
export class GeolocationService {
  static async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported by this browser");
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      console.log("Requesting user location...");

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("✅ Location obtained successfully:", position);
          console.log("📍 Coordinates:", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });

          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.error("❌ Location error:", error);

          let errorMessage = "Unable to get your location";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user";
              console.error("🚫 Permission denied by user");
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable";
              console.error("📍 Position unavailable");
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              console.error("⏰ Location request timed out");
              break;
            default:
              errorMessage =
                "An unknown error occurred while retrieving location";
              console.error("❓ Unknown location error");
              break;
          }

          reject(new Error(errorMessage));
        },
        options
      );
    });
  }

  static async getLocationName(lat, lon) {
    try {
      console.log("🔄 Getting location name from Google Geocoder:", {
        lat,
        lon,
      });

      if (
        !(typeof window !== "undefined" && window.google && window.google.maps)
      ) {
        throw new Error("Google Maps API not loaded");
      }

      const geocoder = new window.google.maps.Geocoder();

      return await new Promise((resolve, reject) => {
        geocoder.geocode(
          { location: { lat: Number(lat), lng: Number(lon) } },
          (results, status) => {
            if (status !== "OK" || !results || results.length === 0) {
              reject(new Error("No location found for these coordinates"));
              return;
            }

            const best = results[0];
            const locationName = best.formatted_address || "Unknown Location";
            const shortAddress =
              best.address_components?.find((c) =>
                c.types.includes("point_of_interest")
              )?.long_name ||
              best.address_components?.find((c) =>
                c.types.includes("establishment")
              )?.long_name ||
              best.address_components?.find((c) => c.types.includes("locality"))
                ?.long_name ||
              locationName.split(",")[0];

            resolve({
              address: locationName,
              shortAddress: shortAddress,
              components: {
                address_components: best.address_components,
                place_id: best.place_id,
              },
            });
          }
        );
      });
    } catch (error) {
      console.error("❌ Error getting location from Google Geocoder:", error);
      throw new Error("Failed to get address from coordinates");
    }
  }

  static async getLocationWithAddress() {
    try {
      console.log("🚀 Starting location with address process...");

      const location = await this.getCurrentLocation();
      console.log("📍 Got location, now getting address from Google...");

      const address = await this.getLocationName(
        location.latitude,
        location.longitude
      );

      console.log("✅ Complete location data:", {
        ...location,
        ...address,
      });

      return {
        ...location,
        ...address,
      };
    } catch (error) {
      console.error("❌ Error in getLocationWithAddress:", error);
      throw error;
    }
  }
}
