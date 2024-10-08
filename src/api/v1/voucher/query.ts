import VoucherService from "../../../services/voucher.js";

import type { Request, Response, NextFunction } from "express";

export async function getAll(req: Request, res: Response, next: NextFunction) {
    try {
        const vouchers = await VoucherService.getAll();
        res.status(200).json(vouchers);
    } catch (err) {
        next(err);
    }
}
