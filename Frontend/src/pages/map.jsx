import { useRef, useEffect, useContext, useState } from 'react';
import { useNavigate } from "react-router-dom";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import "../../public/styles/map.css";
import { LocationContext } from "../context/LocationContext.jsx";
import { callRouteService } from "../utils/ServiceCall.jsx";

export default function MapPage() {
    const router = useNavigate();

    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);

    const prevSrcRef = useRef(null);
    const srcMarkerRef = useRef(null);

    const [routes, setRoutes] = useState([]);
    const [routesAvailable, setRoutesAvailable] = useState(false);

    const [isNavigating, setIsNavigating] = useState(false);
    const [hasArrived, setHasArrived] = useState(false);

    const { location, destCoord } = useContext(LocationContext);

    const mapSourceId = "route";
    const mapLayerId = "route-layer";

    const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    const isSamePoint = (lat1, long1, lat2, long2) => {
        const THRESHOLD = 0.002;
        const isSame = Math.abs(lat1 - lat2) < THRESHOLD && Math.abs(long1 - long2) < THRESHOLD;
        return (isSame);
    };

    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth radius in km

        const toRad = (deg) => deg * (Math.PI / 180);

        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c;
        return (distance); // distance in km
    };

    const reCalculateRoute = async (newLocation) => {
        const route = await callRouteService(newLocation, destCoord);
        setRoutes(route);
        setRoutesAvailable(true);

        mapRef.current.getSource(mapSourceId).setData({
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates: route
            }
        });
    };

    const toggleNavigation = () => {
        setIsNavigating(!isNavigating);
    };

    const reachedDestination = (lat, long) => {
        let reached = false;
        if (isSamePoint(lat, long, destCoord.latitude, destCoord.longitude)) {
            console.log("Reached Destination");

            setIsNavigating(false);
            setHasArrived(true);

            mapRef.current.getSource(mapSourceId).setData({
                type: "Feature",
                properties: {},
                geometry: {
                    type: "LineString",
                    coordinates: []
                }
            });


            reached = true;
        }
        return (reached);
    };
    const updateSrcMarker = (lat, long) => {
        if (srcMarkerRef.current) {
            srcMarkerRef.current.setLngLat([long, lat]);
            mapRef.current.panTo([long, lat]);
        }
    };

    useEffect(() => {
        if (!isNavigating) {
            return;
        }

        const watchPositionId = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                console.log("Watching Position :");
                console.log(`Latitude : ${latitude}, Longitude : ${longitude}`);

                const reached = reachedDestination(latitude, longitude);
                if (!reached) {
                    const distMoved = getDistance(prevSrcRef.current.lat, prevSrcRef.current.long, latitude, longitude);
                    if (distMoved > 0.25) {
                        await reCalculateRoute({ latitude, longitude });
                        prevSrcRef.current = {
                            lat: latitude,
                            long: longitude
                        };
                    }
                    console.log("Updated Source Marker");
                }
                updateSrcMarker(latitude, longitude);
            },
            (err) => {
                console.log(`Some Error while watching position : ${err.message}`);
            }
        );

        return (() => {
            navigator.geolocation.clearWatch(watchPositionId);
            console.log("Cleared Watch Position Id");
        });
    }, [isNavigating]);

    useEffect(() => {
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            center: [destCoord.longitude, destCoord.latitude],
            zoom: 14
        });

        mapRef.current.on("error", (err) => {
            console.log(`Mapbox Error : ${err.message}`);
        });

        if (srcMarkerRef.current) {
            srcMarkerRef.current.remove();
        }

        // current location marker
        srcMarkerRef.current = new mapboxgl.Marker({ color: "red" })
            .setLngLat([location.longitude, location.latitude])
            .addTo(mapRef.current);
        prevSrcRef.current = {
            lat: location.latitude,
            long: location.longitude
        };
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

                const geoJSONObject = {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "LineString",
                        coordinates: route
                    }
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

                let bounds = new mapboxgl.LngLatBounds();
                route.forEach((coord) => {
                    bounds.extend(coord);
                });
                mapRef.current.fitBounds(bounds, { padding: 60 });
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

            <div className="buttons">
                <button id="home-btn" className="map-icon-btn home-btn" onClick={() => { router("/home"); }} title="Go Home">
                    <img src="/assets/HomeIcon.png" alt="Home" className="btn-icon" />
                    <span className="btn-label">Home</span>
                </button>

                <button
                    id="navigate-btn"
                    className={`map-icon-btn navigate-btn${isNavigating ? ' active' : ''}`}
                    onClick={toggleNavigation}
                    title={isNavigating ? 'Stop Navigation' : 'Start Navigation'}
                >
                    <img src="/assets/NavigateIcon.png" alt="Navigate" className="btn-icon" />
                    <span className="btn-label">{isNavigating ? 'Stop' : 'Navigate'}</span>
                </button>
            </div>
        </>
    );
};
