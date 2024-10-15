import ApiController from "../../apiController.js";
import CartService from "../../../services/internal/cart.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import NotFoundError from "../../../errors/NotFoundError.js";

import type { ICart } from "../../../interfaces/database/cart.js";

export const getAll = ApiController.callbackFactory<{}, {}, ICart[]>(async (req, res, next) => {
    try {
        const carts = await CartService.getAll();
        res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: carts });
    } catch (err) {
        next(err);
    }
});

export const getById = ApiController.callbackFactory<{ id: string }, {}, ICart>(async (req, res, next) => {
    try {
        const { id } = req.params;

        const cart = await CartService.getById(id);
        if (!cart) throw new NotFoundError();

        res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: cart });
    } catch (err) {
        next(err);
    }
});
