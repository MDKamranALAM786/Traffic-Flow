import driver from "../config/connect.js";

export const projectGraph = async (session) => {
    try {
        let check = await session.run(`
            CALL gds.graph.exists("roadGraph")
        `);

        let projected = check.records.length != 0 && check.records[0].get("exists");
        console.log(`Projected : ${projected}`);
        if(projected) {
            await session.run(`
                CALL gds.graph.drop("roadGraph");
            `);
        }

        await session.run(`
            CALL gds.graph.project(
                "roadGraph",
                "Intersection",
                {
                    ROAD : {
                        properties : "travel_time"
                    }
                }
            );
        `);
    } catch(err) {
        console.log("Error in Projecting Graph");
        throw(err);
    }
};

export const getRoute = async (lat1, long1, lat2, long2, session) => {
    try {
        await projectGraph(session);

        const ids = await session.run(`
            MATCH (src:Intersection {lat:$lat1, lon:$long1})
            MATCH (dest:Intersection {lat:$lat2, lon:$long2})
            RETURN src.id AS id1, dest.id AS id2`,
            {
                lat1 : Number(lat1),
                long1 : Number(long1),
                lat2 : Number(lat2),
                long2 : Number(long2)
            }
        );
        let id1 = ids.records[0].get("id1");
        let id2 = ids.records[0].get("id2");

        console.log(id1);
        console.log(id2);

        const result = await session.run(`
            MATCH (source:Intersection {id:$src})
            MATCH (destination:Intersection {id:$dest})

            CALL gds.shortestPath.dijkstra.stream("roadGraph", {
                sourceNode : source,
                targetNode : destination,
                relationshipWeightProperty : "travel_time"
            })
            YIELD totalCost, nodeIds

            RETURN totalCost, nodeIds;`,
            {src : id1, dest : id2}
        );
        console.log("Result");
        console.log(result);
        
        let record = result.records[0];
        if(!record) {
            console.log("No Route Found");
            return(null);
        }

        let totalTime = record.get("totalCost");
        const nodeIds = record.get("nodeIds");

        const pathResult = await session.run(`
            UNWIND $nodeIds AS id
            MATCH (n:Intersection)
            WHERE id(n) = id
            RETURN n.id AS id`,
            {nodeIds : nodeIds}
        );
        let names = pathResult.records;

        let nodes = [];
        names.forEach((name) => {
            nodes.push(name.get("id"));
        });

        let shortestPath = {
            route : nodes,
            totalTime : totalTime
        };
        console.log(shortestPath);

        return(shortestPath);
    } catch(err) {
        console.log(`Error in getPaths : ${err}`);
        throw(err);
    }
};
