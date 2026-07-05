import axios from "axios";

const BASE_URL = import.meta.env.VITE_GATEWAY_URL;
const client = axios.create({
    baseURL: BASE_URL
});

client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return (config);
    },
    (err) => {
        return (Promise.reject(err));
    }
);

client.interceptors.response.use(
    (config) => {
        return (config);
    },
    (err) => {
        const errStatus = err.response?.status;
        if (errStatus && errStatus === 401) {
            localStorage.removeItem("accessToken");
            if (!err.config.skipInterceptor) {
                window.location.href = "/auth";
            }
        }
        return (Promise.reject(err));
    }
);

export default client;
