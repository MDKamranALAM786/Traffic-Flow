import axios from "axios";

export const sleep = (ms) => (
    new Promise((resolve) => (
        setTimeout(resolve, ms)
    ))
);

export const axiosWithRetry = async (url, retries=3, delay=1000) => {
    for(let i=0;i<retries;i++) {
        try {
            return(await axios.get(url));
        } catch(err) {
            if(err.response?.status === 429 && i < retries) {
                const waitTime = delay * Math.pow(2, i);
                console.log(`Rate Limited.\nRetrying in ${waitTime}ms`);
                await sleep(waitTime);
            } else {
                console.log("Some Error in retrying axios");
                throw(err);
            }
        }
    }
};
