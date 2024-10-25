import UserService from "./user.js";
import ProductService from "./product.js";
import TransactionService from "./transaction.js";
import { ORDER_STATUS, PAYMENT_STATUS } from "../../constants.js";
import { sendReceiptEmail } from "../../utils/mailHandlers/mailHandlers.js";
import { updateProductQuantity } from "../../utils/updateProductQuantity.js";
import { OrderModel, TransactionModel } from "../../database/models/order.js";

import { ValidateError } from "mongooat";
import NotFoundError from "../../errors/NotFoundError.js";

import type { IReqOrder } from "../../interfaces/api/request.js";
import type { IOrder, ITransaction } from "../../interfaces/database/order.js";

export default class OrderService {
    // Query
    public static async getAll(): Promise<IOrder[]> {
        return OrderModel.find();
    }

    public static async getById(ids: number[]): Promise<IOrder[]>;
    public static async getById(id: number): Promise<IOrder | null>;
    public static async getById(ids: number[] | number): Promise<IOrder | null | IOrder[]> {
        if (Array.isArray(ids)) {
            await Promise.all(ids.map((id) => TransactionService.getByOrderId(id)));
            return await OrderModel.find({ _id: { $in: ids } });
        }

        await TransactionService.getByOrderId(ids);
        return OrderModel.findById(ids);
    }

    // Mutate
    public static async insert(data: IReqOrder.Insert[]): Promise<IOrder[]> {
        return OrderModel.insertMany(data);
    }

    public static async updateById(
        id: number,
        data: IReqOrder.Update,
        returnDocument: "before" | "after" = "after"
    ): Promise<IOrder> {
        if (data.status === ORDER_STATUS.COMPLETED)
            throw new ValidateError("Cannot manually set order status to completed", [
                { code: "custom", message: "Cannot manually set order status to completed", path: ["status"] },
            ]);

        if (data.isPaid && data.status === ORDER_STATUS.CANCELLED)
            throw new ValidateError("Cannot set order to paid and cancelled at the same time", [
                {
                    code: "custom",
                    message: "Cannot set order to paid and cancelled at the same time",
                    path: ["isPaid", "status"],
                },
            ]);

        const currentOrder = await OrderModel.findById(id);
        if (!currentOrder) throw new NotFoundError("Order not found");

        if (currentOrder.isPaid && data.isPaid) {
            throw new ValidateError("Cannot update isPaid to true more than once", [
                { code: "custom", message: "isPaid has already been set to true", path: ["isPaid"] },
            ]);
        }

        let order = await OrderModel.findOneAndUpdate(
            {
                _id: id,
                status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.COMPLETED] },
                isPaid: data.isPaid ? false : undefined,
            },
            data,
            { returnDocument }
        );

        if (!order) throw new NotFoundError("Order not found, already processed, or cannot update isPaid twice");

        if (data.isPaid) order = await this.processOrderTransaction(id, { isPaid: true });
        else if (data.status === ORDER_STATUS.CANCELLED)
            order = await this.processOrderTransaction(id, { isPaid: false });
        else if (data.status === ORDER_STATUS.DELIVERED && order.isPaid)
            order = await OrderModel.findByIdAndUpdate(id, { status: ORDER_STATUS.COMPLETED }, { returnDocument });

        if (!order) throw new NotFoundError("Order not found or already processed");

        return order;
    }

    public static async deleteById(id: number): Promise<IOrder> {
        const order = await OrderModel.findOneAndDelete({
            _id: id,
            status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.COMPLETED] },
        });
        if (!order) throw new NotFoundError("Order not found or already processed");

        return order;
    }

    public static async processOrderTransaction(
        id: number,
        params: { isPaid: boolean },
        transaction?: ITransaction | null
    ): Promise<IOrder> {
        const order = await OrderModel.findOne({
            _id: id,
            status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.COMPLETED] },
        });
        if (!order) throw new NotFoundError("Order not found or already processed");

        const newTransaction =
            transaction ??
            (await TransactionModel.findOneAndUpdate(
                { id, paymentStatus: PAYMENT_STATUS.PENDING },
                { paymentStatus: params.isPaid ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.CANCELLED },
                { returnDocument: "after" }
            ));
        if (!newTransaction) throw new NotFoundError("Transaction not found or already processed");

        let promise: Promise<void> = Promise.resolve();

        if (params.isPaid) {
            if (order.status === ORDER_STATUS.DELIVERED) order.status = ORDER_STATUS.COMPLETED;
            order.isPaid = true;

            const baseTotal =
                order.totalPrice - (order.voucherDiscount ?? 0) - (order.loyaltyPointsDiscount ?? 0) * 1000;
            const loyaltyPoints = Math.max(Math.floor((baseTotal * 0.05) / 1000), 0);

            const user = await UserService.updateLoyaltyPoint(order.userId, loyaltyPoints);

            promise = sendReceiptEmail(user, order, newTransaction);
        } else {
            order.status = ORDER_STATUS.CANCELLED;

            await UserService.updateLoyaltyPoint(order.userId, order.loyaltyPointsDiscount ?? 0);

            const productIds = Array.from(new Set(order.items.map((item) => item.product._id)));
            const products = await ProductService.getById(productIds);

            const preprocessUpdateVariantQuantity = order.items.map(({ quantity, ...rest }) => ({
                ...rest,
                quantity: -quantity,
            }));

            promise = updateProductQuantity(preprocessUpdateVariantQuantity, products);
        }

        const updateData = { status: order.status, isPaid: order.isPaid, updatedAt: new Date() };

        const [newOrder] = await Promise.all([
            OrderModel.findByIdAndUpdate(id, updateData, { returnDocument: "after" }),
            promise,
        ]);
        if (!newOrder) throw new NotFoundError("Order not found");

        return newOrder;
    }
}
