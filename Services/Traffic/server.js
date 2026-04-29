import "dotenv/config";
import express from "express";

import driver from "./config/connect.js";
import router from "./routes/traffic.route.js";
import {runSimulation} from "./graph/trafficSimulation.js";

const app = express();
app.set("port", (process.env.PORT || 5003));

app.use(express.urlencoded({extended : true}));
app.use(express.json());
const baseApi = "/api/v1";
app.use(`${baseApi}/traffic`, router);

let verifyConnection = async () => {
    try {
        await driver.verifyConnectivity();
        console.log("Connection Successfull");
    } catch(err) {
        console.log(`Connection Error\n${err}`);
        console.log(`Cause : ${err.cause}`);
        process.exit(1);
    }
};

const start = async () => {
    try {
        await verifyConnection();
        app.listen(app.get("port"), () => {
            console.log(`Server is running on port ${app.get("port")}`);
        });
    } catch(err) {
        console.log("Server Startup Failed");
        console.log(err);
    }
};

const executeSimulation = async () => {
    try {
        await runSimulation();
        console.log("Traffic Simulation Processed");
    } catch(err) {
        console.log("Traffic Simulation Failed");
        throw(err);
    }
};

let interval = 1.5 * 60 * 1000;
let isRunning = false;

const startSimulation = async () => {
    try {
        await executeSimulation();
    } catch(err) {
        console.log("Simulation Failed");
        throw(err);
    }

    setInterval(async () => {
        if(isRunning) {
            return;
        }

        isRunning = true;
        try {
            await executeSimulation();
        } catch(err) {
            console.group("Error caught in setInterval()");
        } finally {
            isRunning = false;
        }
    }, interval);
};

await start();
// await startSimulation();
