import ECommServerError from "./ECommServerError.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../constants.js";

import type { IResponse } from "../interfaces/api/response.js";

export default class BadRequestError extends ECommServerError {
    statusCode = 400;
    details: Record<string, unknown>;

    constructor(message: string, details?: Record<string, unknown>) {
        super(message);
        this.details = details ?? {};
    }

    public getResponseBody(): IResponse {
        return {
            code: RESPONSE_CODE.BAD_REQUEST,
            message: RESPONSE_MESSAGE.BAD_REQUEST,
            error: {
                message: this.message,
                details: this.details,
            },
        };
    }
}
