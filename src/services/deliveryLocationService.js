import api from "./api";

export class DeliveryLocationService {
  static async setDeliveryLocation(
    latitude,
    longitude,
    locationName,
    nickname = null,
    prevLocationId = null
  ) {
    try {
      console.log("📡 Making POST request to set delivery location:", {
        latitude,
        longitude,
        locationName,
        nickname,
        prevLocationId,
        url: "/delivery-location/deliverTo",
      });

      const params = {
        latitude,
        longitude,
        locationName,
      };

      if (nickname) {
        params.nickname = nickname;
      }

      if (prevLocationId) {
        params.prevLocationId = prevLocationId;
      }

      const response = await api.post("/delivery-location/deliverTo", null, {
        params,
      });

      console.log("✅ Delivery location set successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error setting delivery location:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      // Extract backend error message for better user feedback
      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (typeof error.response?.data === "string" ? error.response.data : null);
      const enhancedError = new Error(
        backendMessage || `Server error (${error.response?.status || "unknown"}): Failed to set delivery location`
      );
      enhancedError.originalError = error;
      enhancedError.status = error.response?.status;
      throw enhancedError;
    }
  }

  static async getDeliveryLocation() {
    try {
      console.log("📡 Making GET request to get delivery location");

      const response = await api.get("/delivery-location/deliveryLocation");

      console.log("✅ Delivery location retrieved:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error getting delivery location:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (typeof error.response?.data === "string" ? error.response.data : null);
      const enhancedError = new Error(
        backendMessage || `Server error (${error.response?.status || "unknown"}): Failed to get delivery location`
      );
      enhancedError.originalError = error;
      enhancedError.status = error.response?.status;
      throw enhancedError;
    }
  }

  static async getAllDeliveryLocations() {
    try {
      console.log("📡 Making GET request to get all delivery locations");

      const response = await api.get(
        "/delivery-location/all-delivery-locations"
      );

      console.log("✅ All delivery locations retrieved:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error getting all delivery locations:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  static async deleteDeliveryLocation(id) {
    try {
      console.log("📡 Making DELETE request to delete delivery location:", id);

      const response = await api.delete(
        `/delivery-location/deliveryLocation/${id}`
      );

      console.log("✅ Delivery location deleted successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("❌ Error deleting delivery location:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }
}
