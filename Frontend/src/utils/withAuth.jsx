import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext.jsx";

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const router = useNavigate();
        const { isAuthenticated } = useContext(AuthContext);

        useEffect(() => {
            if (!isAuthenticated) {
                router("/auth");
            }
        }, [isAuthenticated]);

        return (isAuthenticated ? <WrappedComponent {...props} /> : null);
    };

    return (AuthComponent);
};

export default withAuth;
