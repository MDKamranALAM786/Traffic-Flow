export const getBoundaryPoints = (lat, long) => {
    const radius = 1000;
    const lat_origin_rad = lat * (Math.PI / 180);

    let boundaryPoints = [];

    for(let deg = 0; deg < 360; deg++) {
        let theta = deg * (Math.PI / 180);

        let targetLat = lat + (radius / 111000) * Math.sin(theta);
        let targetLong = long + (radius / (111000 * Math.cos(lat_origin_rad))) * Math.cos(theta);

        boundaryPoints.push({
            lat : targetLat,
            long : targetLong
        });
    }

    return(boundaryPoints);
};

export const getDataPoints = async (lat, long, session) => {
    try {
        const result = await session.run(`
            MATCH (n:Intersection)
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
        console.log("Some Problem in getting nearest data points to the destined boundary");
        throw(err);
    }
};
