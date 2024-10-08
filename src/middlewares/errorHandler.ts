import { errorLogger } from "./logger/loggers.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../constants.js";

import ECommServerError from "../errors/ECommServerError.js";

import type { Request, Response, NextFunction } from "express";

export async function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    if (err instanceof ECommServerError) {
        if (err.statusCode >= 500) await errorLogger(err, req);

        return res.status(err.statusCode).json(err.getResponseBody());
    }

    await errorLogger(err, req);
    return res.status(500).send({
        code: RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        message: RESPONSE_MESSAGE.INTERNAL_SERVER_ERROR,
    });
}
