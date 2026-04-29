import {getBoundaryPoints, getDataPoints} from "./helper.js";

export const getNodesInPairs = async (lat, long, session) => {
    try {
        let boundaryPoints = getBoundaryPoints(lat, long);

        let closestPoints = [];
        for(let point of boundaryPoints) {
            let coord = await getDataPoints(point.lat, point.long, session);
            closestPoints.push(coord);
        }

        return(closestPoints);
    } catch(err) {
        console.log("Some error in getting all Nodes in Pairs");
        throw(err);
    }
};
