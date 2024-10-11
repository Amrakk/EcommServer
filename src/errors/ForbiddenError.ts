import ECommServerError from "./ECommServerError.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../constants.js";

import type { IResponse } from "../interfaces/api/response.js";

export default class ForbiddenError extends ECommServerError {
    statusCode = 403;

    constructor() {
        super(RESPONSE_MESSAGE.FORBIDDEN);
    }

    public getResponseBody(): IResponse {
        return {
            code: RESPONSE_CODE.FORBIDDEN,
            message: RESPONSE_MESSAGE.FORBIDDEN,
            error: {},
        };
    }
}
