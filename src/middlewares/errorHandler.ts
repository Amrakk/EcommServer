import { errorLogger } from "./logger/loggers.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../constants.js";

import { MulterError } from "multer";
import { MongooatError } from "mongooat";
import ECommServerError from "../errors/ECommServerError.js";
import ValidateError from "mongooat/build/errors/validateError.js";

import type { IResponse } from "../interfaces/api/response.js";
import type { Request, Response, NextFunction } from "express";

export async function errorHandler(err: any, req: Request, res: Response<IResponse>, next: NextFunction) {
    if (err instanceof ECommServerError) {
        if (err.statusCode >= 500) await errorLogger(err, req);

        return res.status(err.statusCode).json(err.getResponseBody());
    } else if (err instanceof MongooatError) return mongooatErrorHandler(err, res);
    else if (err instanceof MulterError) return multerErrorHandler(err, res);

    await errorLogger(err, req);
    return res.status(500).json({
        code: RESPONSE_CODE.INTERNAL_SERVER_ERROR,
        message: RESPONSE_MESSAGE.INTERNAL_SERVER_ERROR,
    });
}

function mongooatErrorHandler<T extends MongooatError>(err: T, res: Response<IResponse>) {
    if (err instanceof ValidateError) {
        return res.status(400).json({
            code: RESPONSE_CODE.VALIDATION_ERROR,
            message: RESPONSE_MESSAGE.VALIDATION_ERROR,
            error: err.errors,
        });
    }
}

function multerErrorHandler(err: MulterError, res: Response<IResponse>) {
    return res.status(400).json({
        code: RESPONSE_CODE.VALIDATION_ERROR,
        message: RESPONSE_MESSAGE.VALIDATION_ERROR,
        error: [{ code: "custom", message: err.message, path: [err.field] }],
    });
}
