
import axios from "axios";
import { toast } from "react-toastify";
import { handleApiError } from "./errorHandler";

const API_BASE_URL = "http://localhost:8080/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      "Making API request:",
      config.method?.toUpperCase(),
      config.url,
      config.params
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration and global error handling
api.interceptors.response.use(
  (response) => {
    console.log(
      "API response:",
      response.config.url,
      response.status,
      response.data
    );

    // Show backend messages for all non-GET requests and mutation GET requests
    const method = response.config.method?.toUpperCase();
    const url = response.config.url;
    const isAdminPanel =
      window.location.pathname.includes("/admin") ||
      window.location.pathname.includes("/delivery");

    // Check if this is a mutation request (non-GET or GET requests that modify data)
    const isMutationRequest =
      method !== "GET" ||
      url.includes("/change-role") ||
      url.includes("/update-status") ||
      url.includes("/activate") ||
      url.includes("/deactivate");

    // Skip cart operations since they have their own feedback
    const isCartOperation = url.includes("/cart/");

    if (isMutationRequest) {
      // Log detailed response info for admin/delivery panels
      if (isAdminPanel) {
        console.log(`📋 ${method} Response Details:`, {
          url: url,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          timestamp: new Date().toISOString(),
        });
      }

      // Show backend message to user if available
      const responseData = response.data;

      // Check if it's actually a success based on backend statusCode
      // If no statusCode is provided, assume success for 200 responses
      const isSuccess = responseData?.statusCode
        ? responseData.statusCode >= 200 && responseData.statusCode < 300
        : response.status >= 200 && response.status < 300;

      console.log(`🔍 Interceptor Debug:`, {
        url: url,
        method: method,
        responseStatus: response.status,
        backendStatusCode: responseData?.statusCode,
        isSuccess: isSuccess,
        message: responseData?.message,
        fullResponseData: responseData,
      });

      // Handle messages (both success and error) - skip cart operations
      if (responseData?.message && !isCartOperation) {
        // Dismiss any existing toasts before showing new one
        toast.dismiss();

        if (isSuccess) {
          console.log(
            "🎯 Showing backend success toast:",
            responseData.message
          );
          toast.success(responseData.message);
        } else {
          // Show error with backend statusCode
          const statusTitle = responseData.statusCode
            ? `Error ${responseData.statusCode}`
            : "Error";
          console.log("🎯 Showing backend error toast:", responseData.message);
          toast.error(`${statusTitle}: ${responseData.message}`);
        }
      } else if (isSuccess && isMutationRequest && !isCartOperation) {
        // Dismiss any existing toasts before showing new one
        toast.dismiss();

        // If it's a successful mutation but no message provided, show a generic success message
        let genericMessage = "Operation completed successfully";

        // Generate more specific messages based on the URL
        if (url.includes("/change-role")) {
          genericMessage = "User role updated successfully";
        } else if (url.includes("/update-status")) {
          genericMessage = "Order status updated successfully";
        } else if (url.includes("/activate") || url.includes("/deactivate")) {
          genericMessage = "Account status updated successfully";
        }

        console.log("🎯 Showing success toast:", genericMessage);
        toast.success(genericMessage);
      }
    }

    return response;
  },
  (error) => {
    console.error(
      "API error:",
      error.config?.url,
      error.response?.status,
      error.response?.data
    );

    // Log detailed error info for mutation requests in admin/delivery panels
    const method = error.config?.method?.toUpperCase();
    const url = error.config?.url;
    const isAdminPanel =
      window.location.pathname.includes("/admin") ||
      window.location.pathname.includes("/delivery");

    // Check if this is a mutation request (non-GET or GET requests that modify data)
    const isMutationRequest =
      method !== "GET" ||
      url.includes("/change-role") ||
      url.includes("/update-status") ||
      url.includes("/activate") ||
      url.includes("/deactivate");

    // Skip cart operations since they have their own feedback
    const isCartOperation = url.includes("/cart/");

    if (isMutationRequest && !isCartOperation) {
      if (isAdminPanel) {
        console.log(`❌ ${method} Error Details:`, {
          url: url,
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
          data: error.response?.data,
          message: error.response?.data?.message,
          statusCode: error.response?.data?.statusCode,
          timestamp: new Date().toISOString(),
        });
      }

      // Show backend error message to user (this will be handled by the global error handler)
      // The error will be passed to handleApiError which already shows backend messages
    }

    // Handle 401 errors (token expiration)
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Handle 500 errors - don't show in toasts, let components handle them
    if (error.response?.status === 500) {
      console.error(
        "Server error (500) - not showing toast, component should handle:",
        error
      );
      return Promise.reject(error);
    }

    // Handle all other errors with global error handler
    handleApiError(error);

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register-customer", userData),
  createBranchManager: (userData) =>
    api.post("/auth/register-branch-manager", userData),
  registerManager: (userData) => api.post("/auth/register-manager", userData),
};

// User API
export const userAPI = {
  getAllUsers: (role = "CUSTOMER", searchString = "", options = {}) => {
    const params = new URLSearchParams({ role });
    if (searchString) {
      params.append("searchString", searchString);
    }
    if (options.page !== undefined && options.page !== null) {
      params.append("page", options.page);
    }
    if (options.size !== undefined && options.size !== null) {
      params.append("size", options.size);
    }
    if (options.sortBy) {
      params.append("sortBy", options.sortBy);
    }
    if (options.sortDirection) {
      params.append("sortDirection", options.sortDirection);
    }
    return api.get(`/users/all?${params.toString()}`);
  },
  changeRole: (id, changeTo) =>
    api.get(`/users/change-role?id=${id}&changeTo=${changeTo}`),
  deactivateAccount: (id) => api.delete(`/users/deactivate-any?id=${id}`),
  deactivateBranchManager: (id) => api.delete(`/users/deactivate-branch-managers?id=${id}`),
  restoreBranchManager: (id) => api.post(`/users/restore-branch-managers?id=${id}`),
  restoreUsers: (id) => api.post(`/users/restore-users?id=${id}`),
  updateOwnAccount: (userData) => {
    const formData = new FormData();
    Object.keys(userData).forEach((key) => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    });
    return api.put("/users/update", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deactivateOwnAccount: () => api.delete("/users/deactivate-my-account"),
  getOwnAccountDetails: () => api.get("/users/account"),
  changePassword: (passwordData) => api.patch("/users/change-password", passwordData),
};

// Category API
export const categoryAPI = {
  getAllCategories: () => api.get("/restaurant-categories"),
  getCategoryById: (id) => api.get(`/restaurant-categories/${id}`),
  addCategory: (formData) => api.post("/restaurant-categories", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  updateCategory: (formData) => api.put("/restaurant-categories", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  deleteCategory: (id) => api.delete(`/restaurant-categories/${id}`),
};

// Restaurant API
export const restaurantsAPI = {
  getAvailableRestaurants: (params = {}) => {
    // Clean up empty values and undefined
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
      ) {
        cleanParams[key] = params[key];
      }
    });
    return api.get("/restaurants/available-restaurants", {
      params: cleanParams,
    });
  },
  getAvailableRestaurantsDashboard: (params = {}) => {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        cleanParams[key] = params[key];
      }
    });
    return api.get("/restaurants/available-restaurants-dashboard", {
      params: cleanParams,
    });
  },
  searchByRestaurant: (restaurantId) =>
    api.get(`/restaurants/search-by-restaurant/${restaurantId}`),
  getRestaurantCategories: () => api.get("/restaurant-categories"),
  createRestaurant: (formData) => api.post("/restaurants", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  getAllRestaurantsAdmin: (deleted = false, options = {}) => {
    const params = { deleted };
    if (options.page !== undefined && options.page !== null) {
      params.page = options.page;
    }
    if (options.size !== undefined && options.size !== null) {
      params.size = options.size;
    }
    if (options.sortBy) {
      params.sortBy = options.sortBy;
    }
    if (options.sortDirection) {
      params.sortDirection = options.sortDirection;
    }
    return api.get("/restaurants/all-restaurants-admin", { params });
  },
  deleteRestaurant: (restaurantId) => api.delete(`/restaurants/admin/delete-restaurant/${restaurantId}`),
  unassignRestaurant: (restaurantId) => api.put(`/restaurants/admin/unassign-restaurant/${restaurantId}`),
  restoreRestaurant: (restaurantId) => api.put(`/restaurants/admin/restore/${restaurantId}`),
};
// Guest API - now uses main api instance to send token if present so stale tokens can be caught
export const guestAPI = {
  getAvailableRestaurants: (lat, lng, params = {}) => {
    const cleanParams = { lat, lng };
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
      ) {
        cleanParams[key] = params[key];
      }
    });
    return api.get("/restaurants/available-restaurants", {
      params: cleanParams,
    });
  },
  getAvailableRestaurantsDashboard: (lat, lng, params = {}) => {
    const cleanParams = { lat, lng };
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
        cleanParams[key] = params[key];
      }
    });
    return api.get("/restaurants/available-restaurants-dashboard", {
      params: cleanParams,
    });
  },
  searchByRestaurant: (restaurantId) =>
    api.get(`/restaurants/search-by-restaurant/${restaurantId}`),
  getBranchDetails: (branchId) =>
    api.get(`/restaurant-branch/${branchId}`),
  getBranchMenu: (branchId, searchString) =>
    api.get(`/restaurant-branch/${branchId}/menu`, {
      params: searchString ? { searchString } : undefined,
    }),
  getRestaurantCategories: () => api.get("/restaurant-categories"),
  getBranchReviews: (branchId) => api.get(`/reviews/${branchId}`),
};

