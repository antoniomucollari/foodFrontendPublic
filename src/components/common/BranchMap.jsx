import React, { useEffect, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";

const BranchMap = ({ restaurantLocation, deliveryRadiusInKm, userLocation, className }) => {
    const { isDark } = useTheme();
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const restaurantMarkerRef = useRef(null);
    const userMarkerRef = useRef(null);
    const circleRef = useRef(null);

    useEffect(() => {
        if (!window.google || !window.google.maps) {
            console.error("Google Maps API is not loaded");
            return;
        }

        if (!mapInstanceRef.current && mapRef.current) {
            const center = restaurantLocation || { lat: 41.3275, lng: 19.8187 }; // Default fallback
            
            const lightMapStyles = [
                { featureType: "all", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
                { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
                { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
                { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
                { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
                { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
                { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
                { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
                { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
                { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
                { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
                { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
                { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
                { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
                { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }
            ];

            const darkMapStyles = [
                { elementType: "geometry", stylers: [{ color: "#212121" }] },
                { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
                { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
                { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
                { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
                { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
                { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
                { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
                { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
                { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
                { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
                { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
                { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
                { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
                { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
                { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
                { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
                { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
            ];

            mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                center: center,
                zoom: 13,
                disableDefaultUI: true, // cleaner look
                zoomControl: true,
                styles: isDark ? darkMapStyles : lightMapStyles,
            });

            if (restaurantLocation) {
                // Add restaurant marker
                restaurantMarkerRef.current = new window.google.maps.Marker({
                    position: restaurantLocation,
                    map: mapInstanceRef.current,
                    title: "Restaurant Location",
                    icon: {
                        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                    }
                });

                // Add circle for delivery radius
                if (deliveryRadiusInKm) {
                    circleRef.current = new window.google.maps.Circle({
                        strokeColor: isDark ? "#ffffff" : "#1f2937",
                        strokeOpacity: 0.5,
                        strokeWeight: 2,
                        fillColor: isDark ? "#ffffff" : "#1f2937",
                        fillOpacity: 0.15,
                        map: mapInstanceRef.current,
                        center: restaurantLocation,
                        radius: deliveryRadiusInKm * 1000, // Convert km to meters
                    });
                }
            }

            if (userLocation) {
                // Add user marker
                userMarkerRef.current = new window.google.maps.Marker({
                    position: userLocation,
                    map: mapInstanceRef.current,
                    title: "Your Location",
                    icon: {
                        path: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
                        fillColor: "#3b82f6", // Tailwind blue-500
                        fillOpacity: 1,
                        strokeWeight: 1,
                        strokeColor: "#ffffff",
                        scale: 1.5,
                        anchor: new window.google.maps.Point(12, 24),
                    }
                });
            }

            // Fit bounds to show the whole circle and user location
            const bounds = new window.google.maps.LatLngBounds();
            if (circleRef.current) {
                // Use the circle's bounds
                bounds.union(circleRef.current.getBounds());
            } else if (restaurantLocation) {
                bounds.extend(restaurantLocation);
            }
            if (userLocation) {
                bounds.extend(userLocation);
            }
            
            if (!bounds.isEmpty()) {
                mapInstanceRef.current.fitBounds(bounds);
            }
        }
    }, [restaurantLocation, deliveryRadiusInKm, userLocation]);

    // Update if props change
    useEffect(() => {
        if (!mapInstanceRef.current || !window.google || !window.google.maps) return;

        if (restaurantLocation) {
            if (restaurantMarkerRef.current) {
                restaurantMarkerRef.current.setPosition(restaurantLocation);
            } else {
                restaurantMarkerRef.current = new window.google.maps.Marker({
                    position: restaurantLocation,
                    map: mapInstanceRef.current,
                    title: "Restaurant Location",
                    icon: {
                        url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
                    }
                });
            }

            if (deliveryRadiusInKm) {
                if (circleRef.current) {
                    circleRef.current.setCenter(restaurantLocation);
                    circleRef.current.setRadius(deliveryRadiusInKm * 1000);
                } else {
                    circleRef.current = new window.google.maps.Circle({
                        strokeColor: isDark ? "#ffffff" : "#1f2937",
                        strokeOpacity: 0.5,
                        strokeWeight: 2,
                        fillColor: isDark ? "#ffffff" : "#1f2937",
                        fillOpacity: 0.15,
                        map: mapInstanceRef.current,
                        center: restaurantLocation,
                        radius: deliveryRadiusInKm * 1000,
                    });
                }
            }
            
            mapInstanceRef.current.setCenter(restaurantLocation);
        }

        if (userLocation) {
            if (userMarkerRef.current) {
                userMarkerRef.current.setPosition(userLocation);
            } else {
                userMarkerRef.current = new window.google.maps.Marker({
                    position: userLocation,
                    map: mapInstanceRef.current,
                    title: "Your Location",
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
        }

        const bounds = new window.google.maps.LatLngBounds();
        if (circleRef.current) {
            bounds.union(circleRef.current.getBounds());
        } else if (restaurantLocation) {
            bounds.extend(restaurantLocation);
        }
        if (userLocation) {
            bounds.extend(userLocation);
        }
        
        if (!bounds.isEmpty()) {
            mapInstanceRef.current.fitBounds(bounds);
        }
    }, [restaurantLocation, deliveryRadiusInKm, userLocation, isDark]);

    // Update map style when theme changes
    useEffect(() => {
        if (!mapInstanceRef.current || !window.google || !window.google.maps) return;

        const lightMapStyles = [
            { featureType: "all", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
            { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
            { featureType: "all", elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
            { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
            { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
            { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
            { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
            { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
            { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
            { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
            { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
            { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
            { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
            { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }
        ];

        const darkMapStyles = [
            { elementType: "geometry", stylers: [{ color: "#212121" }] },
            { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
            { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
            { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
            { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
            { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
            { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
            { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
            { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
            { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
            { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
            { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
            { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
            { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
            { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
            { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
            { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
            { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
        ];

        mapInstanceRef.current.setOptions({ styles: isDark ? darkMapStyles : lightMapStyles });

        if (circleRef.current) {
            circleRef.current.setOptions({
                strokeColor: isDark ? "#ffffff" : "#1f2937",
                fillColor: isDark ? "#ffffff" : "#1f2937"
            });
        }
    }, [isDark]);

    return <div ref={mapRef} className={`w-full h-full rounded-md ${className || ""}`} style={{ minHeight: "300px" }} />;
};

export default BranchMap;
