import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import {
  MapPin,
  Navigation,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { GeolocationService } from "../services/geolocationService";
import { DeliveryLocationService } from "../services/deliveryLocationService";
import { useAuth } from "../contexts/AuthContext";

const LocationPermissionModal = ({ isOpen, onClose, onLocationSet }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("permission");
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated();

  const handleAllowLocation = async () => {
    console.log("🎯 User clicked 'Allow Location'");
    setIsLoading(true);
    setError("");
    setStep("loading");

    try {
      console.log("🚀 Starting location process...");

      // Get current location with address
      const geoData = await GeolocationService.getLocationWithAddress();
      console.log("✅ Got location data:", geoData);

      console.log("📡 Saving location...");
      if (isGuest) {
        // Guest: save to localStorage only
        const locData = {
          address: geoData.address,
          shortAddress: geoData.shortAddress,
          coordinates: {
            lat: geoData.latitude,
            lng: geoData.longitude,
          },
        };
        localStorage.setItem("userLocation", JSON.stringify(locData));
        localStorage.setItem(
          "guest_location",
          JSON.stringify({
            lat: geoData.latitude,
            lng: geoData.longitude,
            address: geoData.shortAddress,
          })
        );
      } else {
        // Authenticated: save via backend
        await DeliveryLocationService.setDeliveryLocation(
          geoData.latitude,
          geoData.longitude,
          geoData.shortAddress
        );
      }
      console.log("✅ Location saved successfully");

      setStep("success");

      // Call the callback with location data
      onLocationSet({
        address: geoData.address,
        shortAddress: geoData.shortAddress,
        coordinates: {
          lat: geoData.latitude,
          lng: geoData.longitude,
        },
      });

      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("❌ Location error:", error);
      setError(error.message);
      setStep("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("permission");
    setError("");
    onClose();
  };

  const handleRetry = () => {
    setStep("permission");
    setError("");
  };

  const renderContent = () => {
    switch (step) {
      case "permission":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Navigation className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Allow Location Access
              </h3>
              <p className="text-muted-foreground">
                We need your location to provide accurate delivery estimates and
                show nearby restaurants.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-accent/50 rounded-lg">
                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Faster delivery</div>
                  <div className="text-xs text-muted-foreground">
                    Get accurate delivery times based on your location
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-accent/50 rounded-lg">
                <Navigation className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Nearby restaurants</div>
                  <div className="text-xs text-muted-foreground">
                    Discover restaurants in your area
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Not Now
              </Button>
              <Button onClick={handleAllowLocation} className="flex-1">
                Allow Location
              </Button>
            </div>
          </div>
        );

      case "loading":
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Getting Your Location
              </h3>
              <p className="text-muted-foreground">
                Please allow location access in your browser...
              </p>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Location Set Successfully!
              </h3>
              <p className="text-muted-foreground">
                Your delivery location has been updated.
              </p>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Location Access Failed
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-accent/50 rounded-lg">
                <div className="text-sm font-medium mb-1">
                  Troubleshooting tips:
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>
                    • Make sure location services are enabled on your device
                  </li>
                  <li>• Check your browser permissions for this site</li>
                  <li>
                    • Try refreshing the page and allowing location access
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Skip for Now
              </Button>
              <Button onClick={handleRetry} className="flex-1">
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Set Your Location</span>
          </DialogTitle>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default LocationPermissionModal;
