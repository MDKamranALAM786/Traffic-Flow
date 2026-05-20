import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

import { AuthContext } from "../context/AuthContext.jsx";
import { LocationContext } from "../context/LocationContext.jsx";
import "../../public/styles/home.css";

export default function HomePage() {
    const router = useNavigate();

    const { isAuthenticated, setIsAuthenticated, handleLogout } = useContext(AuthContext);
    const { location, setLocation, locationAvailable, setLocationAvailable } = useContext(LocationContext);

    const [src, setSrc] = useState("");
    const [dest, setDest] = useState("");

    const navigateToAuth = () => {
        router("/auth");
    };

    const handleChange = (event) => {
        event.preventDefault();
        const { name, value } = event.target;
        if (name === "source") {
            setSrc(value);
        } else {
            setDest(value);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        router("/map");
    };

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        setIsAuthenticated(token ? true : false);

        if(navigator.geolocation && locationAvailable !== true) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const {latitude, longitude} = position.coords;
                    setLocation({latitude, longitude});
                    setLocationAvailable(true);
                },
                (error) => {
                    console.log(`Error in fetching location : ${error.message}`);
                    setLocationAvailable(false);
                }
            );
        }
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
                                {
                                    !locationAvailable && (
                                        <div className="input-field-wrapper">
                                            <div className="input-label">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#3b82f6" stroke="none">
                                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                                </svg> SOURCE
                                            </div>
                                            <TextField
                                                placeholder="Starting point"
                                                variant="outlined"
                                                name="source"
                                                value={src}
                                                onChange={handleChange}
                                                disabled={!isAuthenticated}
                                            />
                                        </div>
                                    )
                                }
                                <div className="input-field-wrapper">
                                    <div className="input-label">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                        </svg> DESTINATION
                                    </div>
                                    <TextField
                                        placeholder="Where to?"
                                        variant="outlined"
                                        name="destination"
                                        value={dest}
                                        onChange={handleChange}
                                        disabled={!isAuthenticated}
                                    />
                                </div>
                            </Box>
                            <Box className="search-btn">
                                <Button
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={!isAuthenticated}
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
