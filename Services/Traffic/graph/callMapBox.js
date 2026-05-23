import "dotenv/config";

import { axiosWithRetry } from "./helper.js";

export const getRealTravelTime = async (neighbourPairs, processedEdges, nodeMap, newTravelTimes, requireTraffic) => {
    try {
        let nodePos = {};
        let idx = 0;

        let nodeIds = [];
        let dataPoints = [];
        for (let [key, value] of nodeMap) {
            nodeIds.push(key);
            dataPoints.push(value);

            nodePos[key] = idx++;
        }

        const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
        let callType = requireTraffic ? "-traffic" : "";
        let url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving${callType}/`;
        dataPoints.forEach((point) => {
            let lat = point.lat;
            let long = point.long;
            url += `${long},${lat};`;
        });
        url = url.slice(0, -1) + `?access_token=${ACCESS_TOKEN}`;

        const result = await axiosWithRetry(url);
        const { durations } = result.data;

        for (let edge of processedEdges) {
            let { node1, node2 } = neighbourPairs[edge];

            let node1Pos = nodePos[node1.id];
            let node2Pos = nodePos[node2.id];
            let travelTime = durations[node1Pos][node2Pos];

            newTravelTimes.push({
                node1: node1.id,
                node2: node2.id,
                travelTime
            });
        }

        return (newTravelTimes);
    } catch (err) {
        console.log("Some Error in fetching real travel time");
        throw (err);
    }
};
