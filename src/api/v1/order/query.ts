import ApiController from "../../apiController.js";
import OrderService from "../../../services/order.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import type { IOrder } from "../../../interfaces/database/order.js";

export const getAll = ApiController.callbackFactory<{}, {}, IOrder[]>(async (req, res, next) => {
    try {
        const orders = await OrderService.getAll();
        res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: orders });
    } catch (err) {
        next(err);
    }
});
