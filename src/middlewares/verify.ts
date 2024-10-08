import type { Request, Response, NextFunction } from "express";

export async function verify(req: Request, res: Response, next: NextFunction) {
    try {
        // TODO: Implement verify middleware

        next();
    } catch (err) {
        next(err);
    }
}
