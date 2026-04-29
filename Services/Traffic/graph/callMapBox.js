import "dotenv/config";
import axios from "axios";

export const getRealTravelTime = async (pairs) => {
    try {
        const ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
        let count = 0;
        for(let pair of pairs) {
            let {node1, node2} = pairs;
            let URL = `https://api.mapbox.com/directions/v5/mapbox/driving/${node1.long},${node1.lat};${node2.long},${node2.lat}?access_token=${ACCESS_TOKEN}`;

            let result = await axios.get(URL);
            console.log(result.data);
            console.log(++count);
        }
    } catch(err) {
        console.log("Some Error in fetching real travel time");
        throw(err);
    }
};