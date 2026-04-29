import httpStatus from "http-status";

import {changeTraffic, updateRealTrafficData} from "../graph/updateTraffic.js";

export const changeTrafficHandler = async (req, res) => {
    try {
        let {lat, long} = req.body;

        // let {hasChanged, message} = await changeTraffic(src, dest, newTime);
        const data = await updateRealTrafficData(Number(lat), Number(long));
        if(data) {
            return(res.status(httpStatus.OK).json(data));
        } else {
            return(res.status(httpStatus.NOT_FOUND).json({message : message}));
        }
    } catch(err) {
        console.log(`Error : ${err}`);
        return(res.status(httpStatus.INTERNAL_SERVER_ERROR).json({message : err.message}));
    }
};
