import { createContext, useState } from "react";

export const LocationContext = createContext({});

export const LocationProvider = ({ children }) => {
    const [location, setLocation] = useState(null);
    const [locationAvailable, setLocationAvailable] = useState(null);

    const data = { location, setLocation, locationAvailable, setLocationAvailable };
    return (
        <LocationContext.Provider value={data}>
            {children}
        </LocationContext.Provider>
    );
};
