import type { IResponse } from "../interfaces/api/response.js";
import type { Request, Response, NextFunction } from "express";

export default class ApiController {
    public static callbackFactory<Params, ReqPayload extends { body?: any; query?: any }, ResBody>(
        callback: (
            req: Request<Params, {}, ReqPayload["body"], ReqPayload["query"]>,
            res: Response<IResponse<ResBody>>,
            next: NextFunction
        ) => unknown
    ) {
        return callback;
    }
}
