import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI, userAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUserDetails = async () => {
    try {
      const userResponse = await userAPI.getOwnAccountDetails();
      const userDetails = userResponse.data.data;

      const userData = {
        id: userDetails.id,
        email: userDetails.email,
        name: userDetails.name,
        phoneNumber: userDetails.phoneNumber,
        address: userDetails.address,
        profileUrl: userDetails.profileUrl,
        isActive: userDetails.active,
        roles: userDetails.roles || [],
        restaurantId: userDetails.restaurantId || null,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      console.error("Error refreshing user details:", error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Refresh user details to get the latest information
        try {
          await refreshUserDetails();
        } catch (error) {
          console.error("Error refreshing user details on load:", error);
          // Keep the stored user data if refresh fails
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, roles } = response.data.data;

      // Store token first
      localStorage.setItem("token", token);
      setToken(token);

      // Fetch user details to get the name and other info
      try {
        const userResponse = await userAPI.getOwnAccountDetails();
        const userDetails = userResponse.data.data;

        const userData = {
          id: userDetails.id,
          email: userDetails.email,
          name: userDetails.name,
          phoneNumber: userDetails.phoneNumber,
          address: userDetails.address,
          profileUrl: userDetails.profileUrl,
          isActive: userDetails.active,
          roles: userDetails.roles || roles,
          restaurantId: userDetails.restaurantId || null,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      } catch (userError) {
        // Fallback if user details fetch fails
        const userData = {
          email: credentials.email,
          name: credentials.email.split("@")[0],
          roles: roles,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const hasRole = (role) => {
    return user?.roles?.some((roleObj) => roleObj.name === role);
  };

  const isAdmin = () => {
    return hasRole("ADMIN");
  };

  const isCustomer = () => {
    return hasRole("CUSTOMER");
  };

  const isDelivery = () => {
    return hasRole("DELIVERY");
  };

  const isManager = () => {
    return hasRole("MANAGER");
  };

  const isBranchManager = () => {
    return hasRole("BRANCH_MANAGER");
  };

  const updateUserProfile = async (updatedData) => {
    try {
      const response = await userAPI.updateOwnAccount(updatedData);
      // Refresh user details after update
      await refreshUserDetails();
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const deactivateAccount = async () => {
    try {
      const response = await userAPI.deactivateOwnAccount();
      logout();
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole,
    isAdmin,
    isCustomer,
    isDelivery,
    isManager,
    isBranchManager,
    loading,
    refreshUserDetails,
    updateUserProfile,
    deactivateAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
