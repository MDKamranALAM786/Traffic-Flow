import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";

import "../../public/styles/landing.css";
import { AuthContext } from "../context/AuthContext.jsx";
import { LocationContext } from "../context/LocationContext.jsx";

export default function LandingPage() {
    const router = useNavigate();

    const { isAuthenticated, setIsAuthenticated, handleLogout } = useContext(AuthContext);
    const { getLocation } = useContext(LocationContext);

    const navigateToAuth = () => {
        router("/auth");
    };
    const navigateToHome = () => {
        router("/home");
    };

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        setIsAuthenticated(token ? true : false);
        getLocation();
    }, []);

    return (
        <div className="landing-container">
            <div className="navbar">
                <div className="nav-header">
                    <div className="nav-icon">
                        <img src="/assets/MarkerIcon.png" alt="Traffic Icon" />
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
                                <Button className="signup" variant="contained" onClick={navigateToAuth}>SignUp</Button>
                            </div>
                        </>
                    }
                </div>
            </div>
            <div className="landing-content">
                <div className="contents">
                    <div className="text-content">
                        <div className="text-header">
                            <h1>Welcome to Traffic Flow</h1>
                        </div>
                        <div className="text-body">
                            <p>
                                Navigate smarter with real-time traffic insights. <br />
                                Find the fastest route, avoid congestion, and reach your destination with ease.
                            </p>
                        </div>
                        <div className="route-btn">
                            {
                                isAuthenticated ? <>
                                    <div>
                                        <Button variant="contained" onClick={navigateToHome}>Get Started</Button>
                                    </div>
                                </> : <>
                                    <div>
                                        <Button variant="contained" onClick={navigateToAuth}>Get Started</Button>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                    <div className="image-content">
                        <img src="/assets/Globe.png" alt="Globe Image" />
                    </div>
                </div>
            </div>
        </div>
    );
};
