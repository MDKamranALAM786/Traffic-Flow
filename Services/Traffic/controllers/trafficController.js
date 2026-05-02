import httpStatus from "http-status";

import {changeTraffic, updateRealTrafficData} from "../graph/updateTraffic.js";

export const changeTrafficHandler = async (req, res) => {
    try {
        let {lat, long} = req.body;

        if(!lat || !long) {
            return(res.status(httpStatus.BAD_REQUEST).json({message : "Latitude and Longitude are required"}));
        }

        const {hasChanged, message} = await updateRealTrafficData(Number(lat), Number(long));
        if(hasChanged) {
            return(res.status(httpStatus.OK).json({message : message}));
        } else {
            return(res.status(httpStatus.NOT_FOUND).json({message : message}));
        }
    } catch(err) {
        console.log(`Error : ${err}`);
        return(res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message : err.message}));
    }
};
