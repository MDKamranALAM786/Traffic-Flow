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

    return (roadType || "street");
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
    if (tags?.maxspeed) {
        maxSpeed = parseFloat(tags.maxspeed);
    } else {
        let highway = tags?.highway;
        maxSpeed = speedMap[highway];
    }

    return (maxSpeed || 30);
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
    return (distance); // distance in km
};

export { getRoadType, getSpeed, getDistance };