export const restaurantBranchAPI = {
  getBranchDetails: (branchId) => api.get(`/restaurant-branch/${branchId}`),
  getMyBranchDetails: () => api.get("/restaurant-branch/myBranch"),
  toggleBranchStatus: () => api.put("/restaurant-branch/change-opening-status"),
  updateOpeningHours: (data) => api.put("/restaurant-branch/myBranch/opening-hours", data),
  updateMyBranch: (data) => api.put("/restaurant-branch/edit-branch/my-branch", data),
  getBranchMenu: (branchId, searchString) =>
    api.get(`/restaurant-branch/${branchId}/menu`, {
      params: searchString ? { searchString } : undefined,
    }),
  updateBranch: (id, data) => api.put(`/restaurant-branch/edit-branch/${id}`, data),
  createBranch: (data) => api.post("/restaurant-branch/branch", data),
  getBranchLocation: (orderId) => api.get(`/restaurant-branch/location/${orderId}`),
};
export const restaurantReviewAPI = {
  getBranchReviews: (branchId) => api.get(`/reviews/${branchId}`),
};

// Menu API
export const menuAPI = {
  getMenus: (params = {}) => api.get("/menu", { params }),
  getMenuById: (id) => api.get(`/menu/${id}`),
  createMenu: (formData) => {
    return api.post("/menu", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  updateMenu: (formData) => {
    return api.put("/menu", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteMenu: (id) => api.delete(`/menu/${id}`),
  getMenuOptions: (menuId) => {
    console.warn("getMenuOptions is deprecated. Use getManagerMenuOptions or getCustomerMenuOptions instead.");
    return api.get("/menu/options", { params: { menuId } });
  },
  // New Customer Endpoint: /api/menu/options-customer/{menuId}/{branchId}
  getCustomerMenuOptions: (menuId, branchId) => api.get(`/menu/options-customer/${menuId}/${branchId}`),

  // New Manager Endpoint: /api/menu/options-restaurant?menuId={menuId}
  getManagerMenuOptions: (menuId) => api.get("/menu/options-restaurant", { params: { menuId } }),

  // Update Branch Option Config
  updateBranchOptionConfig: (optionId, updates) => api.put(`/menu/option-branch`, updates, { params: { optionId } }),

  addMenuOption: (menuId, optionData) => api.post(`/menu/option`, optionData, { params: { menuId } }),
  unlinkOptionFromMenu: (menuId, optionId) => api.put("/menu/unlink", null, { params: { menuId, optionId } }),
  deleteOption: (optionId) => api.delete("/menu/options", { params: { optionId } }),
  editMenuOption: (optionDTO) => api.put("/menu/option", optionDTO),
  getAvailableOptions: (menuId) => api.get("/menu/available-options", { params: { menuId } }),
  linkOptionToMenu: (menuId, optionId) => api.put("/menu/link", null, { params: { menuId, optionId } }),
};

// Cart API
export const cartAPI = {
  getShoppingCart: (branchId) => api.get(`/cart/basket/${branchId}`),
  addToCart: (payload) => api.post("/cart/basket", payload),
  // incrementItem and decrementItem send cartItemId in the request body
  incrementItem: (cartItemId) =>
    api.post(`/cart/basket/increment/${cartItemId}`),
  decrementItem: (cartItemId) =>
    api.post(`/cart/basket/decrement/${cartItemId}`),
  // removeItem uses cartItemId as a path parameter
  removeItem: (cartItemId) => api.delete(`/cart/basket/remove/${cartItemId}`),
  // clearCart uses branchId as a path parameter
  clearCart: (branchId) => api.delete(`/cart/basket/clear/${branchId}`),
  orderAgain: (orderId) => api.put(`/cart/orderAgain/${orderId}`),
};

// Checkout API
export const checkoutAPI = {
  getCheckoutPreview: (branchId) => api.get(`/checkout/${branchId}`),
  incrementItem: (cartItemId) => api.post(`/checkout/increment/${cartItemId}`),
  decrementItem: (cartItemId) => api.post(`/checkout/decrement/${cartItemId}`),
  updateTip: (cartId, amount) =>
    api.put(`/checkout/tip/${cartId}`, { amount }),
  updateDeliveryNote: (cartId, note) =>
    api.put(`/checkout/delivery-note/${cartId}`, { note }),
  updatePaymentMethod: (paymentMethodId, branchId) =>
    api.put(`/checkout/payment-method`, { paymentMethodId, branchId }),
};
// Order API
export const orderAPI = {
  getOrderDetails: (orderId) => api.get(`/orders/order-details/${orderId}`),
  checkout: (branchId) => api.post(`/orders/checkout/${branchId}`),
  getMyOrders: (params = {}) => api.get("/orders/me", { params }),
  // Refund a specific order via backend API
  refundOrder: (orderId) => api.post(`/payment/ask-for-refund/${orderId}`),
  getOrderById: (id) => api.get(`/orders/get-by-id/${id}`),
  getOrderItemById: (orderItemId) =>
    api.get(`/orders/order-item/${orderItemId}`),
  getAllOrders: (params = {}) => {
    // Map searchId to orderId parameter for the API and clean up empty values
    const apiParams = {};

    // Only include non-empty values
    // orderStatus supports both a single string and an array (repeated query params)
    if (params.orderStatus) {
      if (Array.isArray(params.orderStatus) && params.orderStatus.length > 0) {
        apiParams.orderStatus = params.orderStatus;
      } else if (typeof params.orderStatus === "string" && params.orderStatus !== "") {
        apiParams.orderStatus = params.orderStatus;
      }
    }
    // paymentStatus supports both a single string and an array (repeated query params)
    if (params.paymentStatus) {
      if (Array.isArray(params.paymentStatus) && params.paymentStatus.length > 0) {
        apiParams.paymentStatus = params.paymentStatus;
      } else if (typeof params.paymentStatus === "string" && params.paymentStatus !== "") {
        apiParams.paymentStatus = [params.paymentStatus];
      }
    }
    if (params.searchId && params.searchId !== "") {
      // Only include orderId if the value is a valid positive integer
      const parsedId = parseInt(params.searchId, 10);
      if (!isNaN(parsedId) && parsedId > 0 && String(parsedId) === params.searchId.trim()) {
        apiParams.orderId = parsedId;
      }
    }
    if (params.customerId && params.customerId !== "") {
      apiParams.customerId = parseInt(params.customerId);
    }
    if (params.deliveryId && params.deliveryId !== "") {
      apiParams.deliveryId = parseInt(params.deliveryId);
    }
    if (params.isIncomplete !== undefined && params.isIncomplete !== null) {
      apiParams.isIncomplete = params.isIncomplete;
    }
    if (params.page !== undefined && params.page !== null) {
      apiParams.page = params.page;
    }
    if (params.size !== undefined && params.size !== null) {
      apiParams.size = params.size;
    }
    if (params.sortBy && params.sortBy !== "") {
      apiParams.sortBy = params.sortBy;
    }
    if (params.sortDirection && params.sortDirection !== "") {
      apiParams.sortDirection = params.sortDirection;
    }

    console.log("API call - getAllOrders with params:", apiParams);
    console.log(
      "Full URL will be:",
      `/orders/all?${new URLSearchParams(apiParams).toString()}`
    );
    return api.get("/orders/all", {
      params: apiParams,
      paramsSerializer: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v));
          } else {
            searchParams.append(key, value);
          }
        });
        return searchParams.toString();
      },
    });
  },
  getNewOrders: (params = {}) =>
    api.get("/orders/all", {
      params: {
        ...params,
        // Filter for orders that are not delivered and payment not completed
        excludeDelivered: true,
        excludeCompletedPayment: true,
      },
    }),
  getReadyForPickupOrders: (params = {}) =>
    api.get("/orders/unassigned-orders", { params }),
  updateOrderStatus: (orderData) => api.put("/orders/update-status", orderData),
  assignOrderDelivery: (orderId) => api.put(`/orders/assign-order-delivery/${orderId}`),
  countUniqueCustomers: (restaurantId) =>
    api.get("/orders/unique-customers", { params: { restaurantId } }),

  // Dashboard statistics
  getTotalOrders: () => api.get("/orders/stats/total-orders"),
  getTotalRevenue: () => api.get("/orders/stats/total-revenue"),
  getMonthlyRevenue: (year) => {
    console.log("API call - getMonthlyRevenue with year:", year);
    return api.get("/orders/stats/monthly-revenue", { params: { year } });
  },
  getDailyRevenueForMonth: (year, month) =>
    api.get("/orders/stats/daily-revenue-for-month", {
      params: { year, month },
    }),
  getOrderStatusDistribution: () =>
    api.get("/orders/stats/status-distribution"),
  getMostPopularItems: (limit = 5) =>
    api.get("/orders/stats/most-popular-items", {
      params: { limit },
    }),

  // Delivery-specific methods (these endpoints will need to be implemented in the backend)
  getDeliveryStats: (deliveryId) =>
    api.get(`/orders/delivery/stats/${deliveryId}`),
  getDeliveryOrders: (deliveryId, params = {}) => {
    const apiParams = {
      deliveryId,
      ...params,
    };
    return api.get("/orders/orders", { params: apiParams });
  },
};

