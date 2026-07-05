import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext.jsx";

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const router = useNavigate();
        const { isAuthenticated, handleLogout } = useContext(AuthContext);

        const isTokenExpired = () => {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                return (true);
            }
            const decode = JSON.parse(atob(token.split(".")[1]));
            return (decode.exp * 1000 < Date.now());
        };

        useEffect(() => {
            if (!isAuthenticated || isTokenExpired()) {
                handleLogout();
                router("/auth");
            }
        }, [isAuthenticated]);

        return (isAuthenticated ? <WrappedComponent {...props} /> : null);
    };

    return (AuthComponent);
};

export default withAuth;
