import { ZodObjectId } from "mongooat";
import PaymentService from "../external/payment.js";
import { TransactionModel } from "../../database/models/order.js";
import { PAYMENT_TYPE, SUPPORTED_PAYMENT_SERVICE, PAYMENT_DEFAULT_EXPIRE_TIME } from "../../constants.js";

import NotFoundError from "../../errors/NotFoundError.js";

import type { ITransaction } from "../../interfaces/database/order.js";
import type { IReqTransaction } from "../../interfaces/api/request.js";

export default class TransactionService {
    // Query
    public static async getAll(): Promise<ITransaction[]> {
        return TransactionModel.find();
    }

    public static async getById(id: string): Promise<ITransaction | null> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (!result.success) throw new NotFoundError();

        const transaction = await TransactionModel.findById(result.data);
        return transaction;
    }

    public static async getByOrderId(orderId: number): Promise<ITransaction | null> {
        return TransactionModel.findOne({ orderId });
    }

    // Mutate
    public static async insert(data: IReqTransaction.Insert): Promise<ITransaction> {
        const { orderId, paymentType, paymentAmount, shippingFee } = data;
        const description = `EComm-${orderId}`;

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

        return await TransactionModel.insertOne({
            orderId,
            checkoutUrl,
            shippingFee,
            paymentType,
            paymentAmount,
        });
    }

    public static async updateByOrderId(orderId: number, data: IReqTransaction.Update): Promise<ITransaction> {
        const transaction = await TransactionModel.findOneAndUpdate({ orderId }, data, { returnDocument: "after" });
        if (!transaction) throw new NotFoundError();

        return transaction;
    }

    public static async deleteByOrderId(orderId: number): Promise<ITransaction> {
        const transaction = await TransactionModel.findOneAndDelete({ orderId });
        if (!transaction) throw new NotFoundError();

        return transaction;
    }
}
