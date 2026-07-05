import client from "../api/axiosInstance.jsx";

export const callTrafficService = (requireTraffic, location) => {
    const { latitude, longitude } = location;

    client.post("/traffic/update", {
        lat: latitude,
        long: longitude,
        traffic: requireTraffic
    }).catch((err) => {
        console.log(`Error in calling traffic service : ${err.response.data.message}`);
    });
};

export const callRouteService = async (location, dest) => {
    try {
        const { latitude, longitude } = location;
        const routeUrl = `/route?lat1=${latitude}&long1=${longitude}&lat2=${dest.latitude}&long2=${dest.longitude}`;

        const res = await client.get(routeUrl);
        return (res.data.path);
    } catch (err) {
        const errResponse = JSON.parse(err.request.response).message;
        console.log(`Failed to fetch route : ${errResponse}`);
        throw (errResponse);
    }
};
