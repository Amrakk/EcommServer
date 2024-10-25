import ApiController from "../../apiController.js";
import UserService from "../../../services/internal/user.js";
import OrderService from "../../../services/internal/order.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE, USER_ROLE } from "../../../constants.js";

import NotFoundError from "../../../errors/NotFoundError.js";
import ForbiddenError from "../../../errors/ForbiddenError.js";

import type { IUser } from "../../../interfaces/database/user.js";
import type { IResGetById } from "../../../interfaces/api/response.js";

export const getAll = ApiController.callbackFactory<{}, {}, Omit<IUser, "password">[]>(async (req, res, next) => {
    try {
        const users = await UserService.getAll();

        const returnUser = users.map(({ password, ...rest }) => rest);
        res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: returnUser });
    } catch (err) {
        next(err);
    }
});

export const getById = ApiController.callbackFactory<{ id: string }, {}, IResGetById.User>(async (req, res, next) => {
    try {
        const { id } = req.params;
        const requestUser = req.ctx.user;

        if (requestUser.role !== USER_ROLE.ADMIN && requestUser._id.toString() !== id) throw new ForbiddenError();

        const user = await UserService.getById(id);
        if (!user) throw new NotFoundError("User not found");

        const { password, ...rest } = user;

        const orderIds = user.orderHistory;
        const orders = await OrderService.getById(orderIds);

        res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: { ...rest, orderHistory: orders },
        });
    } catch (err) {
        next(err);
    }
});
