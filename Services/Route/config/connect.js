import "dotenv/config";
import neo4j from "neo4j-driver";

const URL = process.env.NEO4J_URL;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

let driver = neo4j.driver(
    URL,
    neo4j.auth.basic(user, password)
);

export default driver;
