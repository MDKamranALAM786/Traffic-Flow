import "dotenv/config";
import express from "express";
import cors from "cors";
import httpStatus from "http-status";

import router from "./routes/route.js";

const app = express();

const allowedOrigins = [
    process.env.ALLOWED_ORIGIN,
    "http://localhost:5173"
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS : Origin Not Allowed"));
        }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.set("port", (process.env.PORT || 8080));

app.use((req, res, next) => {
    console.log("Gateway Received : ", req.method, req.url);
    next();
});

app.use("/api/v1", router);

app.use((err, req, res, next) => {
    const status = err.status || httpStatus.INTERNAL_SERVER_ERROR;
    return (res.status(status).json({ message: err.message }));
});

app.listen(app.get("port"), () => {
    console.log(`API Gateway running on port ${app.get("port")}`);
});
