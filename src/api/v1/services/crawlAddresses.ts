import path from "path";
import { fork } from "child_process";
import redis from "../../../database/redis.js";
import ApiController from "../../apiController.js";
import { formatDuration } from "../../../utils/formatDuration.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";
import { addressCrawlerLogger } from "../../../middlewares/logger/loggers.js";

import type { IResServices } from "../../../interfaces/api/response.js";
import type { Redis } from "ioredis";

export const defaultCrawlStatus: IResServices.AddressCrawlStatus = {
    isCrawling: false,
    start: null,
    end: null,
    duration: "0ms",
    stat: {
        provinces: { length: 0, size: "0 KB" },
        districts: { length: 0, size: "0 KB" },
        wards: { length: 0, size: "0 KB" },
    },
};

export const crawlAddresses = ApiController.callbackFactory<{}, {}, IResServices.AddressCrawlStatus>(
    async (req, res, next) => {
        const cache = redis.getRedis();
        const crawlStatus = await getCacheCrawlStatus();

        if (!crawlStatus.isCrawling) {
            await startCrawlAddresses(cache, crawlStatus);
        } else {
            crawlStatus.duration = crawlStatus.start ? formatDuration(crawlStatus.start, new Date()) : "0ms";
        }

        await cache.set("crawlStatus", JSON.stringify(crawlStatus));

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: crawlStatus,
        });
    }
);

export const getCrawlStatus = ApiController.callbackFactory<{}, {}, IResServices.AddressCrawlStatus>(
    async (req, res, next) => {
        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: await getCacheCrawlStatus(),
        });
    }
);

export async function startCrawlAddresses(
    cache?: Redis,
    crawlStatus: IResServices.AddressCrawlStatus = defaultCrawlStatus
) {
    cache = cache ?? redis.getRedis();
    await cache.set("crawlStatus", JSON.stringify(defaultCrawlStatus));

    const start = new Date();
    crawlStatus.isCrawling = true;
    crawlStatus.start = start;

    let data: Record<string, unknown> | Error | undefined = undefined;
    const absPath = path.join(process.cwd(), "src", "workers", "addressCrawler.ts");

    let child;
    let attempts = 0;
    const maxAttempts = 3;

    const spawnChild = () => {
        child = fork(absPath, [], { stdio: "ignore" });

        child.on("message", async (message: Record<string, unknown>) => {
            const crawlStatus = await getCacheCrawlStatus();
            if ("stat" in message) {
                crawlStatus.stat = message.stat as IResServices.Stat;
                await cache.set("crawlStatus", JSON.stringify(crawlStatus));
                data = { ...crawlStatus };
            } else if ("error" in message) data = message.error as Error;
            else data = message;
        });

        child.on("error", (err) => {
            data = err;
        });

        child.on("exit", async (code) => {
            const crawlStatus = await getCacheCrawlStatus();
            const end = new Date();

            if (code !== 0 && attempts < maxAttempts) {
                attempts++;
                spawnChild();
            } else {
                crawlStatus.isCrawling = false;
                crawlStatus.end = end;
                await cache.set("crawlStatus", JSON.stringify(crawlStatus));
                addressCrawlerLogger(code ?? 100, start, end, data);
            }
        });
    };

    spawnChild();
    return crawlStatus;
}

async function getCacheCrawlStatus(): Promise<IResServices.AddressCrawlStatus> {
    const cache = redis.getRedis();
    const crawlResult = JSON.parse(
        (await cache.get("crawlStatus")) ?? JSON.stringify(defaultCrawlStatus),
        (key, value) => {
            if ((key === "start" || key === "end") && value !== null) return new Date(value);
            return value;
        }
    ) as IResServices.AddressCrawlStatus;

    crawlResult.duration = crawlResult.start ? formatDuration(crawlResult.start, crawlResult.end ?? new Date()) : "0ms";

    return crawlResult;
}
