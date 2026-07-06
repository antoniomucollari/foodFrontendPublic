import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LocationSearchModal from "../components/LocationSearchModal";
import { DeliveryLocationService } from "../services/deliveryLocationService";
import { useAuth } from "../contexts/AuthContext";

const Home = () => {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Check if user already has a location selected
  useEffect(() => {
    const checkExistingLocation = async () => {
      try {
        // Check localStorage first
        const storedLocation = localStorage.getItem("userLocation");

        // If authenticated, check backend
        if (isAuthenticated()) {
          try {
            const response =
              await DeliveryLocationService.getDeliveryLocation();
            if (response.data) {
              setHasLocation(true);
              navigate("/discovery");
              return;
            }
          } catch {
            // No location on backend, check localStorage
            console.log("No backend location, checking localStorage");
          }
        }

        // Check localStorage for non-authenticated users or as fallback
        if (storedLocation) {
          setHasLocation(true);
          navigate("/discovery");
          return;
        }

        setHasLocation(false);
      } catch (error) {
        console.error("Error checking location:", error);
        setHasLocation(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingLocation();
  }, [navigate, isAuthenticated]);

  const handleLocationSelect = (locationData) => {
    // Store the location and navigate to menu
    localStorage.setItem("userLocation", JSON.stringify(locationData));

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("deliveryLocationChanged", {
        detail: {
          nickname: locationData.nickname,
          locationName: locationData.address,
          latitude: locationData.coordinates?.lat,
          longitude: locationData.coordinates?.lng,
        },
      })
    );

    navigate("/discovery");
  };

  // Show loading state while checking for location
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user has location, they'll be redirected, but show nothing while redirecting
  if (hasLocation) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with banner background and centered search input */}
      <section
        className="relative min-h-screen flex flex-col justify-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/banner.png')",
        }}
      >
        {/* dark overlay for readability */}
        <div className="absolute inset-0 bg-black/40" aria-hidden="true"></div>

        {/* Main Content: centered and contained */}
        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-20 w-full max-w-7xl mx-auto">
          <div className="w-full max-w-2xl flex flex-col items-start space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Order delivery near you
            </h1>
            <p className="text-white/90">Fresh, hot meals delivered to your door</p>

            {/* Input group horizontal row */}
            <div className="w-full flex flex-col sm:flex-row gap-3">
              <input
                onClick={() => setIsLocationModalOpen(true)}
                placeholder="Enter delivery address"
                readOnly
                className="flex-1 bg-white text-black cursor-pointer rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-offset-0"
              />
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md px-8 py-3 shadow transition-colors whitespace-nowrap"
              >
                Search here
              </button>
            </div>

            <div className="text-sm text-white/80 mt-2">Or <a href="/login" className="underline hover:text-white transition-colors">Sign In</a></div>
          </div>
        </div>
      </section>

      {/* Location Search Modal */}
      <LocationSearchModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationSelect={handleLocationSelect}
      />
    </div>
  );
};

export default Home;
