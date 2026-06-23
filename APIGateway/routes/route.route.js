import "dotenv/config";
import { Router } from "express";
import httpStatus from "http-status";
import { createProxyMiddleware } from "http-proxy-middleware";
import jwt from "jsonwebtoken";

const router = Router();

const ROUTE_SERVICE_URL = process.env.ROUTE_SERVICE_URL;

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return (res.status(httpStatus.UNAUTHORIZED).json({ message: "Token Missing" }));
        }

        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_SECRET;

        jwt.verify(token, secret);
        next();
    } catch (err) {
        return (res.status(httpStatus.UNAUTHORIZED).json({ message: "Token Invalid or Expired" }));
    }
};

router.use((req, res, next) => {
    console.log(`Gateway forwarding request to ${req.method} -> ${req.url}`);
    next();
});

router.use(verifyToken, createProxyMiddleware({
    target: ROUTE_SERVICE_URL,
    changeOrigin: true,
    on: {
        proxyReq: (proxyReq, req, res) => {
            const newPath = `/api/v1/route${req.url}`;
            proxyReq.path = newPath;
        },
        error: (err, req, res) => {
            console.log(`Proxy Error : ${err.message}`);
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: err.message });
        }
    }
}));

export default router;
