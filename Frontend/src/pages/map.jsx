import { useRef, useEffect, useContext, useState } from 'react';
import { useNavigate } from "react-router-dom";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import "../../public/styles/map.css";
import { LocationContext } from "../context/LocationContext.jsx";
import { callRouteService } from "../utils/ServiceCall.jsx";

export default function MapPage() {
    const router = useNavigate();

    const mapRef = useRef(null);
    const mapContainerRef = useRef(null);

    const prevSrcRef = useRef(null);
    const srcMarkerRef = useRef(null);
    const destMarkerRef = useRef(null);

    const [routes, setRoutes] = useState([]);
    const [routesAvailable, setRoutesAvailable] = useState(false);

    const [eta, setEta] = useState(null);
    const [etaUnit, setEtaUnit] = useState("mins");
    const [remainingDist, setRemainingDist] = useState(null);
    const [distUnit, setDistUnit] = useState("kms");

    const [isNavigating, setIsNavigating] = useState(false);
    const [hasArrived, setHasArrived] = useState(false);

    const [alertMessage, setAlertMessage] = useState(null);
    const [alertType, setAlertType] = useState("");

    const { location, destCoord, setDestCoord, destCoordAvailable, setDestCoordAvailable } = useContext(LocationContext);

    const mapSourceId = "route";
    const mapLayerId = "route-layer";

    const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    const isSamePoint = (lat1, long1, lat2, long2, THRESHOLD = 0.002) => {
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

    // Returns the shortest perpendicular distance (km) from the user's position
    // to the entire route polyline made of connected [lng, lat] segments.
    const getDistanceFromRoute = (currentLat, currentLng, routeCoords) => {

        if (!routeCoords || routeCoords.length < 2) return Infinity; // need at least one segment

        let minDistance = Infinity;

        for (let i = 0; i < routeCoords.length - 1; i++) {

            // routeCoords stores [lng, lat] — destructure accordingly
            const [aLng, aLat] = routeCoords[i];      // segment start A
            const [bLng, bLat] = routeCoords[i + 1];  // segment end   B

            // Vector AB (direction of the segment)
            const abLat = bLat - aLat;
            const abLng = bLng - aLng;

            // Vector AP (from segment start to user position P)
            const apLat = currentLat - aLat;
            const apLng = currentLng - aLng;

            const ab2 = abLat * abLat + abLng * abLng; // |AB|² — squared length of segment

            if (ab2 === 0) {
                // Degenerate segment (A === B): measure to the point directly
                const d = getDistance(currentLat, currentLng, aLat, aLng);
                if (d < minDistance) minDistance = d;
                continue;
            }

            // t = dot(AP, AB) / |AB|²
            // Gives how far along AB the perpendicular foot of P lies.
            // t < 0 → before A,  t > 1 → after B,  0 ≤ t ≤ 1 → on the segment
            const t = (apLat * abLat + apLng * abLng) / ab2;

            const tClamped = Math.max(0, Math.min(1, t)); // clamp to keep point on segment

            // Coordinates of the closest point on the segment to P
            const closestLat = aLat + tClamped * abLat;
            const closestLng = aLng + tClamped * abLng;

            // Haversine distance from P to that closest point
            const dist = getDistance(currentLat, currentLng, closestLat, closestLng);

            if (dist < minDistance) minDistance = dist;
        }

        return minDistance; // km
    };

    const setEtaDist = (time, dist) => {
        if (time < 1) {
            const newTime = time * 60;
            setEta(newTime);
            setEtaUnit("secs");
        } else {
            setEta(time);
            setEtaUnit("mins");
        }

        if (dist < 1) {
            const newDist = dist * 1000;
            setRemainingDist(newDist);
            setDistUnit("ms");
        } else {
            setRemainingDist(dist);
            setDistUnit("kms");
        }
    };

    const reCalculateRoute = async (newLocation) => {
        const { route, totalTime, totalDistance } = await callRouteService(newLocation, destCoord);
        setRoutes(route);
        setRoutesAvailable(true);
        setEtaDist(totalTime, totalDistance);

        mapRef.current.getSource(mapSourceId).setData({
            type: "Feature",
            properties: {},
            geometry: {
                type: "LineString",
                coordinates: route
            }
        });

        mapRef.current.flyTo({
            center: [newLocation.longitude, newLocation.latitude],
            zoom: 17
        });
    };

    const toggleNavigation = () => {
        if (!isNavigating && !destCoordAvailable) {
            setAlertMessage("Please select destination first!");
            setAlertType("error");
            return;
        }

        setIsNavigating(!isNavigating);
    };

    const reachedDestination = (lat, long) => {
        if (isSamePoint(lat, long, destCoord.latitude, destCoord.longitude, 0.0009)) {
            console.log("Reached Destination");

            setIsNavigating(false);
            setHasArrived(true);
            destMarkerRef.current.remove();

            mapRef.current.getSource(mapSourceId).setData({
                type: "Feature",
                properties: {},
                geometry: {
                    type: "LineString",
                    coordinates: []
                }
            });

            setAlertMessage("Destination Reached!");
            setAlertType("success");

            setDestCoord("");
            setDestCoordAvailable(false);

            return (true);
        }

        return (false);
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

        mapRef.current.flyTo({
            center: [location.longitude, location.latitude],
            zoom: 17
        });

        let watchPositionId = null;

        const startTracking = () => {
            watchPositionId = navigator.geolocation.watchPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log("Watching Position :");
                    console.log(`Latitude : ${latitude}, Longitude : ${longitude}`);

                    const reached = reachedDestination(latitude, longitude);
                    if (!reached) {

                        // Pure calculation — local variable only, never put into state,
                        // so this block causes zero React re-renders.
                        const distFromRoute = getDistanceFromRoute(latitude, longitude, routes);
                        const isOffRoute = distFromRoute > 0.05; // 0.05 km = 50 m threshold
                        console.log(`Off-route: ${isOffRoute} | Distance: ${(distFromRoute * 1000).toFixed(1)} m`);

                        if (isOffRoute) {
                            await reCalculateRoute({ latitude, longitude });
                            prevSrcRef.current = {
                                lat: latitude,
                                long: longitude
                            };

                            setAlertType("warning");
                            setAlertMessage("You went off route. Recalculating Route...");
                        } else {
                            const distMoved = getDistance(prevSrcRef.current.lat, prevSrcRef.current.long, latitude, longitude);
                            if (distMoved > 0.25) {
                                await reCalculateRoute({ latitude, longitude });
                                prevSrcRef.current = {
                                    lat: latitude,
                                    long: longitude
                                };
                            }
                        }
                    }
                    updateSrcMarker(latitude, longitude);
                    console.log("Updated Source Marker");
                },
                (err) => {
                    console.log(`Some Error while watching position`);
                    console.log(err);
                }
            );
        };

        mapRef.current.once('moveend', startTracking);

        return (() => {
            mapRef.current.off('moveend', startTracking);
            if (watchPositionId !== null) {
                navigator.geolocation.clearWatch(watchPositionId);
                console.log("Cleared Watch Position Id");
            }
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
            destMarkerRef.current = new mapboxgl.Marker({ color: "black" })
                .setLngLat([destCoord.longitude, destCoord.latitude])
                .addTo(mapRef.current);
        }

        mapRef.current.on("load", async () => {
            try {
                const { route, totalTime, totalDistance } = await callRouteService(location, destCoord);
                console.log(route);
                setEtaDist(totalTime, totalDistance);

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
                console.log("Failed to fetch route : ", err);
                setRoutes([]);
                setRoutesAvailable(false);
                setAlertMessage(err);
                setAlertType("error");
            }
        });

        return (() => {
            mapRef.current.remove();
        });
    }, []);

    return (
        <>
            <div id='map-container' ref={mapContainerRef} style={{ height: "100vh" }} />

            {isNavigating && eta !== null && remainingDist !== null && (
                <div className="nav-dashboard" aria-label="Navigation status">
                    <div className="nav-dashboard__item">
                        <span className="nav-dashboard__icon">⏱</span>
                        <div className="nav-dashboard__info">
                            <span className="nav-dashboard__value">{Math.round(eta)}</span>
                            <span className="nav-dashboard__unit">{etaUnit}</span>
                        </div>
                    </div>
                    <div className="nav-dashboard__divider" />
                    <div className="nav-dashboard__item">
                        <span className="nav-dashboard__icon">📍</span>
                        <div className="nav-dashboard__info">
                            <span className="nav-dashboard__value">{Math.round(remainingDist)}</span>
                            <span className="nav-dashboard__unit">{distUnit}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="alerts">
                <Snackbar
                    open={hasArrived || alertMessage}
                    autoHideDuration={5000}
                    onClose={() => {
                        setHasArrived(false);
                        setAlertMessage(null);
                        setAlertType("");
                    }}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert severity={alertType} variant="filled" sx={{ width: "100%" }}>
                        {alertMessage}
                    </Alert>
                </Snackbar>
            </div>

            <div className="buttons">
                <button
                    id="home-btn"
                    className="map-icon-btn
                    home-btn"
                    onClick={() => {
                        setDestCoord("");
                        setDestCoordAvailable(false);
                        router("/home");
                    }}
                    title="Go Home"
                >
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
