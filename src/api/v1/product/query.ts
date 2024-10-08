import ProductService from "../../../services/product.js";

import type { Request, Response, NextFunction } from "express";

export async function getAll(req: Request, res: Response, next: NextFunction) {
    try {
        const products = await ProductService.getAll();
        res.status(200).json(products);
    } catch (err) {
        next(err);
    }
}
