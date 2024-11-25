import { z } from "zod";
import ApiController from "../../apiController.js";
import UserService from "../../../services/internal/user.js";
import OrderService from "../../../services/internal/order.js";
import { isAuthorizeToGetOrder } from "../../../utils/authorize.js";
import TransactionService from "../../../services/internal/transaction.js";
import { ORDER_STATUS, RESPONSE_CODE, RESPONSE_MESSAGE, USER_ROLE } from "../../../constants.js";

import { ValidateError } from "mongooat";
import NotFoundError from "../../../errors/NotFoundError.js";
import ForbiddenError from "../../../errors/ForbiddenError.js";
import BadRequestError from "../../../errors/BadRequestError.js";

import type { IOrder } from "../../../interfaces/database/order.js";
import type { IReqOrder } from "../../../interfaces/api/request.js";
import type { IResGetAll, IResGetById } from "../../../interfaces/api/response.js";

const querySchema = z
    .object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),

        searchTerm: z.string().optional(),
        isPaid: z
            .enum(["true", "false"])
            .transform((value) => value === "true")
            .optional(),
        statuses: z.preprocess(
            (value) => (value ? [value].flat() : value),
            z.array(z.nativeEnum(ORDER_STATUS)).optional()
        ),
        startDate: z.preprocess(
            (val) => (typeof val === "string" ? new Date(Date.parse(val)) : val),
            z.date().optional()
        ),
        endDate: z.preprocess(
            (val) => (typeof val === "string" ? new Date(Date.parse(val)) : val),
            z.date().optional()
        ),
    })
    .strict()
    .refine(
        (data) => {
            if (data.page && !data.limit) return false;
            return true;
        },
        { message: "Limit is required if page is provided" }
    )
    .refine(
        (data) => {
            if (data.startDate && data.endDate && data.startDate > data.endDate) return false;
            return true;
        },
        { message: "Start date must be before end date" }
    );

export const getAll = ApiController.callbackFactory<{}, { query: IReqOrder.GetAllQuery }, IResGetAll.Order>(
    async (req, res, next) => {
        try {
            const requestUser = req.ctx.user;
            const { query } = req;

            const validatedQuery = await querySchema.safeParseAsync(query);
            if (!validatedQuery.success)
                throw new ValidateError("Invalid query parameters", validatedQuery.error.errors);
            if (requestUser.role === USER_ROLE.CUSTOMER && Object.keys(query).length !== 0)
                throw new BadRequestError("Customer is not allowed to use query parameters");

            let orders: IOrder[];
            let totalDocuments: number | undefined;

            if (requestUser.role === USER_ROLE.CUSTOMER) orders = await OrderService.getById(requestUser.orderHistory);
            else [orders, totalDocuments] = await OrderService.getAll(validatedQuery.data);

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: { orders, totalDocuments: totalDocuments ?? orders.length },
            });
        } catch (err) {
            next(err);
        }
    }
);

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
