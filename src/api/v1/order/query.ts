import ApiController from "../../apiController.js";
import OrderService from "../../../services/internal/order.js";
import { isAuthorizeToGetOrder } from "../../../utils/authorize.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE, USER_ROLE } from "../../../constants.js";

import NotFoundError from "../../../errors/NotFoundError.js";
import ForbiddenError from "../../../errors/ForbiddenError.js";

import type { IOrder } from "../../../interfaces/database/order.js";
import type { IReqOrder } from "../../../interfaces/api/request.js";

export const getAll = ApiController.callbackFactory<{}, { query: IReqOrder.Get }, IOrder[]>(async (req, res, next) => {
    try {
        const { isSelf } = req.query;
        const requestUser = req.ctx.user;

        let orders: IOrder[];
        if (!isSelf && requestUser.role !== USER_ROLE.ADMIN) throw new ForbiddenError();

        if (isSelf) orders = await OrderService.getById(requestUser.orderHistory);
        else orders = await OrderService.getAll();

        res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: orders });
    } catch (err) {
        next(err);
    }
});

export const getById = ApiController.callbackFactory<{ id: string }, {}, IOrder>(async (req, res, next) => {
    try {
        const { id } = req.params;
        const requestUser = req.ctx.user;

        const regex = RegExp(/^\d+$/);

        if (!regex.test(id)) throw new NotFoundError();

        const _id = parseInt(id);
        if (!isAuthorizeToGetOrder(requestUser, { targetOrderId: _id })) throw new ForbiddenError();

        const order = await OrderService.getById(_id);
        if (!order) throw new NotFoundError();

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: order,
        });
    } catch (err) {
        next(err);
    }
});
