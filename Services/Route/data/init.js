import driver from "../config/connect.js";

const nodeMap = {};

export const createNodes = async (nodes) => {
    const session = driver.session({database : "routing-project"});

    try {
        for(let node of nodes) {
            let {type, id, lat, lon} = node;
            nodeMap[id] = [lat, lon];

            const result = await session.run(`
                CREATE (:Intersection {id:$id, lat:$lat, lon:$lon})`,
                {
                    type : type,
                    id : id,
                    lat : lat,
                    lon : lon
                }
            );
        }

        console.log("Nodes Created Successfully");
    } catch(err) {
        console.log("Error in creating nodes");
        throw(err);
    } finally {
        await session.close();
    }
};

export const createRoads = async (roads) => {
    const session = driver.session({database : "routing-project"});

    try {
        for(let road of roads) {
            let {type, id, nodes, tags} = road;

            // check the road type and speed
            let roadType = getRoadType(tags);
            let maxSpeed = getSpeed(tags);

            let oneWay = tags?.oneway === "yes";

            for(let i=1;i<nodes.length;i++) {
                let start = nodes[i-1];
                let end = nodes[i];
                if(!nodeMap[start] || !nodeMap[end]) {
                    continue;
                }

                // get distance between these two nodes on earth
                let node1 = nodeMap[start];
                let node2 = nodeMap[end];
                let distance = getDistance(node1[0], node1[1], node2[0], node2[1]);

                let time = (distance / maxSpeed) * 60;

                const result = await session.run(`
                    MATCH (start:Intersection {id:$id1})
                    MATCH (end:Intersection {id:$id2})
                    CREATE (start)-[r:ROAD {id:$roadId, type:$type, distance:$dist, base_time:$time, travel_time:$time, traffic_factor:1, maxSpeed:$speed}]->(end)
                    RETURN r AS road`,
                    {
                        id1 : start,
                        id2 : end,
                        roadId : id,
                        type : roadType,
                        dist : distance,
                        speed : maxSpeed,
                        time : time
                    }
                );

                if(!oneWay) {
                    await session.run(`
                        MATCH (start:Intersection {id:$id1})
                        MATCH (end:Intersection {id:$id2})
                        CREATE (end)-[r:ROAD {id:$roadId, type:$type, distance:$dist, base_time:$time, travel_time:$time, traffic_factor:1, maxSpeed:$speed}]->(start)
                        RETURN r AS road`,
                        {
                            id1 : start,
                            id2 : end,
                            roadId : id,
                            type : roadType,
                            dist : distance,
                            speed : maxSpeed,
                            time : time
                        }
                    );
                }
            }
        }

        console.log("Roads Created Successfully");
    } catch(err) {
        console.log("Error in creating roads");
        throw(err);
    } finally {
        await session.close();
    }
};

const getRoadType = (tags) => {
    const typeMap = {
        motorway: "highway",
        primary: "main",
        secondary: "main",
        tertiary: "main",
        residential: "street",
        service: "street"
    };

    let highway = tags?.highway;
    let roadType = typeMap[highway];

    return(roadType || "street");
};

const getSpeed = (tags) => {
    const speedMap = {
        motorway: 70,
        primary: 50,
        secondary: 40,
        tertiary: 35,
        residential: 25,
        service: 15
    };

    let maxSpeed;
    if(tags?.maxspeed) {
        maxSpeed = parseFloat(tags.maxspeed);
    } else {
        let highway = tags?.highway;
        maxSpeed = speedMap[highway];
    }

    return(maxSpeed || 30);
};

const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km

    const toRad = (deg) => deg * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) *
              Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return(distance); // distance in km
};
