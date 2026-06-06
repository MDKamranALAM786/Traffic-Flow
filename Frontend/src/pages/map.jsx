import { useRef, useEffect, useContext } from 'react'
import mapboxgl from 'mapbox-gl'

import 'mapbox-gl/dist/mapbox-gl.css';
import { LocationContext } from "../context/LocationContext.jsx";

export default function MapPage() {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);

    const { location, destCoord } = useContext(LocationContext);

    const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    const isSamePoint = (lat1, long1, lat2, long2) => {
        const THRESHOLD = 0.0018;
        const isSame = Math.abs(lat1 - lat2) < THRESHOLD && Math.abs(long1 - long2) < THRESHOLD;
        console.log(`Is Same Point : ${isSame}`);
        return (isSame);
    };

    useEffect(() => {
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            center: [destCoord.long, destCoord.lat],
            zoom: 14
        });

        new mapboxgl.Marker({ color: "red" })
            .setLngLat([location.longitude, location.latitude])
            .addTo(mapRef.current);
        if (!isSamePoint(location.latitude, location.longitude, destCoord.lat, destCoord.long)) {
            new mapboxgl.Marker({ color: "black" })
                .setLngLat([destCoord.long, destCoord.lat])
                .addTo(mapRef.current);
        }

        return (() => {
            mapRef.current.remove();
        });
    }, []);

    return (
        <>
            <div id='map-container' ref={mapContainerRef} style={{ height: "100vh" }} />
        </>
    );
};
