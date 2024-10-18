import fs from "fs";
import path from "path";
import type { Request, Response, NextFunction } from "express";

export function addressHandler(req: Request, res: Response, next: NextFunction) {
    try {
        next();
    } catch (err) {
        next(err);
    }
}
