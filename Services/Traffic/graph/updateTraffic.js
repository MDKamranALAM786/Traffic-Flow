import driver from "../config/connect.js";
import axios from "axios";

import {getDataPoints, getNeighbours, addNewTraffic} from "./callNeo4j.js";
import {getRealTravelTime} from "./callMapBox.js";
import {sleep} from "./helper.js";

export const changeTraffic = async (src, dest, newTime) => {
    let session = driver.session({database : "routing-project"});

    try {
        const result = await session.run(`
            MATCH (:Intersection {name:$src})-[r:ROAD]->(:Intersection {name:$dest})
            WITH r
            SET r.travel_time = r.travel_time + $newTime
            RETURN r`,
            {src : src, dest : dest, newTime : newTime}
        );

        let hasChanged, message;
        if(!result.records || result.records.length === 0) {
            hasChanged = false;
            message = "No Roads Found!";
        } else {
            hasChanged = true;
            message = "Travel Time changed Successfully!";
        }

        let finalResult = {
            hasChanged : hasChanged,
            message : message
        };

        return(finalResult);
    } catch(err) {
        console.log(`Error : ${err.cause}`);
    } finally {
        await session.close();
    }
};

export const updateAllTraffic = async (congestionLevels) => {
    let session = driver.session({database : "routing-project"});

    try {
        let {highway, main_road, streets} = congestionLevels;
        const result = await session.run(`
            MATCH (a:Intersection)-[r:ROAD]->(b:Intersection)
            WITH r,
                CASE
                    WHEN r.type = "highway" THEN $highway
                    WHEN r.type = "main" THEN $main
                    WHEN r.type = "street" THEN $streets
                    ELSE 1.0
                END AS baseFactor
            WITH r,
                baseFactor + ((rand() - 0.5) * 0.4) AS finalFactor
            SET r.traffic_factor = finalFactor,
                r.travel_time = r.base_time * finalFactor
            RETURN COUNT(r) AS updated`,
            {
                highway : highway,
                main : main_road,
                streets : streets
            }
        );
        
        let hasChanged, message;
        let countUpdated = Number(result.records[0].get("updated"));
        if(countUpdated > 0) {
            hasChanged = true;
            message = "Travel Time for all Roads changed successfully";
        } else {
            hasChanged = false;
            message = "No Roads Found!";
        }

        let finalResult = {
            hasChanged : hasChanged,
            message : message
        }

        return(finalResult);
    } catch(err) {
        console.log(`Error : ${err.cause}`);
        return({
            hasChanged : false,
            message : "Traffic updated failed!"
        });
    } finally {
        await session.close();
    }
};

export const updateRealTrafficData = async (lat, long) => {
    const session = driver.session({database : "routing-project"});

    try {
        const coord = await getDataPoints(lat, long, session);
        lat = coord.lat;
        long = coord.long;

        const neighbourPairs = await getNeighbours(lat, long, session);
        console.log(`Total edges within boundary from curr location : ${neighbourPairs.length}`);

        let unprocessedEdges = new Set();
        for(let i=0;i<neighbourPairs.length;i++) {
            unprocessedEdges.add(i);
        }

        let processedEdges = new Set();
        let nodes = new Map();

        let newTravelTimes = [];
        let chunkCount = 0;

        while(unprocessedEdges.size !== 0) {
            console.log(`Processing chunk ${++chunkCount}`);
            // pick 10 unique nodes
            for(let edge of unprocessedEdges) {
                let {node1, node2} = neighbourPairs[edge];

                const hasNode1 = nodes.has(node1.id);
                const hasNode2 = nodes.has(node2.id);

                const slotsNeeded = (hasNode1 ? 0 : 1) + (hasNode2 ? 0 : 1);
                if(nodes.size + slotsNeeded <= 10) {
                    if(!hasNode1) nodes.set(node1.id, node1);
                    if(!hasNode2) nodes.set(node2.id, node2);
                    processedEdges.add(edge);
                }
            }

            newTravelTimes = await getRealTravelTime(neighbourPairs, processedEdges, nodes, newTravelTimes);

            await sleep(1000);

            // remove the processed edges for the remaining edges to be processed
            for(let edge of processedEdges) {
                unprocessedEdges.delete(edge);
            }

            // remove all processed edges and nodes for next fresh data
            processedEdges.clear();
            nodes.clear();
        }
        console.log(`Total Chunks : ${chunkCount}`);
        console.log(newTravelTimes);

        const totalUpdates = await addNewTraffic(newTravelTimes, session);
        let response = {};
        if(totalUpdates !== 0) {
            response.hasChanged = true;
            response.message = "Traffic aware Travel Time successfull";
        } else {
            response.hasChanged = false;
            response.message = "Traffic aware Travel Time unsuccessfull";
        }

        return(response);
    } catch(err) {
        console.log("Some Error in updating real traffic data");
        throw(err);
    } finally {
        await session.close();
    }
};
