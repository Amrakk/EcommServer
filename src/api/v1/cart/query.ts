import CartService from "../../../services/cart.js";

import type { Request, Response, NextFunction } from "express";

export async function getAll(req: Request, res: Response, next: NextFunction) {
    try {
        const carts = await CartService.getAll();
        res.status(200).json(carts);
    } catch (err) {
        next(err);
    }
}
