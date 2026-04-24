import driver from "../config/connect.js";

import {getRoute} from "./getPaths.js";

export const navigate = async (lat1, long1, lat2, long2) => {
    const session = driver.session({database : "routing-project"});

    try {
        let src = await getDataPoint(lat1, long1, session);
        let dest = await getDataPoint(lat2, long2, session);

        let shortestPath = await getRoute(src.lat, src.long, dest.lat, dest.long, session);

        if(!shortestPath) {
            console.log("No Route Found");
            return(null);
        }

        let {route, totalTime} = shortestPath;

        let steps = [];
        let from = route[0];

        for(let i=1;i<route.length;i++) {
            let to = route[i];

            const result = await session.run(`
                MATCH (start:Intersection {id:$start})-[r:ROAD]->(end:Intersection {id:$end})
                WITH r.type AS type, r.distance AS distance, r.travel_time AS time
                RETURN *`,
                {start : from, end : to}
            );

            let distance = Number(result.records[0].get("distance"));
            let time = Number(result.records[0].get("time"));
            let type = result.records[0].get("type");

            let instruction;
            if(type === "highway") {
                instruction = `Take highway from ${from} to ${to}`;
            } else if(type === "main") {
                instruction = `Continue on main road from ${from} to ${to}`;
            } else {
                instruction = `Go via street from ${from} to ${to}`;
            }

            let path = {
                from,
                to,
                instruction,
                distance : `${distance}Km`,
                time : `${time}min`
            };
            steps.push(path);

            from = to;
        }

        let finalPath = {route, steps, totalTime};
        console.log(finalPath);

        return(finalPath);
    } catch(err) {
        console.log(`Error in navigate function : ${err}`);
        return(null);
    } finally {
        await session.close();
    }
};

const getDataPoint = async (lat, long, session) => {
    try {
        const result = await session.run(`
            MATCH (n:Intersection)
            WITH n AS target, point.distance(
                point({latitude : n.lat, longitude : n.lon}),
                point({latitude : $lat, longitude : $long})
            ) AS dist
            RETURN target, dist
            ORDER BY dist
            LIMIT 1`,
            {lat : Number(lat), long : Number(long)}
        );

        let record = result.records[0];

        lat = record.get("target").properties.lat;
        long = record.get("target").properties.lon;

        let coord = {lat, long};
        return(coord);
    } catch(err) {
        console.log("Some Problem in getting nearest Data Points to the exact location");
        throw(err);
    }
};
