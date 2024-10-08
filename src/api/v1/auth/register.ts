import type { NextFunction, Request, Response } from "express";

export async function register(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body;

        return res.status(200).json({ email, password });
    } catch (err) {
        next(err);
    }
}
