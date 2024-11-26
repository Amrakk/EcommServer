import { ObjectId } from "mongodb";
import UserService from "./user.js";
import ProductService from "./product.js";
import TransactionService from "./transaction.js";
import { ORDER_STATUS, PAYMENT_STATUS } from "../../constants.js";
import { removeUndefinedKeys } from "../../utils/removeUndefinedKeys.js";
import { sendReceiptEmail } from "../../utils/mailHandlers/mailHandlers.js";
import { updateProductQuantity } from "../../utils/updateProductQuantity.js";
import { OrderModel, TransactionModel } from "../../database/models/order.js";

import { ValidateError } from "mongooat";
import NotFoundError from "../../errors/NotFoundError.js";

import type { IResServices } from "../../interfaces/api/response.js";
import type { IOrder, ITransaction } from "../../interfaces/database/order.js";
import type { IOffsetPagination, IReqOrder } from "../../interfaces/api/request.js";

export default class OrderService {
    // Query
    public static async getAll(
        query: IOffsetPagination & IReqOrder.Filter
    ): Promise<[(IOrder & { customerName: string })[], number]> {
        const { limit, page, isPaid, searchTerm, statuses, startDate } = query;
        const skip = ((page ?? 1) - 1) * (limit ?? 0);

        const endDate = query.endDate ? new Date(query.endDate) : new Date();

        const pipeline: any[] = [
            {
                $match: {
                    ...(isPaid !== undefined ? { isPaid } : {}),
                    ...(statuses ? { status: { $in: statuses } } : {}),
                    ...(startDate || endDate
                        ? {
                              createdAt: {
                                  ...(startDate ? { $gte: startDate } : {}),
                                  ...(endDate ? { $lte: endDate } : {}),
                              },
                          }
                        : {}),
                },
            },
            {
                $lookup: {
                    from: "User",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $addFields: {
                    customerName: { $arrayElemAt: ["$user.name", 0] },
                },
            },
            {
                $addFields: {
                    _customerName: { $arrayElemAt: ["$user_.name", 0] },
                },
            },
            {
                $addFields: {
                    orderIdString: { $toString: "$_id" },
                },
            },
            {
                $match: {
                    ...(searchTerm
                        ? {
                              $or: [
                                  { customerName: { $regex: searchTerm, $options: "i" } },
                                  { _customerName: { $regex: searchTerm, $options: "i" } },
                                  { orderIdString: { $regex: searchTerm, $options: "i" } },
                                  { "user.phoneNumber": { $regex: searchTerm, $options: "i" } },
                              ],
                          }
                        : {}),
                },
            },
            { $unwind: "$user" },
            { $project: { user: 0 } },
            { $unset: ["orderIdString", "_customerName"] },
            { $sort: { createdAt: -1 } },
        ];

        const countPipeline = [...pipeline, { $count: "total" }];

        if (skip && skip !== 0) pipeline.push({ $skip: skip });
        if (limit && limit !== 0) pipeline.push({ $limit: limit });

        const [orders, totalCount] = await Promise.all([
            OrderModel.aggregate(pipeline).toArray() as Promise<(IOrder & { customerName: string })[]>,
            OrderModel.collection.aggregate(countPipeline).toArray(),
        ]);

        return [orders, totalCount[0]?.total || 0];
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

    public static async getTopProducts(): Promise<IResServices.IAdminDashboard["topProductData"]> {
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000); // Last 7 days
        const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

        const getBaseProductPipeline = () => [
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product._id",
                    name: { $first: "$items.product.name" },
                    totalSales: { $sum: "$items.quantity" },
                },
            },
            { $sort: { totalSales: -1 } },
            {
                $group: {
                    _id: null,
                    products: { $push: { name: "$name", value: "$totalSales" } },
                },
            },
            {
                $project: {
                    _id: 0,
                    products: { $slice: ["$products", 3] },
                },
            },
            { $unwind: "$products" },
            {
                $replaceRoot: {
                    newRoot: "$products",
                },
            },
        ];

        const pipeline = [
            {
                $facet: {
                    day: [{ $match: { createdAt: { $gte: startOfToday } } }, ...getBaseProductPipeline()],
                    week: [{ $match: { createdAt: { $gte: startOfWeek } } }, ...getBaseProductPipeline()],
                    month: [{ $match: { createdAt: { $gte: startOfMonth } } }, ...getBaseProductPipeline()],
                },
            },
        ];

        const result = (await OrderModel.aggregate(
            pipeline
        ).toArray()) as unknown as IResServices.IAdminDashboard["topProductData"][];

        const { day, week, month } = result[0];
        return { day, week, month };
    }

    public static async getOrderHeaderData(): Promise<IResServices.Metric> {
        const pipeline = [
            {
                $addFields: {
                    isToday: {
                        $cond: {
                            if: { $gte: ["$createdAt", new Date(new Date().setHours(0, 0, 0, 0))] },
                            then: 1,
                            else: 0,
                        },
                    },
                    isYesterday: {
                        $cond: {
                            if: {
                                $gte: [
                                    "$createdAt",
                                    new Date(new Date(new Date().setHours(0, 0, 0, 0)).getTime() - 24 * 60 * 60 * 1000),
                                ],
                            },
                            then: 1,
                            else: 0,
                        },
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    todayCount: { $sum: "$isToday" },
                    yesterdayCount: { $sum: "$isYesterday" },
                },
            },
            {
                $addFields: {
                    dailyRate: {
                        $cond: {
                            if: { $eq: ["$yesterdayCount", 0] },
                            then: 0,
                            else: {
                                $multiply: [
                                    {
                                        $divide: [{ $subtract: ["$todayCount", "$yesterdayCount"] }, "$yesterdayCount"],
                                    },
                                    100,
                                ],
                            },
                        },
                    },
                },
            },
        ];

        const result = (await OrderModel.aggregate(pipeline).toArray()) as unknown as {
            totalOrders: number;
            dailyRate: number;
        }[];

        if (result.length === 0) {
            return { total: 0, dailyRate: 0 };
        }

        return { total: result[0].totalOrders, dailyRate: result[0].dailyRate };
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

        const filter = removeUndefinedKeys({
            _id: id,
            status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.COMPLETED] },
            isPaid: data.isPaid ? false : undefined,
        });

        let order = await OrderModel.findOneAndUpdate(filter, data, { returnDocument });

        if (!order) throw new NotFoundError("Order not found, already processed, or cannot update isPaid twice");

        if (data.isPaid) order = await this.processOrderTransaction(id, { isPaid: true });
        else if (data.status === ORDER_STATUS.CANCELLED)
            order = await this.processOrderTransaction(id, { isPaid: false });
        else if (data.status === ORDER_STATUS.DELIVERED && order.isPaid)
            order = await OrderModel.findByIdAndUpdate(id, { status: ORDER_STATUS.COMPLETED }, { returnDocument });

        if (!order) throw new NotFoundError("Order not found or already processed");

        return order;
    }

    public static async updateProductRating(
        orderId: number,
        productId: string | ObjectId,
        productRatingId: string | ObjectId
    ): Promise<IOrder> {
        const order = await OrderModel.collection.findOneAndUpdate(
            {
                _id: orderId,
                status: ORDER_STATUS.COMPLETED,
                items: { $elemMatch: { "product._id": new ObjectId(productId) } },
            },
            { $set: { "items.$.productRatingId": productRatingId } },
            { returnDocument: "after" }
        );
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
