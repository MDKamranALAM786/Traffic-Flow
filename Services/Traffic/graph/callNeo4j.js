export const getDataPoints = async (lat, long, session) => {
    try {
        const result = await session.run(`
            MATCH (n:Intersection)
            WHERE n.lat > $lat-0.1 AND n.lat < $lat+0.1
              AND n.lon > $long-0.1 AND n.lon < $long+0.1
            WITH n AS target, point.distance(
                point({latitude : n.lat, longitude : n.lon}),
                point({latitude : $lat, longitude : $long})
            ) AS dist
            RETURN target, dist
            ORDER BY dist
            LIMIT 1`,
            {lat : lat, long : long}
        );

        let record = result.records[0];

        lat = record.get("target").properties.lat;
        long = record.get("target").properties.lon;

        let coord = {lat, long};
        return(coord);
    } catch(err) {
        console.log("Some Problem in getting nearest node to current location");
        throw(err);
    }
};

export const getNeighbours = async (lat, long, session) => {
    try {
        const result = await session.run(`
            MATCH (node1:Intersection)-[r:ROAD]->(node2:Intersection)
            WHERE node1.lat > $lat-0.0045 AND node1.lat < $lat+0.0045
              AND node1.lon > $long-0.0045 AND node1.lon < $long+0.0045
            AND node1.lat > $lat-0.0045 AND node1.lat < $lat+0.0045
              AND node1.lon > $long-0.0045 AND node1.lon < $long+0.0045
            RETURN node1.id AS id1, node1.lat AS lat1, node1.lon AS lon1,
                   node2.id AS id2, node2.lat AS lat2, node2.lon AS lon2`,
            {
                lat : lat,
                long : long
            }
        );

        const records = result.records;
        console.log(`Total records : ${records.length}`);

        const pairs = records.map((record) => {
            let node1 = {
                id : record.get("id1"),
                lat : record.get("lat1"),
                long : record.get("lon1")
            };

            let node2 = {
                id : record.get("id2"),
                lat : record.get("lat2"),
                long : record.get("lon2")
            };

            return({node1, node2});
        });

        console.log(`Total edges within boundary from curr location : ${pairs.length}`);
        return(pairs);
    } catch(err) {
        console.log("Some Problem in getting neighbouring node pairs");
        throw(err);
    }
};

export const addNewTraffic = async (newTravelTimes, session) => {
    try {
        const result = await session.run(`
            UNWIND $newTravelTimes as data
            MATCH (node1:Intersection {id : data.node1})
            MATCH (node2:Intersection {id : data.node2})

            MATCH (node1)-[r:ROAD]->(node2)
            SET r.travel_time = data.travelTime
            
            RETURN COUNT(r) AS totalEdges`,
            {newTravelTimes : newTravelTimes}
        );

        const count = result.records.length;
        console.log("Toatl Records : ", count);

        const value = result.records[0].get("totalEdges").toNumber();
        console.log("Total edges updated : ", value);

        return(value);
    } catch(err) {
        console.log("Error in updating travel times after receiving from MapBox");
        throw(err);
    }
};
