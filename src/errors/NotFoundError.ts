import ECommServerError from "./ECommServerError.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../constants.js";

export default class NotFoundError extends ECommServerError {
    statusCode = 404;

    constructor() {
        super(RESPONSE_MESSAGE.NOT_FOUND);
    }

    public getResponseBody() {
        return {
            code: RESPONSE_CODE.NOT_FOUND,
            message: RESPONSE_MESSAGE.NOT_FOUND,
        };
    }
}
