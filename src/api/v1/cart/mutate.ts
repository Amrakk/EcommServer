import ApiController from "../../apiController.js";
import CartService from "../../../services/internal/cart.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import type { ICart } from "../../../interfaces/database/cart.js";
import type { IReqCart } from "../../../interfaces/api/request.js";

export const insert = ApiController.callbackFactory<{}, IReqCart.Upsert | IReqCart.Upsert[], ICart[]>(
    async (req, res, next) => {
        try {
            const { body } = req;
            let data: IReqCart.Upsert[] = [];

            if (Array.isArray(body)) data = body;
            else data = [body];

            const carts = await CartService.insert(data);
            return res
                .status(200)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: carts });
        } catch (err) {
            next(err);
        }
    }
);

export const updateById = ApiController.callbackFactory<{ id: string }, IReqCart.Upsert, ICart>(
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { body } = req;

            const cart = await CartService.updateById(id, body.items);
            return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: cart });
        } catch (err) {
            next(err);
        }
    }
);

export const deleteById = ApiController.callbackFactory<{ id: string }, {}, ICart>(async (req, res, next) => {
    try {
        const { id } = req.params;

        const cart = await CartService.deleteById(id);
        return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: cart });
    } catch (err) {
        next(err);
    }
});
