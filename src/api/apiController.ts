import type { IResponse } from "../interfaces/api/response.js";
import type { Request, Response, NextFunction } from "express";

export default class ApiController<Params, ReqBody, ResBody> {
    public static callbackFactory<Params, ReqBody, ResBody>(
        callback: (req: Request<Params, {}, ReqBody>, res: Response<IResponse<ResBody>>, next: NextFunction) => unknown
    ) {
        return callback;
    }
}
