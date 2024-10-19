import redis from "../database/redis.js";
import { formatDuration } from "./formatDuration.js";
import { VALIDATE_CODE_RATE_LIMIT, VALIDATE_CODE_RATE_LIMIT_TIME } from "../constants.js";

import TooManyRequestsError from "../errors/TooManyRequests.js";

import type { ObjectId } from "mongodb";

export async function checkValidateCodeRateLimit(userId: string | ObjectId): Promise<void> {
    const cache = redis.getRedis();
    const key = `validation_attempts:${userId}`;
    const attempts = parseInt((await cache.get(key)) ?? "0");

    if (attempts >= VALIDATE_CODE_RATE_LIMIT)
        throw new TooManyRequestsError(formatDuration(VALIDATE_CODE_RATE_LIMIT_TIME));

    await cache.incr(key);
    await cache.expire(key, VALIDATE_CODE_RATE_LIMIT_TIME / 1000);
}
