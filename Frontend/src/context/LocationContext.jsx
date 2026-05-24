import { createContext, useState, useEffect, useRef } from "react";

import { callTrafficService } from "../utils/ServiceCall.jsx";

export const LocationContext = createContext({});

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState(null);
    const [locationAvailable, setLocationAvailable] = useState(null);

    const hasMadeFirstCall = useRef(false);
    const currLocation = useRef(location);

    const getLocation = () => {
        if (navigator.geolocation && locationAvailable !== true) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ latitude, longitude });
                    setLocationAvailable(true);
                },
                (error) => {
                    console.log(`Error in retrieving location : ${error.mesage}`);
                    setLocationAvailable(false);
                }
            );
        }
    };

    useEffect(() => {
        currLocation.current = location;
    }, [location]);

    useEffect(() => {
        if (locationAvailable && currLocation.current) {
            if (!hasMadeFirstCall.current) {
                callTrafficService(false, currLocation.current);
                hasMadeFirstCall.current = true;
            }

            const intervalId = setInterval(() => {
                callTrafficService(true, currLocation.current);
            }, 300000);

            return () => {
                clearInterval(intervalId);
                console.log("Stopped sending traffic updates...");
                console.log(`Stopped Interval Id : ${intervalId}`);
            };
        }
    }, [locationAvailable]);

    const data = { location, setLocation, locationAvailable, setLocationAvailable, getLocation };
    return (
        <LocationContext.Provider value={data}>
            {children}
        </LocationContext.Provider>
    );
};
