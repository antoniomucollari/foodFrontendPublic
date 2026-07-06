import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  MapPin,
  Search,
  Loader2,
  AlertCircle,
  Navigation,
  Check,
  Home,
  Briefcase,
  MapPinned,
  Trash2,
} from "lucide-react";
import { DeliveryLocationService } from "../services/deliveryLocationService";
import { GeolocationService } from "../services/geolocationService";
import { useAuth } from "../contexts/AuthContext";

const LocationSearchModal = ({ isOpen, onClose, onLocationSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [error, setError] = useState("");
  const [nickname, setNickname] = useState("");
  const [savedLocations, setSavedLocations] = useState([]);
  const [showNewLocationForm, setShowNewLocationForm] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const sessionTokenRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapMarkerRef = useRef(null);
  const { isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated();

  // --- Guest localStorage helpers ---
  const getGuestLocations = () => {
    try {
      const stored = localStorage.getItem("guestLocations");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveGuestLocations = (locations) => {
    localStorage.setItem("guestLocations", JSON.stringify(locations));
  };

  // Load saved locations when modal opens
  useEffect(() => {
    const loadSavedLocations = async () => {
      if (isOpen) {
        try {
          setIsLoading(true);
          if (isGuest) {
            // Guest: load from localStorage
            setSavedLocations(getGuestLocations());
          } else {
            // Authenticated: load from backend
            const response =
              await DeliveryLocationService.getAllDeliveryLocations();
            if (response.data && Array.isArray(response.data)) {
              setSavedLocations(response.data);
            }
          }
        } catch (error) {
          console.error("❌ Error loading saved locations:", error);
          setSavedLocations([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSavedLocations();
  }, [isOpen, isGuest]);

  // Handle getting current location
  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    setError("");

    try {
      console.log("🎯 Getting current location...");

      // Get current location with address using GeolocationService
      const locationData = await GeolocationService.getLocationWithAddress();
      console.log("✅ Got current location:", locationData);

      // Set the search query to show the found location
      setSearchQuery(locationData.address);

      // Automatically select this location
      const mockSelectedPlace = {
        description: locationData.address,
        coordinates: [locationData.longitude, locationData.latitude],
        structured_formatting: {
          main_text: locationData.shortAddress,
          secondary_text: locationData.address
            .replace(locationData.shortAddress, "")
            .replace(/^,\s*/, ""),
        },
      };

      setSelectedPlace(mockSelectedPlace);
      setShowNewLocationForm(true);
      console.log("📍 Current location selected:", mockSelectedPlace);
    } catch (error) {
      console.error("❌ Error getting current location:", error);
      setError(
        "Failed to get your current location. Please try searching manually.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Preload user location to bias autocomplete results
  useEffect(() => {
    if (!isOpen) return;
    const loadUserLocation = async () => {
      try {
        const loc = await GeolocationService.getCurrentLocation();
        setUserLocation(loc);
      } catch {
        // optional; autocomplete works without bias
      }
    };
    loadUserLocation();
  }, [isOpen]);

  // Initialize or update Google Map when a place is selected
  useEffect(() => {
    if (
      !showNewLocationForm ||
      !selectedPlace ||
      !selectedPlace.coordinates ||
      selectedPlace.coordinates.length !== 2
    ) {
      return;
    }
    if (
      !(typeof window !== "undefined" && window.google && window.google.maps)
    ) {
      return;
    }

    const lat = Number(selectedPlace.coordinates[1]);
    const lng = Number(selectedPlace.coordinates[0]);
    const center = { lat, lng };

    if (!mapInstanceRef.current && mapContainerRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(
        mapContainerRef.current,
        {
          center,
          zoom: 17,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        },
      );

      mapInstanceRef.current.addListener("click", (e) => {
        const clicked = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        if (!mapMarkerRef.current) {
          mapMarkerRef.current = new window.google.maps.Marker({
            position: clicked,
            map: mapInstanceRef.current,
            draggable: true,
          });
          mapMarkerRef.current.addListener("dragend", (evt) => {
            const newPos = {
              lat: evt.latLng.lat(),
              lng: evt.latLng.lng(),
            };
            setSelectedPlace((prev) =>
              prev
                ? {
                    ...prev,
                    coordinates: [newPos.lng, newPos.lat],
                  }
                : prev,
            );
          });
        } else {
          mapMarkerRef.current.setPosition(clicked);
        }
        mapInstanceRef.current.panTo(clicked);
        setSelectedPlace((prev) =>
          prev
            ? {
                ...prev,
                coordinates: [clicked.lng, clicked.lat],
              }
            : prev,
        );
      });
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(center);
      if (!mapMarkerRef.current) {
        mapMarkerRef.current = new window.google.maps.Marker({
          position: center,
          map: mapInstanceRef.current,
          draggable: true,
        });
        mapMarkerRef.current.addListener("dragend", (evt) => {
          const newPos = { lat: evt.latLng.lat(), lng: evt.latLng.lng() };
          setSelectedPlace((prev) =>
            prev
              ? {
                  ...prev,
                  coordinates: [newPos.lng, newPos.lat],
                }
              : prev,
          );
        });
      } else {
        mapMarkerRef.current.setPosition(center);
      }
    }
  }, [showNewLocationForm, selectedPlace]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    setError("");

    if (!query.trim()) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    try {
      if (
        !(
          typeof window !== "undefined" &&
          window.google &&
          window.google.maps &&
          window.google.maps.places
        )
      ) {
        throw new Error("Google Maps Places API not loaded");
      }

      // Ensure a session token for ranking/billing grouping
      if (!sessionTokenRef.current) {
        sessionTokenRef.current =
          new window.google.maps.places.AutocompleteSessionToken();
      }

      const autocompleteService =
        new window.google.maps.places.AutocompleteService();

      autocompleteService.getPlacePredictions(
        {
          input: query,
          // Avoid over-filtering; let Places decide.
          // types: ["geocode"], // uncomment to prefer geocoded results
          sessionToken: sessionTokenRef.current,
          ...(userLocation
            ? {
                locationBias: {
                  center: {
                    lat: Number(userLocation.latitude),
                    lng: Number(userLocation.longitude),
                  },
                  radius: 20000, // 20km
                },
              }
            : {}),
        },
        (preds, status) => {
          setIsLoading(false);
          if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
            setPredictions([]);
            return;
          }

          const transformedPredictions = (preds || []).map((p) => ({
            place_id: p.place_id,
            description: p.description,
            structured_formatting: {
              main_text: p.structured_formatting?.main_text || p.description,
              secondary_text:
                p.structured_formatting?.secondary_text ||
                p.description
                  .replace(p.structured_formatting?.main_text || "", "")
                  .replace(/^,\s*/, ""),
            },
          }));
          setPredictions(transformedPredictions);
        },
      );
    } catch (error) {
      console.error("❌ Error searching locations:", error);
      setIsLoading(false);
      setPredictions([]);
      setError("Error searching locations. Please try again.");
    }
  };

  const handlePlaceSelect = (place) => {
    setSearchQuery(place.description);
    setPredictions([]);
    setIsLoading(true);

    try {
      if (
        !(
          typeof window !== "undefined" &&
          window.google &&
          window.google.maps &&
          window.google.maps.places
        )
      ) {
        throw new Error("Google Maps Places API not loaded");
      }

      const dummyMap = document.createElement("div");
      const placesService = new window.google.maps.places.PlacesService(
        dummyMap,
      );

      placesService.getDetails(
        {
          placeId: place.place_id,
          fields: ["geometry", "formatted_address", "name"],
          sessionToken: sessionTokenRef.current || undefined,
        },
        (details, status) => {
          setIsLoading(false);
          if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
            setError(
              "Failed to get place details. Please try another address.",
            );
            return;
          }

          const lat = details.geometry?.location?.lat();
          const lng = details.geometry?.location?.lng();

          const selected = {
            place_id: place.place_id,
            description: details.formatted_address || place.description || "",
            coordinates:
              typeof lat === "number" && typeof lng === "number"
                ? [lng, lat] // keep [lon, lat] to match existing logic
                : null,
            structured_formatting: {
              main_text: details.name || place.structured_formatting?.main_text,
              secondary_text: (
                details.formatted_address ||
                place.description ||
                ""
              )
                .replace(details.name || "", "")
                .replace(/^,\s*/, ""),
            },
          };

          setSelectedPlace(selected);
          setShowNewLocationForm(true);
          // Reset session for the next search flow
          sessionTokenRef.current = null;
        },
      );
    } catch (error) {
      console.error("❌ Error selecting place:", error);
      setIsLoading(false);
      setError("Unexpected error selecting place.");
    }
  };

  const handleSavedLocationSelect = async (location) => {
    if (!location) return;

    setIsLoading(true);
    try {
      if (isGuest) {
        // Guest: just update localStorage, no backend call
        const locationData = {
          address: location.locationName,
          shortAddress:
            location.nickname || location.locationName.split(",")[0],
          nickname: location.nickname,
          coordinates: { lat: location.latitude, lng: location.longitude },
        };
        localStorage.setItem("userLocation", JSON.stringify(locationData));

        onLocationSelect(locationData);

        window.dispatchEvent(
          new CustomEvent("deliveryLocationChanged", {
            detail: {
              nickname: location.nickname,
              locationName: location.locationName,
              latitude: location.latitude,
              longitude: location.longitude,
            },
          }),
        );
      } else {
        // Authenticated: set via backend
        await DeliveryLocationService.setDeliveryLocation(
          location.latitude,
          location.longitude,
          location.locationName,
          location.nickname,
          location.id,
        );

        onLocationSelect({
          address: location.locationName,
          shortAddress:
            location.nickname || location.locationName.split(",")[0],
          nickname: location.nickname,
          coordinates: { lat: location.latitude, lng: location.longitude },
        });

        window.dispatchEvent(
          new CustomEvent("deliveryLocationChanged", {
            detail: {
              id: location.id,
              nickname: location.nickname,
              locationName: location.locationName,
              latitude: location.latitude,
              longitude: location.longitude,
            },
          }),
        );
      }

      onClose();
    } catch (error) {
      console.error("❌ Error selecting saved location:", error);
      setError("Failed to select location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLocation = async (e, location) => {
    e.stopPropagation();

    if (!location) return;

    setIsLoading(true);
    try {
      if (isGuest) {
        // Guest: remove from localStorage
        const locations = getGuestLocations().filter(
          (loc) => loc.id !== location.id,
        );
        saveGuestLocations(locations);
        setSavedLocations(locations);

        // Also clear userLocation if this was the active one
        const storedLocation = localStorage.getItem("userLocation");
        if (storedLocation) {
          try {
            const parsed = JSON.parse(storedLocation);
            if (
              parsed.coordinates?.lat === location.latitude &&
              parsed.coordinates?.lng === location.longitude
            ) {
              localStorage.removeItem("userLocation");
              window.dispatchEvent(
                new CustomEvent("deliveryLocationChanged", {
                  detail: {
                    nickname: null,
                    locationName: null,
                    latitude: null,
                    longitude: null,
                  },
                }),
              );
            }
          } catch {}
        }
      } else {
        // Authenticated: delete via backend
        await DeliveryLocationService.deleteDeliveryLocation(location.id);

        const response =
          await DeliveryLocationService.getAllDeliveryLocations();
        if (response.data && Array.isArray(response.data)) {
          setSavedLocations(response.data);
        } else {
          setSavedLocations([]);
        }

        if (location.isDefault) {
          window.dispatchEvent(
            new CustomEvent("deliveryLocationChanged", {
              detail: {
                id: null,
                nickname: null,
                locationName: null,
                latitude: null,
                longitude: null,
              },
            }),
          );
        }
      }
    } catch (error) {
      console.error("❌ Error deleting location:", error);
      setError("Failed to delete location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLocation = async () => {
    if (!selectedPlace) return;

    if (!nickname.trim()) {
      setError("Please enter a nickname for this location (e.g., Home, Work)");
      return;
    }

    setIsLoading(true);

    try {
      console.log("🎯 Confirming location:", selectedPlace);

      const fullAddress = selectedPlace.description;
      const shortAddress = selectedPlace.structured_formatting.main_text;

      let latitude, longitude;
      if (selectedPlace.coordinates && selectedPlace.coordinates.length === 2) {
        longitude = selectedPlace.coordinates[0];
        latitude = selectedPlace.coordinates[1];
      } else {
        console.warn("⚠️ No coordinates found, using fallback coordinates");
        latitude = 40.7128;
        longitude = -74.006;
      }

      if (isGuest) {
        // Guest: save to localStorage only, replace the single guest location
        const guestSessionId =
          localStorage.getItem("guest_session_id") || crypto.randomUUID();
        localStorage.setItem("guest_session_id", guestSessionId);

        const guestLocation = {
          id: guestSessionId,
          latitude,
          longitude,
          locationName: fullAddress,
          nickname: nickname,
          isDefault: true,
        };

        // For guest, store only one location
        saveGuestLocations([guestLocation]);

        const locationData = {
          address: fullAddress,
          shortAddress: shortAddress,
          nickname: nickname,
          coordinates: { lat: latitude, lng: longitude },
        };
        localStorage.setItem("userLocation", JSON.stringify(locationData));

        // Also store in the guest_location format
        localStorage.setItem(
          "guest_location",
          JSON.stringify({
            lat: latitude,
            lng: longitude,
            address: fullAddress,
          }),
        );

        onLocationSelect(locationData);
      } else {
        // Authenticated: save via backend
        console.log("📡 Sending location to backend:", {
          fullAddress,
          shortAddress,
          nickname,
          coordinates: { latitude, longitude },
        });

        await DeliveryLocationService.setDeliveryLocation(
          latitude,
          longitude,
          fullAddress,
          nickname,
        );

        onLocationSelect({
          address: fullAddress,
          shortAddress: shortAddress,
          nickname: nickname,
          coordinates: { lat: latitude, lng: longitude },
        });
      }

      // Dispatch custom event to notify all components
      window.dispatchEvent(
        new CustomEvent("deliveryLocationChanged", {
          detail: {
            nickname: nickname,
            locationName: fullAddress,
            latitude: latitude,
            longitude: longitude,
          },
        }),
      );

      onClose();
    } catch (error) {
      console.error("❌ Error confirming location:", error);
      setError("Failed to update delivery location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setPredictions([]);
    setSelectedPlace(null);
    setError("");
    setNickname("");
    setShowNewLocationForm(false);
    onClose();
  };

  const getLocationIcon = (nickname) => {
    if (!nickname) return <MapPin className="h-4 w-4" />;
    const name = nickname.toLowerCase();
    if (name.includes("home")) return <Home className="h-4 w-4" />;
    if (name.includes("work") || name.includes("office"))
      return <Briefcase className="h-4 w-4" />;
    return <MapPinned className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Choose Delivery Location</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Saved Locations */}
          {savedLocations.length > 0 && !showNewLocationForm && (
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Your Saved Locations
              </Label>
              <div className="space-y-2">
                {savedLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handleSavedLocationSelect(location)}
                    className={`w-full p-3 border rounded-lg text-left transition-all hover:bg-accent ${
                      location.isDefault
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getLocationIcon(location.nickname)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1 overflow-hidden">
                          <span className="font-medium text-sm truncate">
                            {location.nickname || "Location"}
                          </span>
                          {location.isDefault && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground flex-shrink-0">
                              <Check className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          )}
                        </div>
                        <div className="relative overflow-hidden">
                          <p className="text-xs text-muted-foreground pr-6">
                            {location.locationName}
                          </p>
                          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-card to-transparent pointer-events-none"></div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteLocation(e, location)}
                        className="flex-shrink-0 p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        title="Delete location"
                      >
                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowNewLocationForm(true)}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Add New Location
              </Button>
            </div>
          )}

          {/* New Location Form */}
          {(showNewLocationForm || savedLocations.length === 0) && (
            <>
              {savedLocations.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewLocationForm(false);
                    setSelectedPlace(null);
                    setSearchQuery("");
                    setNickname("");
                  }}
                  className="mb-2"
                >
                  ← Back to Saved Locations
                </Button>
              )}

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for an address..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-20"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <button
                    onClick={handleGetCurrentLocation}
                    disabled={isLoading}
                    className="p-1 hover:bg-accent rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Use my current location"
                  >
                    <Navigation className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {error}
              </span>
            </div>
          )}

          {/* Search Results */}
          {predictions.length > 0 && (
            <div className="max-h-60 overflow-y-auto overflow-x-hidden border rounded-md">
              {predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  onClick={() => handlePlaceSelect(prediction)}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0"
                >
                  <div className="flex items-start space-x-3 overflow-hidden">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {prediction.structured_formatting.main_text}
                      </div>
                      <div className="relative overflow-hidden">
                        <div className="text-xs text-muted-foreground pr-6">
                          {prediction.structured_formatting.secondary_text}
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none"></div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Place */}
          {selectedPlace && showNewLocationForm && (
            <div className="space-y-3">
              <div className="p-4 bg-accent/50 rounded-md border overflow-hidden">
                <div className="flex items-start space-x-3 overflow-hidden">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {selectedPlace.structured_formatting.main_text}
                    </div>
                    <div className="relative overflow-hidden">
                      <div className="text-xs text-muted-foreground pr-6">
                        {selectedPlace.structured_formatting.secondary_text}
                      </div>
                      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-accent/50 to-transparent pointer-events-none"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Pin exact location
                </Label>
                <div
                  ref={mapContainerRef}
                  style={{ width: "100%", height: 280, borderRadius: 8 }}
                  className="border"
                />
                <div className="text-xs text-muted-foreground">
                  {selectedPlace?.coordinates
                    ? `Lat: ${Number(selectedPlace.coordinates[1]).toFixed(
                        6,
                      )}, Lng: ${Number(selectedPlace.coordinates[0]).toFixed(
                        6,
                      )}`
                    : "Select a point on the map"}
                </div>
              </div>

              {/* Nicename Input */}
              <div>
                <Label
                  htmlFor="nickname"
                  className="text-sm font-medium mb-1.5 block"
                >
                  Location Nickname <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nickname"
                  placeholder="e.g., Home, Work, Office..."
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Give this location a friendly name for easy identification
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showNewLocationForm && (
            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmLocation}
                disabled={!selectedPlace || isLoading || !nickname.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  "Confirm Location"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationSearchModal;
