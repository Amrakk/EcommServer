import ECommServerError from "./ECommServerError.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../constants.js";

import type { IResponse } from "../interfaces/api/response.js";

export default class UnauthorizedError extends ECommServerError {
    statusCode = 401;

    constructor() {
        super(RESPONSE_MESSAGE.UNAUTHORIZED);
    }

    public getResponseBody(): IResponse {
        return {
            code: RESPONSE_CODE.UNAUTHORIZED,
            message: RESPONSE_MESSAGE.UNAUTHORIZED,
            error: {},
        };
    }
}
