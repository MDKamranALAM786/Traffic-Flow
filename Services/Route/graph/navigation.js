import driver from "../config/connect.js";

import {getRoute} from "./getPaths.js";

export const navigate = async (lat1, long1, lat2, long2) => {
    const session = driver.session({database : "routing-project"});

    try {
        let shortestPath = await getRoute(lat1, long1, lat2, long2, session);

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
                    RETURN *
                `,
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
