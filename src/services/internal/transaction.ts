import OrderService from "./order.js";
import { ZodObjectId } from "mongooat";
import PaymentService from "../external/payment.js";
import { TransactionModel } from "../../database/models/order.js";
import {
    PAYMENT_TYPE,
    PAYMENT_STATUS,
    SUPPORTED_PAYMENT_SERVICE,
    PAYMENT_DEFAULT_EXPIRE_TIME,
} from "../../constants.js";

import NotFoundError from "../../errors/NotFoundError.js";
import BadRequestError from "../../errors/BadRequestError.js";

import type { ITransaction } from "../../interfaces/database/order.js";
import type { IReqTransaction } from "../../interfaces/api/request.js";

export default class TransactionService {
    // Query
    public static async getAll(): Promise<ITransaction[]> {
        return TransactionModel.find();
    }

    public static async getById(id: string): Promise<ITransaction | null> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (!result.success) throw new NotFoundError("Transaction not found");

        let transaction = await TransactionModel.findById(result.data);
        if (transaction && transaction.paymentStatus === PAYMENT_STATUS.PENDING) {
            const service =
                transaction.paymentType === PAYMENT_TYPE.MOMO
                    ? SUPPORTED_PAYMENT_SERVICE.MOMO
                    : SUPPORTED_PAYMENT_SERVICE.PAYOS;
            const payment = await PaymentService.getTransactionStatus(service, { id: transaction.orderId });

            if (payment.status !== PAYMENT_STATUS.PENDING)
                transaction = await this.updateByOrderId(transaction.orderId, { paymentStatus: payment.status });
        }

        return transaction;
    }

    public static async getByOrderId(orderId: number): Promise<ITransaction | null> {
        let transaction = await TransactionModel.findOne({ orderId });

        if (transaction?.paymentType === PAYMENT_TYPE.COD) return transaction;
        if (transaction && transaction.paymentStatus === PAYMENT_STATUS.PENDING) {
            const service =
                transaction.paymentType === PAYMENT_TYPE.MOMO
                    ? SUPPORTED_PAYMENT_SERVICE.MOMO
                    : SUPPORTED_PAYMENT_SERVICE.PAYOS;
            const payment = await PaymentService.getTransactionStatus(service, { id: transaction.orderId });

            if (payment.status !== transaction.paymentStatus)
                transaction = await this.updateByOrderId(orderId, { paymentStatus: payment.status });
        }

        return transaction;
    }

    // Mutate
    public static async insert(data: IReqTransaction.Insert): Promise<ITransaction> {
        const { orderId, paymentType, paymentAmount, shippingFee, userId, paymentStatus } = data;
        const description = `${userId}`;

        let checkoutUrl: string | undefined = undefined;

        if (paymentType !== PAYMENT_TYPE.COD) {
            const service =
                paymentType === PAYMENT_TYPE.MOMO ? SUPPORTED_PAYMENT_SERVICE.MOMO : SUPPORTED_PAYMENT_SERVICE.PAYOS;
            const payment = await PaymentService.createTransaction(service, {
                orderId,
                description,
                amount: paymentAmount + shippingFee,
                expireTime: PAYMENT_DEFAULT_EXPIRE_TIME,
            });
            checkoutUrl = payment.checkoutUrl;
        }

        const transaction = await TransactionModel.insertOne({
            orderId,
            checkoutUrl,
            shippingFee,
            paymentType,
            paymentAmount,
            paymentStatus,
            paymentDetails: description,
        });

        if (paymentStatus === PAYMENT_STATUS.PAID)
            await OrderService.processOrderTransaction(orderId, { isPaid: true }, transaction);

        return transaction;
    }

    public static async updateByOrderId(orderId: number, data: IReqTransaction.Update): Promise<ITransaction> {
        if (data.paymentStatus === PAYMENT_STATUS.PENDING) throw new BadRequestError("Cannot update to pending status");
        if (data.paymentStatus === PAYMENT_STATUS.PAID) data.paymentTime = data.paymentTime ?? new Date();

        const transaction = await TransactionModel.findOneAndUpdate(
            { orderId, paymentStatus: PAYMENT_STATUS.PENDING },
            data,
            { returnDocument: "after" }
        );
        if (!transaction) throw new NotFoundError("Transaction not found or already processed");

        await OrderService.processOrderTransaction(
            orderId,
            { isPaid: transaction.paymentStatus === PAYMENT_STATUS.PAID },
            transaction
        );

        return transaction;
    }

    public static async deleteByOrderId(orderId: number): Promise<ITransaction> {
        const transaction = await TransactionModel.findOneAndDelete({ orderId, paymentStatus: PAYMENT_STATUS.PENDING });
        if (!transaction) throw new NotFoundError("Transaction not found or already processed");

        return transaction;
    }
}
