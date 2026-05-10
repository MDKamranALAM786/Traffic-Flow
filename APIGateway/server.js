import "dotenv/config";
import express from "express";
import cors from "cors";

import router from "./routes/route.js";

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));
app.set("port", (process.env.PORT || 8080));

app.use((req, res, next) => {
    console.log("Gateway Received : ", req.method, req.url);
    next();
});

app.use("/api/v1", router);

app.listen(app.get("port"), () => {
    console.log(`API Gateway running on port ${app.get("port")}`);
});
