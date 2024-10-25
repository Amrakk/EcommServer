import ApiController from "../../apiController.js";
import GHNService from "../../../services/external/ghn.js";
import OrderService from "../../../services/internal/order.js";
import TransactionService from "../../../services/internal/transaction.js";
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_TYPE, RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import NotFoundError from "../../../errors/NotFoundError.js";
import BadRequestError from "../../../errors/BadRequestError.js";

import type { ITransaction } from "../../../interfaces/database/order.js";
import type { IReqTransaction } from "../../../interfaces/api/request.js";

export const insert = ApiController.callbackFactory<{}, { body: IReqTransaction.PreprocessInsert }, ITransaction>(
    async (req, res, next) => {
        try {
            const { body } = req;

            if (body.isPaid && body.paymentType !== PAYMENT_TYPE.COD)
                throw new BadRequestError("isPaid is only for COD payment type", { paymentType: body.paymentType });

            const [order, existedTransaction] = await Promise.all([
                OrderService.getById(body.orderId),
                TransactionService.getByOrderId(body.orderId),
            ]);

            if (!order) throw new NotFoundError("Order not found");
            if (existedTransaction)
                throw new BadRequestError("Transaction for this order is already existed", { orderId: body.orderId });

            const { totalPrice, loyaltyPointsDiscount, voucherDiscount, shippingAddress, status } = order;

            if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.COMPLETED)
                throw new BadRequestError("Order is already processed", { orderId: body.orderId });

            const shippingFee = await GHNService.getShippingFee(shippingAddress.district.id, shippingAddress.ward.code);

            const transaction = await TransactionService.insert({
                shippingFee,
                userId: order.userId,
                orderId: body.orderId,
                paymentType: body.paymentType,
                paymentStatus: body.isPaid ? PAYMENT_STATUS.PAID : undefined,
                paymentAmount: totalPrice - (voucherDiscount ?? 0) - (loyaltyPointsDiscount ?? 0) * 1000,
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
