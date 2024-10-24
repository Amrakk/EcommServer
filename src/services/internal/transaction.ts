import UserService from "./user.js";
import OrderService from "./order.js";
import { ZodObjectId } from "mongooat";
import PaymentService from "../external/payment.js";
import { TransactionModel } from "../../database/models/order.js";
import { sendReceiptEmail } from "../../utils/mailHandlers/mailHandlers.js";
import {
    PAYMENT_TYPE,
    SUPPORTED_PAYMENT_SERVICE,
    PAYMENT_DEFAULT_EXPIRE_TIME,
    PAYMENT_STATUS,
} from "../../constants.js";

import NotFoundError from "../../errors/NotFoundError.js";
import ServiceResponseError from "../../errors/ServiceResponseError.js";

import type { ITransaction } from "../../interfaces/database/order.js";
import type { IReqTransaction } from "../../interfaces/api/request.js";
import { updateProductQuantity } from "../../utils/updateProductQuantity.js";
import ProductService from "./product.js";

export default class TransactionService {
    // Query
    public static async getAll(): Promise<ITransaction[]> {
        return TransactionModel.find();
    }

    // TODO: Check status and update from payment services
    public static async getById(id: string): Promise<ITransaction | null> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (!result.success) throw new NotFoundError();

        const transaction = await TransactionModel.findById(result.data);
        return transaction;
    }

    // TODO: Check status and update from payment services
    public static async getByOrderId(orderId: number): Promise<ITransaction | null> {
        return TransactionModel.findOne({ orderId });
    }

    // Mutate
    public static async insert(data: IReqTransaction.Insert): Promise<ITransaction> {
        const { orderId, paymentType, paymentAmount, shippingFee, userId } = data;
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

        return await TransactionModel.insertOne({
            orderId,
            checkoutUrl,
            shippingFee,
            paymentType,
            paymentAmount,
            paymentDetails: description,
        });
    }

    public static async updateByOrderId(orderId: number, data: IReqTransaction.Update): Promise<ITransaction> {
        const transaction = await TransactionModel.findOneAndUpdate(
            { orderId, paymentStatus: PAYMENT_STATUS.PENDING },
            data,
            { returnDocument: "after" }
        );
        if (!transaction) throw new NotFoundError("Transaction not found or already processed");

        const userId = transaction.paymentDetails;

        const [user, order] = await Promise.all([
            UserService.updateLoyaltyPoint(userId, Math.floor((transaction.paymentAmount * 0.05) / 1000)),
            transaction.paymentStatus === PAYMENT_STATUS.CANCELLED
                ? OrderService.updateOrderStatus(orderId, { isCancelled: true })
                : OrderService.updateOrderStatus(orderId, { isPaid: true }),
        ]);
        if (!user) throw new ServiceResponseError("ECommServer", "paymentCallback", "User is missing", { transaction });

        if (transaction.paymentStatus === PAYMENT_STATUS.PAID) await sendReceiptEmail(user, order, transaction);
        else if (transaction.paymentStatus === PAYMENT_STATUS.CANCELLED) {
            const productIds = Array.from(new Set(order.items.map((item) => item.product._id)));
            const products = await ProductService.getById(productIds);

            const preprocessUpdateVariantQuantity = order.items.map(({ quantity, ...rest }) => ({
                ...rest,
                quantity: -quantity,
            }));

            await updateProductQuantity(preprocessUpdateVariantQuantity, products);
        }

        return transaction;
    }

    public static async deleteByOrderId(orderId: number): Promise<ITransaction> {
        const transaction = await TransactionModel.findOneAndDelete({ orderId, paymentStatus: PAYMENT_STATUS.PENDING });
        if (!transaction) throw new NotFoundError("Transaction not found or already processed");

        return transaction;
    }
}
