import ApiController from "../../apiController.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";
import TransactionService from "../../../services/internal/transaction.js";

import NotFoundError from "../../../errors/NotFoundError.js";

import type { ITransaction } from "../../../interfaces/database/order.js";

export const getAll = ApiController.callbackFactory<{}, {}, ITransaction[]>(async (req, res, next) => {
    try {
        const transactions = await TransactionService.getAll();
        return res
            .status(200)
            .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: transactions });
    } catch (err) {
        next(err);
    }
});

export const getById = ApiController.callbackFactory<{ id: string }, {}, ITransaction>(async (req, res, next) => {
    try {
        const { id } = req.params;

        const transaction = await TransactionService.getById(id);
        if (!transaction) throw new NotFoundError("Transaction not found");

        return res
            .status(200)
            .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: transaction });
    } catch (err) {
        next(err);
    }
});

export const getByOrderId = ApiController.callbackFactory<{ orderId: string }, {}, ITransaction>(
    async (req, res, next) => {
        try {
            const { orderId } = req.params;

            if (isNaN(parseInt(orderId))) throw new NotFoundError("Order not found");

            const transaction = await TransactionService.getByOrderId(parseInt(orderId));
            if (!transaction) throw new NotFoundError("Transaction not found");

            return res
                .status(200)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: transaction });
        } catch (err) {
            next(err);
        }
    }
);
