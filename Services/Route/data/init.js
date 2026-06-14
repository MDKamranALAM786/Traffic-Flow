import driver from "../config/connect.js";
import { getRoadType, getSpeed, getDistance } from "./helper.js";

const nodeMap = {};
const BATCH_SIZE = 1000;

export const createNodes = async (nodes) => {
    const session = driver.session({ database: "routing-project" });

    try {
        for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
            let batch = nodes.slice(i, i + BATCH_SIZE).map((node) => {
                nodeMap[node.id] = [node.lat, node.lon];
                return ({
                    id: node.id,
                    lat: node.lat,
                    lon: node.lon
                });
            });

            const result = await session.run(`
                UNWIND $batch AS node
                CREATE(:Intersection {id:node.id, lat:node.lat, lon:node.lon})
                RETURN COUNT(node) AS nodesCreated
            `, { batch });
        }

        console.log("Nodes Created Successfully");
    } catch (err) {
        console.log("Error in creating nodes");
        throw (err);
    } finally {
        await session.close();
    }
};

export const createRoads = async (roads) => {
    const session = driver.session({ database: "routing-project" });

    try {
        let edges = [];
        for (let road of roads) {
            let { type, id, nodes, tags } = road;

            // check the road type and speed
            let roadType = getRoadType(tags);
            let maxSpeed = getSpeed(tags);

            let oneWay = tags?.oneway === "yes";

            for (let i = 1; i < nodes.length; i++) {
                let start = nodes[i - 1];
                let end = nodes[i];
                if (!nodeMap[start] || !nodeMap[end]) {
                    continue;
                }

                // get distance between these two nodes on earth
                let node1 = nodeMap[start];
                let node2 = nodeMap[end];
                let distance = getDistance(node1[0], node1[1], node2[0], node2[1]);

                let time = (distance / maxSpeed) * 60;

                edges.push({ id1: start, id2: end, roadId: id, type: roadType, dist: distance, speed: maxSpeed, time });
                if (!oneWay) {
                    edges.push({ id1: end, id2: start, roadId: id, type: roadType, dist: distance, speed: maxSpeed, time });
                }
            }
        }

        for (let i = 0; i < edges.length; i += BATCH_SIZE) {
            let batch = edges.slice(i, i + BATCH_SIZE);
            const result = await session.run(`
                UNWIND $batch AS edge
                MATCH (start:Intersection {id:edge.id1})
                MATCH (end:Intersection {id:edge.id2})

                CREATE (start)-[:ROAD {
                    id:edge.roadId,
                    type:edge.type,
                    distance:edge.dist,
                    base_time:edge.time,
                    travel_time:edge.time,
                    traffic_factor:1,
                    maxSpeed:edge.speed
                }]->(end)

                RETURN COUNT(edge) AS edgesCreated
            `, { batch });
        }

        console.log("Roads Created Successfully");
    } catch (err) {
        console.log("Error in creating roads");
        throw (err);
    } finally {
        await session.close();
    }
};

export const clearDatabase = async () => {
    const session = driver.session({ database: "routing-project" });

    try {
        await session.run(`MATCH (n) DETACH DELETE n`);
        console.log("Database Cleared");
        await session.run(`CREATE INDEX intersection_id IF NOT EXISTS FOR (n:Intersection) ON (n.id)`);
    } catch (err) {
        console.log(`Error in Clearing Database : ${err}`);
    } finally {
        await session.close();
    }
};
