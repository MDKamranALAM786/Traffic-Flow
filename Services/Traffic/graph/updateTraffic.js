import driver from "../config/connect.js";
import axios from "axios";

import {getNodesInPairs} from "./callNeo4j.js";
import {getRealTravelTime} from "./callMapBox.js";
import {getDataPoints} from "./helper.js";

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

        const boundaryPoints = await getNodesInPairs(lat, long, session);
        console.log(`Total Boundary Points : ${boundaryPoints.length}`);
        const ROUTE_SERVICE = process.env.ROUTE_SERVICE_URL;

        let count = 0;
        
        for(let point of boundaryPoints) {
            let targetURL = `${ROUTE_SERVICE}?lat1=${lat}&long1=${long}&lat2=${point.lat}&long2=${point.long}`;
            let route = await axios.get(targetURL);
            let pathData = route.data.path.route;

            console.log(`Total Intersections in this route : ${pathData.length}`);
            console.log(pathData);

            for(let i=1;i<pathData.length;i++) {
                let node1 = pathData[i-1];
                let node2 = pathData[i];
                let {duration, distance} = await getRealTravelTime(node1, node2);

                const result = await session.run(`
                    MATCH (node1:Intersection {lat:$lat1, lon:$long1})
                    MATCH (node2:Intersection {lat:$lat2, lon:$long2})
                    MATCH (node1)-[r:ROAD]->(node2)
                    WITH r
                    SET r.distance = $dist, r.travel_time = $duration
                    RETURN COUNT(r) AS count`,
                    {
                        lat1 : node1.lat,
                        long1 : node1.long,
                        lat2 : node2.lat,
                        long2 : node2.long,
                        duration : duration,
                        dist : distance
                    }
                );

                let count = result.records[0].get("count").toNumber();
                if(!count || count === 0) {
                    console.log("Some problem occured while updating real travel time");
                    console.log(count);
                }
            }

            console.log("Updation Done for point");
            console.log(point);
            console.log(++count);
        }

        let data = {};
        if(count === 360) {
            data.hasChanged = true;
            data.message = "All Roads Travel Time updated Successfully with Real Data";
        } else {
            data.hasChanged = false;
            data.message = "Not All Roads Travel Time updated";
        }

        return(data);
    } catch(err) {
        console.log("Some Error in updating real time traffic data");
        throw(err);
    }
};
