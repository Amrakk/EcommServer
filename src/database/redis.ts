import { Redis } from "ioredis";
import { REDIS_URI } from "../constants.js";

const redis = new Redis(REDIS_URI, { lazyConnect: true, enableAutoPipelining: true });

const init = async () => {
    try {
        await redis.connect();

        console.log("Cache connected");
    } catch (err) {
        console.log(err);
    }
};

const close = async () => {
    try {
        await redis.quit();
        console.log("Cache disconnected");
    } catch (err) {
        console.log(err);
    }
};

const getRedis = () => {
    if (redis.status !== "ready") throw new Error("Cache not initialized");
    return redis;
};

export default { init, close, getRedis };
