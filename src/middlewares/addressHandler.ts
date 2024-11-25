import path from "path";
import redis from "../database/redis.js";
import { isValidJsonFile } from "../utils/isValidJsonFile.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../constants.js";
import { getCacheCrawlStatus, startCrawlAddresses } from "../api/v1/services/crawlAddresses.js";

import type { Request, Response, NextFunction } from "express";

export async function addressHandler(req: Request, res: Response, next: NextFunction) {
    try {
        const wardsAbsolutePath = path.join(process.cwd(), "public", "address", "wards.json");
        const districtsAbsolutePath = path.join(process.cwd(), "public", "address", "districts.json");
        const provincesAbsolutePath = path.join(process.cwd(), "public", "address", "provinces.json");

        const results = await Promise.allSettled([
            isValidJsonFile(wardsAbsolutePath),
            isValidJsonFile(districtsAbsolutePath),
            isValidJsonFile(provincesAbsolutePath),
        ]);

        const currentStatus = await getCacheCrawlStatus();

        if (results.some((result) => result.status === "rejected")) {
            if (!currentStatus.isCrawling) {
                const cache = redis.getRedis();
                const crawlResult = await startCrawlAddresses(cache);
                await cache.set("crawlStatus", JSON.stringify(crawlResult));
            }

            return res.status(503).json({
                code: RESPONSE_CODE.SERVICE_UNAVAILABLE,
                message: RESPONSE_MESSAGE.SERVICE_UNAVAILABLE,
            });
        }

        next();
    } catch (err) {
        next(err);
    }
}
