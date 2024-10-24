import ECommServerError from "./ECommServerError.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../constants.js";

import type { IResponse } from "../interfaces/api/response.js";

export default class ServiceResponseError extends ECommServerError {
    service: string;
    operation: string;
    description?: string;
    details?: object;

    statusCode = 500;

    constructor(service: string, operation: string, description?: string, details?: object) {
        super(description);

        this.service = service;
        this.operation = operation;
        this.description = description;
        this.details = details;
    }

    getResponseBody(): IResponse {
        return {
            code: RESPONSE_CODE.INTERNAL_SERVER_ERROR,
            message: RESPONSE_MESSAGE.INTERNAL_SERVER_ERROR,
        };
    }
}
