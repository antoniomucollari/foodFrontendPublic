import { toast } from "react-toastify";

// Global error handler for API responses
export const handleApiError = (error) => {

  // Check if it's an API error with response
  if (error.response) {
    const { status, data, config } = error.response;
    const statusCode = data?.statusCode || status;
    // Check both message and error fields, as some endpoints return { error: "..." }
    const message = data?.message || data?.error || "An error occurred";
    const url = config?.url || "";

    // Skip error handling for cart-related 404 errors (new users don't have carts yet)
    if (statusCode === 404 && url.includes("/cart/items")) {
      console.log("Cart not found - skipping error display for new users");
      return;
    }

    // Dismiss any existing toasts before showing error
    toast.dismiss();

    // Handle different status codes
    if (statusCode >= 400 && statusCode < 500) {
      // Client errors (400-499)
      if (statusCode === 400) {
        toast.error(message);
      } else if (statusCode === 401) {
        toast.error("Unauthorized. Please log in again.");
      } else if (statusCode === 403) {

        // Debug log to see what we're receiving
        console.log("403 Error Debug:", { code: data?.code, message, data });

        // Check for Password Change Required
        if (
          data?.code === "PASSWORD_CHANGE_REQUIRED" ||
          message === "Password change required." ||
          message.includes("Password change required")
        ) {
          if (window.location.pathname !== "/change-password") {
            window.location.href = "/change-password";
          }
          return;
        }

        // Check for Account Deactivated
        if (
          message === "User account is deactivated." ||
          message.includes("User account is deactivated")
        ) {
          if (window.location.pathname !== "/account-deactivated") {
            window.location.href = "/account-deactivated";
          }
          return;
        }

        if (message !== "This Manager user is not linked to any Restaurant!") {
          toast.error("You do not have permission to perform this action.");
        }
      } else if (statusCode === 404) {
        toast.error("The requested resource was not found.");
      } else if (statusCode === 409) {
        toast.warning(message);
      } else if (statusCode === 422) {
        toast.error(message);
      } else {
        toast.error(message);
      }
    } else if (statusCode >= 500) {
      // Server errors (500+) - don't show in toasts, components should handle these
      console.error("Server error (500+) - not showing toast, component should handle:", {
        status: statusCode,
        message: message,
        url: url
      });
    } else {
      // Other errors
      toast.error(message);
    }
  } else if (error.request) {
    // Dismiss any existing toasts before showing network error
    toast.dismiss();
    // Network error
    toast.error("Network error. Please check your connection.");
  } else {
    // Dismiss any existing toasts before showing other error
    toast.dismiss();
    // Other errors
    toast.error(error.message || "An unexpected error occurred.");
  }
};

