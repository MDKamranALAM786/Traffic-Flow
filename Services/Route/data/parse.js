import fs from "fs";

import {createNodes, createRoads} from "./init.js";

const rawData = fs.readFileSync("./data/Kolkata.json", "utf-8");
const osmData = JSON.parse(rawData);

let elements = osmData.elements;
console.log(elements[0]);
console.log(elements[elements.length-1]);

let nodes = elements.filter((element) => (element.type === "node"));
let roads = elements.filter((element) => (element.type === "way"));

try {
    await createNodes(nodes);
    await createRoads(roads);
    console.log("Initialization Successfull");
} catch(err) {
    console.log("Some Error Occurred");
    console.log(err);
}

process.exit(1);
