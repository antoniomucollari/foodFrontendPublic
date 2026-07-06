import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

const parseCoord = (value) => {
  if (value === null || value === undefined) return NaN;
  if (typeof value === "string") {
    return Number(value.replace(",", ".").trim());
  }
  return Number(value);
};

const normalizeLatLng = (latInput, lngInput) => {
  const lat = parseCoord(latInput);
  const lng = parseCoord(lngInput);

  const isNormalValid = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  if (isNormalValid) return { lat, lng };

  const isSwappedValid = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lng) <= 90 && Math.abs(lat) <= 180;
  if (isSwappedValid) {
    // Backend sometimes sends swapped coordinates; recover automatically.
    return { lat: lng, lng: lat };
  }

  return null;
};

const CheckoutMap = ({
  restaurantLocation,
  userLocation,
  onRouteCalculated,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const [error, setError] = useState(null);
  const { isDark } = useTheme();

  // Effect to update map theme when isDark changes
  useEffect(() => {
    if (mapInstanceRef.current && window.google && window.google.maps) {
      mapInstanceRef.current.setOptions({
        colorScheme: isDark
          ? window.google.maps.ColorScheme.DARK
          : window.google.maps.ColorScheme.LIGHT,
      });
    }
  }, [isDark]);

  useEffect(() => {
    if (!restaurantLocation || !userLocation) return;
    if (
      !(typeof window !== "undefined" && window.google && window.google.maps)
    ) {
      setError("Google Maps API not loaded");
      return;
    }

    const initMap = () => {
      const origin = normalizeLatLng(
        restaurantLocation.latitude,
        restaurantLocation.longitude,
      );
      const destination = normalizeLatLng(
        userLocation.latitude,
        userLocation.longitude,
      );

      if (!origin || !destination) {
        setError("Invalid route coordinates");
        return;
      }

      // Calculate center (midpoint)
      const center = {
        lat: (origin.lat + destination.lat) / 2,
        lng: (origin.lng + destination.lng) / 2,
      };

      if (!mapInstanceRef.current && mapContainerRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(
          mapContainerRef.current,
          {
            center,
            zoom: 13,
            disableDefaultUI: true, // Disable all default UI controls
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: false, // Disable zoom control
            mapId: "a952d330168bb6ed281f5772",
            colorScheme: isDark
              ? window.google.maps.ColorScheme.DARK
              : window.google.maps.ColorScheme.LIGHT,
          },
        );

        directionsServiceRef.current =
          new window.google.maps.DirectionsService();
        directionsRendererRef.current =
          new window.google.maps.DirectionsRenderer({
            map: mapInstanceRef.current,
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: "#2563eb", // blue-600
              strokeWeight: 5,
            },
          });

        originMarkerRef.current = new window.google.maps.Marker({
          map: mapInstanceRef.current,
          title: "Restaurant",
        });

        destinationMarkerRef.current = new window.google.maps.Marker({
          map: mapInstanceRef.current,
          title: "You",
          icon: {
             path: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
             fillColor: "#3b82f6",
             fillOpacity: 1,
             strokeWeight: 1,
             strokeColor: "#ffffff",
             scale: 1.5,
             anchor: new window.google.maps.Point(12, 24),
          }
        });
      }

      originMarkerRef.current?.setPosition(origin);
      destinationMarkerRef.current?.setPosition(destination);

      calculateRoute();
    };

    const calculateRoute = () => {
      if (!directionsServiceRef.current || !directionsRendererRef.current)
        return;

      const origin = normalizeLatLng(
        restaurantLocation.latitude,
        restaurantLocation.longitude,
      );
      const destination = normalizeLatLng(
        userLocation.latitude,
        userLocation.longitude,
      );
      if (!origin || !destination) return;

      directionsServiceRef.current.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            directionsRendererRef.current.setDirections(result);

            // Extract distance and duration
            const route = result.routes[0];
            if (route && route.legs && route.legs.length > 0) {
              const leg = route.legs[0];
              const dist = leg.distance.text;
              const dur = leg.duration.text;

              // Callback to parent
              if (onRouteCalculated) {
                onRouteCalculated({ distance: dist, duration: dur });
              }
            }
          } else {
            console.error(`Directions request failed due to ${status}`);
            setError("Could not calculate route");
          }
        },
      );
    };

    initMap();
  }, [restaurantLocation, userLocation, onRouteCalculated, isDark]);

  if (error) {
    return (
      <div className="h-48 w-full bg-muted flex items-center justify-center rounded-lg border">
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full group">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default CheckoutMap;
