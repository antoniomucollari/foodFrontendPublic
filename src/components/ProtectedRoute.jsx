import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireDelivery = false,
  requireManager = false,
  requireBranchManager = false,
  restrictAdmin = false,
  requireAuth = false,
  requireLocation = false,
}) => {
  const { isAuthenticated, isAdmin, isDelivery, isManager, isBranchManager, isCustomer, loading } =
    useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If route requires authentication and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // If user is NOT authenticated and we don't require a specific role,
  // allow them through for guest-accessible routes (discovery, restaurant-branch)
  if (
    !isAuthenticated() &&
    !requireAdmin &&
    !requireDelivery &&
    !requireManager &&
    !requireBranchManager &&
    !requireAuth
  ) {
    // For requireLocation, just check localStorage for guest location
    if (requireLocation) {
      const hasLocation = localStorage.getItem("userLocation");
      if (!hasLocation) {
        return <Navigate to="/" replace />;
      }
    }
    return children;
  }

  // If user is authenticated and admin, and trying to access non-admin routes, redirect to admin dashboard
  // This applies to ALL routes except admin, delivery, login, and register
  if (
    isAuthenticated() &&
    isAdmin() &&
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/delivery") &&
    !location.pathname.startsWith("/login") &&
    !location.pathname.startsWith("/register")
  ) {
    return <Navigate to="/admin" replace />;
  }

  // If user is authenticated and delivery, and trying to access non-delivery routes, redirect to delivery dashboard
  // This applies to ALL routes except delivery-panel, login, and register
  if (
    isAuthenticated() &&
    isDelivery() &&
    !location.pathname.startsWith("/delivery-panel") &&
    !location.pathname.startsWith("/login") &&
    !location.pathname.startsWith("/register")
  ) {
    return <Navigate to="/delivery-panel" replace />;
  }

  // If user is authenticated and manager
  if (
    isAuthenticated() &&
    isManager() &&
    !location.pathname.startsWith("/login") &&
    !location.pathname.startsWith("/register")
  ) {
    // If manager has no restaurant, force them to create-restaurant page
    // BUT allow them to stay on create-restaurant page
    if (!useAuth().user?.restaurantId) {
      if (!location.pathname.startsWith("/create-restaurant")) {
        return <Navigate to="/create-restaurant" replace />;
      }
    } else {
      // If manager HAS restaurant, block them from create-restaurant page
      if (location.pathname.startsWith("/create-restaurant")) {
        return <Navigate to="/manager/dashboard" replace />;
      }
      // Otherwise enforce manager routes
      if (!location.pathname.startsWith("/manager")) {
        return <Navigate to="/manager" replace />;
      }
    }
  }

  // If user is authenticated and branch manager, and trying to access non-branch-manager routes, redirect to branch manager dashboard
  if (
    isAuthenticated() &&
    isBranchManager() &&
    !location.pathname.startsWith("/branch-manager") &&
    !location.pathname.startsWith("/login") &&
    !location.pathname.startsWith("/register")
  ) {
    return <Navigate to="/branch-manager" replace />;
  }

  // If user is authenticated and is a customer, allow access to customer routes
  // Customer routes include: /, /menu, /menu/:id, /checkout, /orders, /profile
  if (
    isAuthenticated() &&
    isCustomer() &&
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/delivery-panel") &&
    !location.pathname.startsWith("/manager") &&
    !location.pathname.startsWith("/branch-manager") &&
    !location.pathname.startsWith("/login") &&
    !location.pathname.startsWith("/register")
  ) {
    // Allow access to customer routes
    return children;
  }

  // If route requires admin and user is not admin, redirect to home
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  // If route requires delivery and user is not delivery, redirect to home
  if (requireDelivery && !isDelivery()) {
    return <Navigate to="/" replace />;
  }

  // If route requires manager and user is not manager, redirect to home
  if (requireManager && !isManager()) {
    return <Navigate to="/" replace />;
  }

  // If route requires branch manager and user is not branch manager, redirect to home
  if (requireBranchManager && !isBranchManager()) {
    return <Navigate to="/" replace />;
  }

  // If route requires location, user must have a location (authenticated or guest)
  if (requireLocation) {
    const hasLocation = localStorage.getItem("userLocation");
    if (!hasLocation) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
