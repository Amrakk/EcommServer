import type ECommServerError from "@/errors/ECommServerError.js";

export interface IResponse<T = undefined> {
    /** Response code */
    code: RESPONSE_CODE;
    /** Response message */
    message: RESPONSE_MESSAGE;
    /** Response data */
    data?: T;
    /** Error details */
    error?: ECommServerError | Record<string, unknown> | Array<unknown>;
}

export enum RESPONSE_CODE {
    SUCCESS = 0,
    UNAUTHORIZED = 1,
    VALIDATION_ERROR = 8,

    INTERNAL_SERVER_ERROR = 100,
}

export enum RESPONSE_MESSAGE {
    SUCCESS = "Operation completed successfully",
    UNAUTHORIZED = "Access denied! Please provide valid authentication",
    VALIDATION_ERROR = "Input validation failed! Please check your data",

    INTERNAL_SERVER_ERROR = "An unexpected error occurred! Please try again later.",
}