// Review API
export const reviewAPI = {
  getReviewsForMenu: (menuId) => api.get("/reviews", { params: { menuId } }),
  createReview: (reviewData) => api.post("/reviews", reviewData),
  getAverageRating: (menuId) => api.get(`/reviews/menu-item/${menuId}`),
};

// Role API
export const roleAPI = {
  getAllRoles: () => api.get("/roles"),
  createRole: (roleData) => api.post("/roles", roleData),
  updateRole: (roleData) => api.put("/roles", roleData),
  deleteRole: (id) => api.delete(`/roles/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getManagerDashboard: () => api.get("/dashboard/manager"),
  getMostOrderedProduct: () => api.get("/dashboard/mostOrderedProduct"),
  getTotalOrders: () => api.get("/dashboard/manager/successful-orders"),
  getTotalRevenue: () => api.get("/dashboard/manager/total-revenue"),
};

// Analytics API
export const analyticsAPI = {
  getUniqueCustomerMetrics: (targetBranchId, targetRestaurantId) => {
    const params = {};
    if (targetBranchId) params.targetBranchId = targetBranchId;
    if (targetRestaurantId) params.targetRestaurantId = targetRestaurantId;
    return api.get("/analytics/unique-customer-metrics", { params });
  },
  getMostPopularItems: (limit = 5, targetBranchId, targetRestaurantId) => {
    const params = { limit };
    if (targetBranchId) params.targetBranchId = targetBranchId;
    if (targetRestaurantId) params.targetRestaurantId = targetRestaurantId;
    return api.get("/analytics/popular-items", { params });
  },
  getMonthlyRevenue: (year, targetBranchId, targetRestaurantId) => {
    const params = { year };
    if (targetBranchId) params.targetBranchId = targetBranchId;
    if (targetRestaurantId) params.targetRestaurantId = targetRestaurantId;
    return api.get("/analytics/revenue/monthly", { params });
  },
  getDailyRevenue: (year, month, targetBranchId, targetRestaurantId) => {
    const params = { year, month };
    if (targetBranchId) params.targetBranchId = targetBranchId;
    if (targetRestaurantId) params.targetRestaurantId = targetRestaurantId;
    return api.get("/analytics/revenue/daily", { params });
  },
  getSuccessfulOrders: (targetBranchId, targetRestaurantId) => {
    const params = {};
    if (targetBranchId) params.targetBranchId = targetBranchId;
    if (targetRestaurantId) params.targetRestaurantId = targetRestaurantId;
    return api.get("/analytics/successful-orders", { params });
  },
  getDeliveryRevenue: () => api.get("/analytics/underPrepare/delivery"),
  getDeliveryEarnings: (year, deliveryId) => {
    const params = { year };
    if (deliveryId) params.deliveryId = deliveryId;
    return api.get("/analytics/earnings", { params });
  },
};

// Manager Category API
export const managerCategoryAPI = {
  getManagerCategories: () => api.get("/categories/manager"),
  createCategory: (data) => api.post("/categories", data),
  updateCategory: (data) => api.put("/categories", data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
  restoreCategory: (id) => api.put(`/categories/${id}/restore`),
};

// Manager Restaurant API
export const managerRestaurantAPI = {
  getManagerRestaurant: () => api.get("/restaurants/restaurant"),
  getManagerBranches: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.includeDeleted !== undefined) params.append("includeDeleted", filters.includeDeleted);
    if (filters.hasManager !== undefined && filters.hasManager !== "all") params.append("hasManager", filters.hasManager);
    return api.get("/restaurants/manager/restaurant-branches", { params });
  },
  getBranchManagers: (params = {}) => {
    const cleanParams = {};
    if (params.id) cleanParams.id = params.id;
    if (params.name) cleanParams.name = params.name;
    if (params.branchName) cleanParams.branchName = params.branchName;
    if (params.isAssigned !== undefined && params.isAssigned !== null) cleanParams.isAssigned = params.isAssigned;

    return api.get("/users/branch_managers", { params: cleanParams });
  },
  changeBranchManager: (branchId, userId) => api.put(`/restaurants/manager/change-manager/${branchId}`, userId),
  deleteBranch: (branchId) => api.delete(`/restaurants/manager/delete-branch/${branchId}`),
  restoreBranch: (branchId) => api.put(`/restaurants/manager/restore-branch/${branchId}`),
  updateRestaurantCategories: (categoryIds) => api.put("/restaurant-categories/categories", categoryIds),
};

// Branch Manager API
export const branchManagerAPI = {
  getMenus: (params = {}) => api.get("/branch-manager/menu", { params }),
  getRestaurantMenus: () => api.get("/branch-manager/menu/restaurant"),
  createBranchMenu: (formData) => {
    return api.post("/branch-manager/menu", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  updateBranchMenu: (formData) => {
    return api.put("/branch-manager/menu", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  updateBranchPaymentMethods: (paymentMethodIds) =>
    api.put("/payment/my-branch/update-methods", { paymentMethodIds }),
  // Branch Manager Menu Options
  getBranchMenuOptions: (branchMenuId) => api.get("/menu/options-branch-manager", { params: { branchMenuId } }),
  updateBranchOptionConfig: (optionId, updates) => api.put("/menu/option-branch", updates, { params: { optionId } }),
};

// Payment API
export const paymentAPI = {
  getAllPaymentMethods: () => api.get("/payment"),
  getBranchPaymentMethods: () => api.get("/payment/restaurant-branch"),
  updatePaymentMethod: (id, name) => api.put(`/payment/${id}`, { name }),
  checkPaymentSuccessful: (orderId) => api.get("/payment/check-payment-successful", { params: { transactionId: orderId } }),
  getOrderPayments: (orderId) => api.get("/payment/all", { params: { orderId } }),
  refundPayment: (paymentId, reason) =>
    api.post(`/payment/refund/${paymentId}`, reason, {
      headers: { "Content-Type": "text/plain" },
    }),
  getAllPayments: (params = {}) => {
    const apiParams = {};
    if (params.paymentStatus) {
      if (Array.isArray(params.paymentStatus) && params.paymentStatus.length > 0) {
        apiParams.paymentStatus = params.paymentStatus;
      } else if (typeof params.paymentStatus === "string" && params.paymentStatus !== "") {
        apiParams.paymentStatus = [params.paymentStatus];
      }
    }
    if (params.orderId && params.orderId !== "") {
      const parsed = parseInt(params.orderId, 10);
      if (!isNaN(parsed) && parsed > 0) apiParams.orderId = parsed;
    }
    if (params.paymentId && params.paymentId !== "") {
      const parsed = parseInt(params.paymentId, 10);
      if (!isNaN(parsed) && parsed > 0) apiParams.paymentId = parsed;
    }
    if (params.transactionId && params.transactionId !== "") apiParams.transactionId = params.transactionId;
    if (params.customerId && params.customerId !== "") apiParams.customerId = parseInt(params.customerId);
    if (params.restaurantId && params.restaurantId !== "") apiParams.restaurantId = parseInt(params.restaurantId);
    if (params.branchId && params.branchId !== "") apiParams.branchId = parseInt(params.branchId);
    if (params.deliveryId && params.deliveryId !== "") apiParams.deliveryId = parseInt(params.deliveryId);
    if (params.page !== undefined) apiParams.page = params.page;
    if (params.size !== undefined) apiParams.size = params.size;
    if (params.sortBy && params.sortBy !== "") apiParams.sortBy = params.sortBy;
    if (params.sortDirection && params.sortDirection !== "") apiParams.sortDirection = params.sortDirection;
    return api.get("/payment/all", {
      params: apiParams,
      paramsSerializer: (p) => {
        const s = new URLSearchParams();
        Object.entries(p).forEach(([key, value]) => {
          if (Array.isArray(value)) value.forEach((v) => s.append(key, v));
          else s.append(key, value);
        });
        return s.toString();
      },
    });
  },
};

export default api;
