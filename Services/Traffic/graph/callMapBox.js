import "dotenv/config";
import axios from "axios";

export const getRealTravelTime = async (node1, node2) => {
    try {
        const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
        const URL = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${node1.long}%2C${node1.lat}%3B${node2.long}%2C${node2.lat}?access_token=${ACCESS_TOKEN}`;

        const result = await axios.get(URL);

        let route = result.data.routes[0];
        let {duration, distance} = route;

        let data = {
            duration : route.duration,
            distance : route.distance
        };
        return(data);
    } catch(err) {
        console.log("Some Error in fetching real travel time");
        throw(err);
    }
};