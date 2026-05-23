import { createContext, useState } from "react";

export const LocationContext = createContext({});

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState(null);
    const [locationAvailable, setLocationAvailable] = useState(null);

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

    const data = { location, setLocation, locationAvailable, setLocationAvailable, getLocation };
    return (
        <LocationContext.Provider value={data}>
            {children}
        </LocationContext.Provider>
    );
};
