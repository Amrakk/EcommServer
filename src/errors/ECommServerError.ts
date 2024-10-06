import type { IResponse } from "@/interfaces/core/response.ts";

export default abstract class ECommServerError extends Error {
    name = "ECommServerError";
    abstract statusCode: number;
    constructor(message?: string, options?: ErrorOptions) {
        super(message, options);
    }

    abstract getResponseBody(): IResponse;
}
