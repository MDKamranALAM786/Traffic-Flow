import { Router } from "express";
import httpStatus from "http-status";
import { createProxyMiddleware } from "http-proxy-middleware";

const router = Router();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

router.use((req, res, next) => {
    console.log(`Gateway forwarding request to ${req.method} -> ${req.url}`);
    next();
});

router.use(createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    on: {
        proxyReq: (proxyReq, req, res) => {
            const newPath = `/api/v1/auth${req.url}`;
            proxyReq.path = newPath;
        },
        error: (err, req, res) => {
            console.log(`Proxy Error : ${err.message}`);
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: err.message });
        }
    }
}));

export default router;
