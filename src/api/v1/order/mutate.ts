import ApiController from "../../apiController.js";
import OrderService from "../../../services/internal/order.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import NotFoundError from "../../../errors/NotFoundError.js";

import type { IOrder } from "../../../interfaces/database/order.js";
import type { IReqOrder } from "../../../interfaces/api/request.js";

export const insert = ApiController.callbackFactory<{}, { body: IReqOrder.Insert | IReqOrder.Insert[] }, IOrder[]>(
    async (req, res, next) => {
        try {
            const { body } = req;
            let data: IReqOrder.Insert[] = [];

            if (Array.isArray(body)) data = body;
            else data = [body];

            const orders = await OrderService.insert(data);
            return res
                .status(201)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: orders });
        } catch (err) {
            next(err);
        }
    }
);

export const updateById = ApiController.callbackFactory<{ id: string }, { body: IReqOrder.Update }, IOrder>(
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { body } = req;

            if (isNaN(parseInt(id))) throw new NotFoundError();

            const order = await OrderService.updateById(parseInt(id), body);
            return res.json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: order });
        } catch (err) {
            next(err);
        }
    }
);

export const deleteById = ApiController.callbackFactory<{ id: string }, {}, IOrder>(async (req, res, next) => {
    try {
        const { id } = req.params;

        if (isNaN(parseInt(id))) throw new NotFoundError();

        const order = await OrderService.deleteById(parseInt(id));
        return res.json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: order });
    } catch (err) {
        next(err);
    }
});

// export const checkout = ApiController.callbackFactory<{}, { body: IReqOrder.Insert }, IOrder>(
//     async (req, res, next) => {
//         try {
//             const { body } = req;

//             const order = await OrderService.checkout(body);
//             res.status(201).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: order });
//         } catch (err) {
//             next(err);
//         }
//     }
// );
