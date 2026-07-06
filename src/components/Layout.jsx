import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import ThemeToggle from "./ThemeToggle";
import LocationSearchModal from "./LocationSearchModal";

import Logo from "./Logo";
import { DeliveryLocationService } from "../services/deliveryLocationService";
import {
  User,
  LogOut,
  Menu as MenuIcon,
  X,
  UserCircle,
  MapPin,
  ChevronDown,
} from "lucide-react";

const Layout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const hideHeader = location.pathname === "/profile";

  // User location state - will be updated from Google Places API
  const [userLocation, setUserLocation] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);


  // Build navigation based on location and authentication
  const navigation = [];

  // Show discovery if user has a delivery location (authenticated or guest)
  if (userLocation) {
    navigation.push({ name: "Discovery", href: "/discovery" });

    if (isAuthenticated()) {
      navigation.push({ name: "Orders", href: "/orders" });
    }
  }

  // Admin users will access dashboard directly via URL
  // if (isAdmin()) {
  //   navigation.push({ name: 'Admin', href: '/admin', icon: Settings });
  // }

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const handleLocationSelect = (locationData) => {
    // Use nickname if available, otherwise use shortAddress
    setUserLocation(locationData.nickname || locationData.shortAddress);
    // Store the full location data in localStorage for future use
    localStorage.setItem("userLocation", JSON.stringify(locationData));
    // Trigger a full page refresh to update all components with the new location
    window.location.reload();
  };

  // Load current delivery location on component mount
  useEffect(() => {
    const loadCurrentLocation = async () => {
      try {
        if (isAuthenticated()) {
          // Authenticated: fetch from backend
          const response = await DeliveryLocationService.getDeliveryLocation();
          if (response.data) {
            const displayName =
              response.data.nickname || response.data.locationName;
            setUserLocation(displayName);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to load current delivery location:", error);
      }

      // Fallback to localStorage (for both authenticated and guest users)
      const storedLocation = localStorage.getItem("userLocation");
      if (storedLocation) {
        try {
          const locationData = JSON.parse(storedLocation);
          setUserLocation(locationData.nickname || locationData.shortAddress || locationData.address || "Location set");
        } catch {
          setUserLocation(null);
        }
      } else {
        setUserLocation(null);
      }
    };

    loadCurrentLocation();

    // Listen for location changes from other components
    const handleLocationChange = (event) => {
      const { nickname, locationName } = event.detail;
      setUserLocation(nickname || locationName);
    };

    window.addEventListener("deliveryLocationChanged", handleLocationChange);

    return () => {
      window.removeEventListener(
        "deliveryLocationChanged",
        handleLocationChange
      );
    };
  }, [isAuthenticated]);

  const handleLocationClick = () => {
    setIsLocationModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      {!hideHeader && <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        location.pathname === "/"
          ? "bg-transparent border-transparent"
          : "bg-card/95 backdrop-blur-sm shadow-sm border-b border-border"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Logo />
            </div>

            {/* Deliver to Section - For all users with a location */}
            {userLocation && (
              <div className="hidden md:flex items-center space-x-2 flex-2 justify-center">
                <button
                  onClick={handleLocationClick}
                  className="flex items-center space-x-2 px-4 py-2 bg-accent/50 rounded-lg border border-border/50 hover:bg-accent/70 transition-colors cursor-pointer group"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-foreground">
                      Deliver to
                    </span>
                    <div className="relative max-w-[120px] overflow-hidden">
                      <span
                        className={`text-sm whitespace-nowrap ${userLocation
                            ? "text-muted-foreground"
                            : "text-red-500 font-medium"
                          }`}
                      >
                        {userLocation || "No location set"}
                      </span>
                      <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-accent/50 to-transparent pointer-events-none"></div>
                    </div>
                  </div>
                  <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>
            )}

            {/* Desktop Navigation */}
            <nav className="hidden md:flex">
              <div className="inline-flex items-center rounded-full bg-muted p-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              </div>
            </nav>

            {/* User Menu */}
            {location.pathname !== "/" && (
              <div className="hidden md:flex items-center space-x-6">
                {isAuthenticated() ? (
                  <div className="flex items-center space-x-4">
                    {/* Profile Icon */}
                    <Link
                      to="/profile"
                      className="flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors text-foreground hover:text-primary hover:bg-accent"
                      title="Profile"
                    >
                      <UserCircle className="h-4 w-4" />
                    </Link>
                    <Button variant="link" size="sm" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" asChild>
                      <Link to="/login">Login</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/register">Register</Link>
                    </Button>
                  </div>
                )}
                {/* Theme Toggle with spacing */}
                <div className="ml-4">
                  <ThemeToggle />
                </div>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card border-t border-border">
              {/* Mobile Deliver to Section - For all users with a location */}
              {userLocation && (
                <button
                  onClick={() => {
                    handleLocationClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-3 mb-2 bg-accent/30 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-1">
                        Deliver to
                      </div>
                      <div className="relative">
                        <span
                          className={`text-sm truncate block ${userLocation
                              ? "text-foreground"
                              : "text-red-500 font-medium"
                            }`}
                        >
                          {userLocation || "No location set"}
                        </span>
                        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-accent/30 to-transparent pointer-events-none"></div>
                      </div>
                    </div>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </div>
                </button>
              )}

              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:text-primary hover:bg-accent"
                      }`}
                  >
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {isAuthenticated() ? (
                <div className="pt-4 border-t border-border">
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Welcome, {user?.name || user?.email}
                  </div>
                  {/* Profile Link */}
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors text-foreground hover:text-primary hover:bg-accent"
                  >
                    <UserCircle className="h-5 w-5" />
                    <span>Profile</span>
                  </Link>
                  {/* Cart removed from navigation */}
                  <Button
                    variant="outline"
                    className="w-full justify-start mt-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex justify-center mb-2">
                    <ThemeToggle />
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                  </Button>
                  <Button className="w-full" asChild>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>}

      {/* Main Content */}
      <main
        className={
          location.pathname === "/"
            ? "flex-1 w-full"
            : hideHeader
            ? "flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            : location.pathname.startsWith("/restaurant-branch/") || location.pathname.includes("/checkout")
            ? "flex-1 w-full pt-16"
            : "flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24"
        }
      >
        <Outlet />
      </main>

      {/* Location Search Modal */}
      <LocationSearchModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSelect={handleLocationSelect}
      />


    </div>
  );
};

export default Layout;
