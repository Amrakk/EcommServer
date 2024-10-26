import ApiController from "../../apiController.js";
import UserService from "../../../services/internal/user.js";
import OrderService from "../../../services/internal/order.js";
import { isAuthorizeToGetOrder } from "../../../utils/authorize.js";
import TransactionService from "../../../services/internal/transaction.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE, USER_ROLE } from "../../../constants.js";

import NotFoundError from "../../../errors/NotFoundError.js";
import ForbiddenError from "../../../errors/ForbiddenError.js";

import type { IOrder } from "../../../interfaces/database/order.js";
import type { IReqOrder } from "../../../interfaces/api/request.js";
import type { IResGetById } from "../../../interfaces/api/response.js";

export const getAll = ApiController.callbackFactory<{}, {}, IOrder[]>(async (req, res, next) => {
    try {
        const requestUser = req.ctx.user;

        let orders: IOrder[];

        if (requestUser.role === USER_ROLE.CUSTOMER) orders = await OrderService.getById(requestUser.orderHistory);
        else orders = await OrderService.getAll();

        res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: orders });
    } catch (err) {
        next(err);
    }
});

export const getById = ApiController.callbackFactory<{ id: string }, {}, IResGetById.Order>(async (req, res, next) => {
    try {
        const { id } = req.params;
        const requestUser = req.ctx.user;

        const _id = parseInt(id);
        if (isNaN(_id)) throw new NotFoundError("Order not found");

        if (!isAuthorizeToGetOrder(requestUser, { targetOrderId: _id })) throw new ForbiddenError();

        const order = await OrderService.getById(_id);
        if (!order) throw new NotFoundError("Order not found");

        const { userId, ...orderData } = order;
        const [userProfile, transaction] = await Promise.all([
            UserService.getById(userId, true),
            TransactionService.getByOrderId(_id),
        ]);

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: {
                transaction,
                user: userProfile,
                ...orderData,
            },
        });
    } catch (err) {
        next(err);
    }
});
