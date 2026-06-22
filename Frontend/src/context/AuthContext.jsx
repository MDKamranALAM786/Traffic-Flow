import axios from "axios";
import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext({});

const BASE_URL = import.meta.env.VITE_GATEWAY_URL;
const client = axios.create({
    baseURL: `${BASE_URL}/auth`
});

export const AuthProvider = ({ children }) => {
    let [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleSignUp = async (name, username, email, password) => {
        try {
            let data = { name, username, email, password };
            let res = await client.post("/signup", data);

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
            let res = await client.post("/login", data);

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
                message: err.response?.data?.message || "Login Failed"
            });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        setIsAuthenticated(false);
    };

    const data = { isAuthenticated, setIsAuthenticated, handleSignUp, handleLogin, handleLogout };
    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};
