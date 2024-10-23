import ApiController from "../../apiController.js";
import GHNService from "../../../services/external/ghn.js";
import OrderService from "../../../services/internal/order.js";
import TransactionService from "../../../services/internal/transaction.js";
import { ORDER_STATUS, RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import BadRequestError from "../../../errors/BadRequestError.js";
import NotFoundError from "../../../errors/NotFoundError.js";

import type { ITransaction } from "../../../interfaces/database/order.js";
import type { IReqTransaction } from "../../../interfaces/api/request.js";

export const insert = ApiController.callbackFactory<{}, { body: IReqTransaction.PreprocessInsert }, ITransaction>(
    async (req, res, next) => {
        try {
            const { body } = req;

            const order = await OrderService.getById(body.orderId);
            if (!order) throw new NotFoundError();

            const existedTransaction = await TransactionService.getByOrderId(body.orderId);
            if (existedTransaction)
                return res
                    .status(200)
                    .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: existedTransaction });

            const { totalPrice, discount, shippingAddress, status, isPaid } = order;
            if (isPaid) throw new BadRequestError("Order is already paid", { orderId: body.orderId });
            else if (status === ORDER_STATUS.CANCELLED)
                throw new BadRequestError("Order is cancelled", { orderId: body.orderId });

            const shippingFee = await GHNService.getShippingFee(shippingAddress.district.id, shippingAddress.ward.code);

            const transaction = await TransactionService.insert({
                ...body,
                paymentAmount: totalPrice - (discount ?? 0),
                shippingFee,
            });

            return res
                .status(201)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: transaction });
        } catch (err) {
            next(err);
        }
    }
);

// UPdate will check transaction status and update order status unless admin set manually
