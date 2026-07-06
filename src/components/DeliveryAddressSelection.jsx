import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  MapPin,
  Check,
  Home,
  Briefcase,
  MapPinned,
  Plus,
  Loader2,
} from "lucide-react";
import { DeliveryLocationService } from "../services/deliveryLocationService";
import LocationSearchModal from "./LocationSearchModal";

const DeliveryAddressSelection = ({ onAddressSelect, selectedAddressId }) => {
  const [savedLocations, setSavedLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    loadSavedLocations();
  }, []);

  useEffect(() => {
    if (selectedAddressId && savedLocations.length > 0) {
      const location = savedLocations.find(
        (loc) => loc.id === selectedAddressId
      );
      if (location) {
        setSelectedLocation(location);
      }
    } else if (savedLocations.length > 0) {
      // Auto-select the default location if no selection is made
      const defaultLocation = savedLocations.find((loc) => loc.isDefault);
      if (defaultLocation) {
        setSelectedLocation(defaultLocation);
        onAddressSelect(defaultLocation);
      }
    }
  }, [selectedAddressId, savedLocations]);

  const loadSavedLocations = async () => {
    try {
      setIsLoading(true);
      const response = await DeliveryLocationService.getAllDeliveryLocations();
      if (response.data && Array.isArray(response.data)) {
        setSavedLocations(response.data);
        // Auto-select the default location
        const defaultLocation = response.data.find((loc) => loc.isDefault);
        if (defaultLocation) {
          setSelectedLocation(defaultLocation);
          onAddressSelect(defaultLocation);
        }
      }
    } catch (error) {
      console.error("❌ Error loading saved locations:", error);
      setSavedLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = async (location) => {
    try {
      setIsLoading(true);
      // Make API call to set this location as the active delivery location
      await DeliveryLocationService.setDeliveryLocation(
        location.latitude,
        location.longitude,
        location.locationName,
        location.nickname,
        location.id
      );

      setSelectedLocation(location);
      onAddressSelect(location);

      // Dispatch custom event to notify all components
      window.dispatchEvent(
        new CustomEvent("deliveryLocationChanged", {
          detail: {
            id: location.id,
            nickname: location.nickname,
            locationName: location.locationName,
            latitude: location.latitude,
            longitude: location.longitude,
          },
        })
      );
    } catch (error) {
      console.error("❌ Error selecting location:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewLocationAdded = () => {
    // Reload locations after adding a new one
    loadSavedLocations();
  };

  const getLocationIcon = (nickname) => {
    if (!nickname) return <MapPin className="h-4 w-4" />;
    const name = nickname.toLowerCase();
    if (name.includes("home")) return <Home className="h-4 w-4" />;
    if (name.includes("work") || name.includes("office"))
      return <Briefcase className="h-4 w-4" />;
    return <MapPinned className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Delivery Address</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Delivery Address</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {savedLocations.length === 0 ? (
            <div className="text-center py-6">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No delivery addresses saved yet
              </p>
              <Button onClick={() => setIsLocationModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Delivery Address
              </Button>
            </div>
          ) : (
            <>
              <Label className="text-sm font-medium">
                Select delivery address
              </Label>
              <div className="space-y-2">
                {savedLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handleLocationSelect(location)}
                    className={`w-full p-3 border rounded-lg text-left transition-all ${
                      selectedLocation?.id === location.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getLocationIcon(location.nickname)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">
                            {location.nickname || "Location"}
                          </span>
                          {location.isDefault && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {location.locationName}
                        </p>
                      </div>
                      {selectedLocation?.id === location.id && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsLocationModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Address
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <LocationSearchModal
        isOpen={isLocationModalOpen}
        onClose={() => {
          setIsLocationModalOpen(false);
          handleNewLocationAdded();
        }}
        onLocationSelect={handleNewLocationAdded}
      />
    </>
  );
};

export default DeliveryAddressSelection;
