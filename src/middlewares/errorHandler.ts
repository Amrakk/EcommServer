import { errorLogger } from "./logger/loggers.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../constants.js";

import { MulterError } from "multer";
import { MongooatError } from "mongooat";
import ECommServerError from "../errors/ECommServerError.js";
import ValidateError from "mongooat/build/errors/validateError.js";
import { MongoBulkWriteError, MongoError, MongoServerError, WriteError } from "mongodb";

import type { ZodCustomIssue } from "zod";
import type { IResponse } from "../interfaces/api/response.js";
import type { Request, Response, NextFunction } from "express";

export async function errorHandler(err: any, req: Request, res: Response<IResponse>, next: NextFunction) {
    try {
        if (err instanceof ECommServerError) {
            if (err.statusCode >= 500) await errorLogger(err, req);

            return res.status(err.statusCode).json(err.getResponseBody());
        } else if (err instanceof MongooatError) return mongooatErrorHandler(err, res);
        else if (err instanceof MulterError) return multerErrorHandler(err, res);
        else if (err instanceof MongoError) return mongoErrorHandler(err, req, res);

        await errorLogger(err, req);
        return res.status(500).json({
            code: RESPONSE_CODE.INTERNAL_SERVER_ERROR,
            message: RESPONSE_MESSAGE.INTERNAL_SERVER_ERROR,
        });
    } catch (error: any) {
        await errorLogger(error, req);
        return res.status(500).json({
            code: RESPONSE_CODE.INTERNAL_SERVER_ERROR,
            message: RESPONSE_MESSAGE.INTERNAL_SERVER_ERROR,
        });
    }
}

function mongooatErrorHandler<T extends MongooatError>(err: T, res: Response<IResponse>) {
    if (err instanceof ValidateError) {
        return res.status(400).json({
            code: RESPONSE_CODE.VALIDATION_ERROR,
            message: RESPONSE_MESSAGE.VALIDATION_ERROR,
            error: err.errors,
        });
    }

    throw err;
}

function multerErrorHandler(err: MulterError, res: Response<IResponse>) {
    return res.status(400).json({
        code: RESPONSE_CODE.VALIDATION_ERROR,
        message: RESPONSE_MESSAGE.VALIDATION_ERROR,
        error: [{ code: "custom", message: err.message, path: [err.field] }],
    });
}

function mongoErrorHandler(err: MongoError, req: Request, res: Response<IResponse>) {
    if ((err instanceof MongoServerError || err instanceof MongoBulkWriteError) && err.code === 11000) {
        if ("keyPattern" in err) {
            const key = Object.keys(err.keyPattern)[0];
            const value = err.keyValue[key];

            let displayKey = key.replace(/([A-Z])/g, " $1").toLowerCase();
            displayKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1);

            return res.status(400).json({
                code: RESPONSE_CODE.VALIDATION_ERROR,
                message: RESPONSE_MESSAGE.VALIDATION_ERROR,
                error: [
                    { code: "custom", message: `${displayKey} is already existed`, path: [key], params: { value } },
                ],
            });
        } else if ("writeErrors" in err) {
            const writeErrors = err.writeErrors as WriteError[];

            const errors: ZodCustomIssue[] = writeErrors.map((writeError) => {
                const { index, errmsg } = writeError;

                if (!errmsg) throw err;

                const regex = /dup key: { (.+?): (.*?) }/;
                const matches = errmsg.match(regex);

                if (matches) {
                    const key = matches[1];
                    const value = matches[2] === "null" ? null : matches[2];

                    let displayKey = key.replace(/([A-Z])/g, " $1").toLowerCase();
                    displayKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1);
                    return {
                        code: "custom",
                        message: `${displayKey} is already existed`,
                        path: [index, key],
                        params: { value },
                    };
                } else throw err;
            });

            return res.status(400).json({
                code: RESPONSE_CODE.VALIDATION_ERROR,
                message: RESPONSE_MESSAGE.VALIDATION_ERROR,
                error: errors,
            });
        }

        throw err;
    }
}
