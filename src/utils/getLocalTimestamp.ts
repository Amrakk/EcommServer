import { z } from "zod";
import ServiceResponseError from "../errors/ServiceResponseError.js";

export async function getLocalTimestampString(timestamp: Date | string): Promise<string> {
    const result = await z
        .preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date())
        .safeParseAsync(timestamp);
    if (!result.success)
        throw new ServiceResponseError("ECommServer", "getLocalTimestamp", "Wrong format date", { timestamp });

    const timeZoneOffset = 7;
    const localTimestamp = new Date(result.data.getTime() + timeZoneOffset * 60 * 60 * 1000).toLocaleString("en-US", {
        timeZone: "UTC",
        hour12: false,
        dateStyle: "medium",
        timeStyle: "medium",
    });

    return localTimestamp;
}
