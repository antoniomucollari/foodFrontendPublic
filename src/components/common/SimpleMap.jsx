import React, { useEffect, useRef } from "react";

const SimpleMap = ({ center, zoom = 15, className }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        // Check if Google Maps API is loaded and center is valid
        if (!window.google || !window.google.maps || !center) return;
        if (!mapRef.current) return;

        // Initialize map only once
        if (!mapInstanceRef.current) {
            mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                center: center,
                zoom: zoom,
                disableDefaultUI: true,
                zoomControl: true,
            });

            markerRef.current = new window.google.maps.Marker({
                position: center,
                map: mapInstanceRef.current,
            });
        } else {
            // Map already exists, just update center & marker
            mapInstanceRef.current.setCenter(center);
            if (markerRef.current) {
                markerRef.current.setPosition(center);
            } else {
                markerRef.current = new window.google.maps.Marker({
                    position: center,
                    map: mapInstanceRef.current,
                });
            }
        }
    }, [center, zoom]); // Re-run when center changes so map initializes as soon as center is available

    return <div ref={mapRef} className={`w-full h-full rounded-md ${className || ""}`} style={{ minHeight: "200px" }} />;
};

export default SimpleMap;
