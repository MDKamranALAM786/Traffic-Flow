import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import axios from "axios";

import { AuthContext } from "../context/AuthContext.jsx";
import { LocationContext } from "../context/LocationContext.jsx";
import "../../public/styles/home.css";

export default function HomePage() {
    const router = useNavigate();

    const { isAuthenticated, setIsAuthenticated, handleLogout } = useContext(AuthContext);
    const { location, locationAvailable, getLocation, setDestCoord, destCoordAvailable, setDestCoordAvailable } = useContext(LocationContext);

    const [dest, setDest] = useState("");
    const [places, setPlaces] = useState([]);
    const [isSelected, setIsSelected] = useState(false);

    const navigateToAuth = () => {
        router("/auth");
    };

    const handleChange = (event) => {
        event.preventDefault();
        const { value } = event.target;
        setDest(value);
        setIsSelected(false);
    };

    const handleSubmit = async (event) => {
        try {
            event.preventDefault();

            if (!destCoordAvailable) {
                const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
                const URL = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(dest)}&proximity=${location.longitude}%2C${location.latitude}&access_token=${accessToken}`;
                const response = await axios.get(URL);
                const feature = response.data.features[0];

                let latitude = feature.properties.coordinates.latitude;
                let longitude = feature.properties.coordinates.longitude;
                setDestCoord({ latitude, longitude });
                setDestCoordAvailable(true);
            }

            setPlaces([]);
            setDest("");
            setIsSelected(false);

            router("/map");
        } catch (err) {
            console.log(`Some Error while finding location in maps : ${err.message}`);
            setPlaces([]);
            setDest("");
            setIsSelected(false);
            setDestCoord(null);
            setDestCoordAvailable(false);
        }
    };

    const handleSelectPlace = (place) => {
        setDest(place.full_address);
        setIsSelected(true);
        setPlaces([]);

        setDestCoord(place.coord);
        setDestCoordAvailable(true);
    };

    useEffect(() => {
        if (dest.length <= 5 || isSelected || !locationAvailable) {
            if (dest.length <= 5) {
                setPlaces([]);
            }
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
                const URL = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(dest)}&proximity=${location.longitude}%2C${location.latitude}&access_token=${accessToken}`;
                const results = await axios.get(URL);
                const suggestions = results.data.features;

                let placesList = [];
                for (let place of suggestions) {
                    let full_address = place.properties.full_address;
                    let latitude = place.properties.coordinates.latitude;
                    let longitude = place.properties.coordinates.longitude;
                    let coord = { latitude, longitude };

                    placesList.push({ full_address, coord });
                }

                console.log(placesList);
                setPlaces(placesList);
            } catch (err) {
                console.log(`Some Error while searching location suggestions : ${err.message}`);
                setPlaces([]);
            }
        }, 2000);
        return (() => {
            clearTimeout(timer);
            console.log("Cleared Timeout");
        });
    }, [dest, isSelected, locationAvailable]);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        setIsAuthenticated(token ? true : false);
        getLocation();
    }, []);

    const statusText = locationAvailable ? 'LOCATION DETECTED' : 'ENTER YOUR ROUTE';

    return (
        <div className="home-container">
            <div className="navbar">
                <div className="nav-header">
                    <div className="nav-icon">
                        <img src="/assets/MarkerIcon.png" alt="Marker Icon" />
                    </div>
                    <div className="nav-title">
                        <h2>
                            <span className="traffic">Traffic</span>
                            <span className="flow">Flow</span>
                        </h2>
                    </div>
                </div>
                <div className="nav-items">
                    {
                        isAuthenticated ? <>
                            <div className="nav-item">
                                <Button className="logout" variant="contained" onClick={handleLogout}>Logout</Button>
                            </div>
                        </> : <>
                            <div className="nav-item">
                                <Button className="login" variant="outlined" onClick={navigateToAuth}>Login</Button>
                            </div>
                            <div className="nav-item">
                                <Button className="signup" variant="contained" onClick={navigateToAuth}>Sign Up</Button>
                            </div>
                        </>
                    }
                </div>
            </div>

            <div className="home-content">
                <div className="sidebar">
                    <div className="text-header">
                        <div className="status-badge">
                            <span className="dot blue"></span> {statusText}
                        </div>
                        {
                            !isAuthenticated ? (
                                <>
                                    <h3>Login to start <span className="highlight">navigating</span></h3>
                                    <p className="subtext">Sign in to unlock real-time traffic insights and routing.</p>
                                </>
                            ) : (
                                <>
                                    <h3>Find the <span className="highlight">fastest route</span></h3>
                                    <p className="subtext">Enter your destination and we'll handle the rest.</p>
                                </>
                            )
                        }
                    </div>

                    <div className="search-space">
                        <Box className="search-box">
                            <Box className="input-box">
                                <div className="input-field-wrapper">
                                    <div className="input-label">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                        </svg> DESTINATION
                                    </div>
                                    <div className="input-relative-container">
                                        <TextField
                                            placeholder="Where to?"
                                            variant="outlined"
                                            name="destination"
                                            value={dest}
                                            onChange={handleChange}
                                            disabled={!isAuthenticated}
                                        />
                                        {/* Suggestions dropdown container positioned next to/below the text field */}
                                        {places.length > 0 && (
                                            <div className="suggestions-dropdown">
                                                {places.map((place, index) => (
                                                    <div
                                                        key={index}
                                                        className="suggestion-item"
                                                        onClick={() => handleSelectPlace(place)}
                                                    >
                                                        <svg className="suggestion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                        </svg>
                                                        <span className="suggestion-text">{place.full_address}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Box>
                            {isAuthenticated && !locationAvailable && (
                                <div className="location-warning-text">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                    <span>Grant Location to continue routing</span>
                                </div>
                            )}
                            <Box className="search-btn">
                                <Button
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={!isAuthenticated || !locationAvailable}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                        <polyline points="12 5 19 12 12 19"></polyline>
                                    </svg>
                                    Find Best Route
                                </Button>
                            </Box>
                        </Box>
                    </div>
                </div>

                <div className={`map-display ${!isAuthenticated ? 'dimmed' : ''}`}>
                    {
                        !isAuthenticated && (
                            <div className="overlay-card">
                                <div className="lock-icon-container">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                </div>
                                <h4>Sign in to navigate</h4>
                                <p>Access real-time traffic data and route suggestions</p>
                                <Button variant="contained" onClick={navigateToAuth}>Get started &rarr;</Button>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    );
}
