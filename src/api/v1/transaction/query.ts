import TransactionService from "../../../services/transaction.js";

import type { Request, Response, NextFunction } from "express";

export async function getAll(req: Request, res: Response, next: NextFunction) {
    try {
        const transactions = await TransactionService.getAll();
        res.status(200).json(transactions);
    } catch (err) {
        next(err);
    }
}
