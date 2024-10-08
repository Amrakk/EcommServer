import type { IResponse } from "../interfaces/api/response.js";

export default abstract class ECommServerError extends Error {
    name = "ECommServerError";
    abstract statusCode: number;
    constructor(message?: string, options?: ErrorOptions) {
        super(message, options);
    }

    abstract getResponseBody(): IResponse;
}
