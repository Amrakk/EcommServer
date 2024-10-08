import OrderService from "../../../services/order.js";

import type { Request, Response, NextFunction } from "express";

export async function getAll(req: Request, res: Response, next: NextFunction) {
    try {
        const orders = await OrderService.getAll();
        res.status(200).json(orders);
    } catch (err) {
        next(err);
    }
}
