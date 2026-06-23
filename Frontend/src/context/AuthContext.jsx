import { createContext, useState, useEffect } from "react";

import client from "../api/axiosInstance.jsx";

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    let [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleSignUp = async (name, username, email, password) => {
        try {
            let data = { name, username, email, password };
            let res = await client.post("/auth/signup", data);

            const accessToken = res.data.token;
            localStorage.setItem("accessToken", accessToken);
            setIsAuthenticated(true);

            return ({
                success: true,
                message: res.data.message
            });
        } catch (err) {
            return ({
                success: false,
                message: err.response?.data?.message || "Signup Failed"
            });
        }
    };

    const handleLogin = async (username, password) => {
        try {
            let data = { username, password };
            let res = await client.post("/auth/login", data);

            const accessToken = res.data.token;
            localStorage.setItem("accessToken", accessToken);
            setIsAuthenticated(true);

            return ({
                success: true,
                message: res.data.message
            });
        } catch (err) {
            console.log(err);
            return ({
                success: false,
                message: err.response?.data?.message || "Login Failed"
            });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        setIsAuthenticated(false);
    };

    useEffect(() => {
        const verify = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                if (!token) {
                    setIsAuthenticated(false);
                    return;
                }

                await client.get("/auth/verify");
                setIsAuthenticated(true);
            } catch (err) {
                console.log(err.response?.data?.message);
                localStorage.removeItem("accessToken");
                setIsAuthenticated(false);
            }
        };
        verify();
    }, []);

    const data = { isAuthenticated, setIsAuthenticated, handleSignUp, handleLogin, handleLogout };
    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};
