import { useRef, useEffect, useContext, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import { LocationContext } from "../context/LocationContext.jsx";
import { callRouteService } from "../utils/ServiceCall.jsx";

export default function MapPage() {
    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);

    const [routes, setRoutes] = useState([]);
    const [routesAvailable, setRoutesAvailable] = useState(false);

    const { location, destCoord } = useContext(LocationContext);

    let geoJSONObject = { properties: {} };
    const mapSourceId = "route";
    const mapLayerId = "route-layer";

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
            center: [destCoord.longitude, destCoord.latitude],
            zoom: 14
        });

        mapRef.current.on("error", (err) => {
            console.log(`Mapbox Error : ${err}`);
        });

        // current location marker
        new mapboxgl.Marker({ color: "red" })
            .setLngLat([location.longitude, location.latitude])
            .addTo(mapRef.current);
        // destination marker
        if (!isSamePoint(location.latitude, location.longitude, destCoord.latitude, destCoord.longitude)) {
            new mapboxgl.Marker({ color: "black" })
                .setLngLat([destCoord.longitude, destCoord.latitude])
                .addTo(mapRef.current);
        }

        mapRef.current.on("load", async () => {
            try {
                const route = await callRouteService(location, destCoord);
                console.log(route);

                setRoutes(route);
                setRoutesAvailable(true);

                geoJSONObject.type = "Feature";
                geoJSONObject.geometry = {
                    type: "LineString",
                    coordinates: route
                };
                console.log("GeoJSON Object :");
                console.log(geoJSONObject);

                mapRef.current.addSource(mapSourceId, {
                    type: "geojson",
                    data: geoJSONObject
                });
                mapRef.current.addLayer({
                    id: mapLayerId,
                    type: "line",
                    source: mapSourceId,
                    paint: {
                        "line-color": "blue",
                        "line-width": 6
                    }
                });
            } catch (err) {
                console.log(`Some Problem in fetching route : ${err.message}`);
                setRoutes([]);
                setRoutesAvailable(false);
            }
        });

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
