import ECommServerError from "./ECommServerError.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../constants.js";

import type { IResponse } from "../interfaces/api/response.js";

export default class BadRequestError extends ECommServerError {
    statusCode = 400;

    constructor(message: string) {
        super(message);
    }

    public getResponseBody(): IResponse {
        return {
            code: RESPONSE_CODE.BAD_REQUEST,
            message: RESPONSE_MESSAGE.BAD_REQUEST,
            error: {
                message: this.message,
            },
        };
    }
}
