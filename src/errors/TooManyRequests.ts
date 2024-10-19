import ECommServerError from "./ECommServerError.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../constants.js";

import type { IResponse } from "../interfaces/api/response.js";

export default class TooManyRequestsError extends ECommServerError {
    statusCode = 429;

    constructor(time: string) {
        super(`Too many attempts. Please try again after ${time}`);
    }

    public getResponseBody(): IResponse {
        return {
            code: RESPONSE_CODE.TOO_MANY_REQUESTS,
            message: RESPONSE_MESSAGE.TOO_MANY_REQUESTS,
            error: { message: this.message },
        };
    }
}
