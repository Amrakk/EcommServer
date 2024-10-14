import ApiController from "../../apiController.js";
import ProductService from "../../../services/internal/product.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import NotFoundError from "../../../errors/NotFoundError.js";

import type { IProduct } from "../../../interfaces/database/product.js";

export const getAll = ApiController.callbackFactory<{}, {}, IProduct[]>(async (req, res, next) => {
    try {
        const products = await ProductService.getAll();
        return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: products });
    } catch (err) {
        next(err);
    }
});

export const getProductById = ApiController.callbackFactory<{ id: string }, {}, IProduct>(async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await ProductService.getById(id);
        if (!product) throw new NotFoundError();

        return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: product });
    } catch (err) {
        next(err);
    }
});
