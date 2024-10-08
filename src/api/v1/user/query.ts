import UserService from "../../../services/user.js";

import type { Request, Response, NextFunction } from "express";

export async function getAll(req: Request, res: Response, next: NextFunction) {
    try {
        const users = await UserService.getAll();
        res.status(200).json(users);
    } catch (err) {
        next(err);
    }
}
