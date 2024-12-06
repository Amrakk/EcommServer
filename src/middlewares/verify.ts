import { ObjectId } from "mongooat";
import redis from "../database/redis.js";
import UserService from "../services/internal/user.js";
import { setAccToken, verifyToken } from "../utils/tokenHandlers.js";
import { ACCESS_TOKEN_SECRET, ENV, REFRESH_TOKEN_SECRET, USER_ROLE, USER_STATUS } from "../constants.js";

import ForbiddenError from "../errors/ForbiddenError.js";
import UnauthorizedError from "../errors/UnauthorizeError.js";

import type ITokenPayload from "../interfaces/api/token.js";
import type { Request, Response, NextFunction } from "express";

const isDev = ENV === "development";

export function verify(roles?: USER_ROLE[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userID = await verifyCookies(req, res);

            const user = await UserService.getById(userID);
            if (!user) throw new UnauthorizedError();
            if (user.status === USER_STATUS.BLOCKED || (typeof roles === "object" && !roles.includes(user.role)))
                throw new ForbiddenError();

            req.ctx = { user };

            return next();
        } catch (err) {
            if (err instanceof UnauthorizedError) {
                res.clearCookie("accToken", {
                    secure: !isDev,
                    httpOnly: true,
                    sameSite: isDev ? "lax" : "none",
                });
                res.clearCookie("refToken", {
                    secure: !isDev,
                    httpOnly: true,
                    sameSite: isDev ? "lax" : "none",
                });
            }
            next(err);
        }
    };
}

async function verifyCookies(req: Request, res: Response) {
    const cookies = req.headers.cookie?.split("; ");

    let userId;
    let accToken = cookies?.find((c) => c.startsWith("accToken"))?.split("=")[1];
    const refToken = cookies?.find((c) => c.startsWith("refToken"))?.split("=")[1];

    if (!accToken) throw new UnauthorizedError();

    const accPayload = verifyToken(accToken, ACCESS_TOKEN_SECRET);
    if (!accPayload) throw new UnauthorizedError();
    if (accPayload === "expired") {
        if (!refToken) throw new UnauthorizedError();
        const refPayload = verifyToken(refToken, REFRESH_TOKEN_SECRET);

        if (!refPayload || refPayload === "expired" || !(await verifyRefPayload(refPayload, refToken)))
            throw new UnauthorizedError();

        accToken = await setAccToken(new ObjectId(refPayload.id), res);

        userId = refPayload.id;
    } else userId = accPayload.id;

    return userId;
}

async function verifyRefPayload(payload: ITokenPayload, refToken: string) {
    const cache = redis.getRedis();
    const token = await cache.get(`refToken-${payload.id}`);
    if (token !== refToken) return false;

    return true;
}
