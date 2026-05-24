import axios from "axios";

export const callTrafficService = (requireTraffic, location) => {
    const { latitude, longitude } = location;

    const gatewayUrl = import.meta.env.VITE_GATEWAY_URL;
    const trafficUrl = `${gatewayUrl}/traffic/update`;

    axios.post(
        trafficUrl,
        {
            lat: latitude,
            long: longitude,
            traffic: requireTraffic
        }
    ).catch((err) => {
        console.log(`Error in calling traffic service : ${err.message}`);
    });
};

export const callRouteService = async (location, dest) => {
    try {
        const { latitude, longitude } = location;

        const gatewayUrl = import.meta.env.VITE_GATEWAY_URL;
        const routeUrl = `${gatewayUrl}/route?lat1=${latitude}&long1=${longitude}&lat2=${dest.latitude}&long2=${dest.longitude}`;

        const res = await axios.get(routeUrl);

        let { route } = res.data.path;
        return (route);
    } catch (err) {
        console.log(`Error in calling route service : ${err.message}`);
        return (null);
    }
};
