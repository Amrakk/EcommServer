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

import type { IResServices } from "../../interfaces/api/response.js";
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

    public static async getRevenueHeaderData(): Promise<IResServices.Metric> {
        const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

        const pipeline = [
            {
                $match: {
                    paymentStatus: PAYMENT_STATUS.PAID,
                },
            },
            {
                $addFields: {
                    isToday: {
                        $cond: {
                            if: { $gte: ["$createdAt", startOfToday] },
                            then: 1,
                            else: 0,
                        },
                    },
                    isYesterday: {
                        $cond: {
                            if: {
                                $and: [
                                    { $gte: ["$createdAt", startOfYesterday] },
                                    { $lt: ["$createdAt", startOfToday] },
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
                    todayRevenue: { $sum: { $cond: [{ $eq: ["$isToday", 1] }, "$paymentAmount", 0] } },
                    yesterdayRevenue: { $sum: { $cond: [{ $eq: ["$isYesterday", 1] }, "$paymentAmount", 0] } },
                    totalRevenue: { $sum: "$paymentAmount" },
                },
            },
            {
                $addFields: {
                    dailyRate: {
                        $cond: {
                            if: { $eq: ["$yesterdayRevenue", 0] },
                            then: Number.MAX_SAFE_INTEGER,
                            else: {
                                $multiply: [
                                    {
                                        $divide: [
                                            { $subtract: ["$todayRevenue", "$yesterdayRevenue"] },
                                            "$yesterdayRevenue",
                                        ],
                                    },
                                    100,
                                ],
                            },
                        },
                    },
                },
            },
        ];

        const result = (await TransactionModel.aggregate(pipeline).toArray()) as unknown as {
            todayRevenue: number;
            dailyRate: number;
        }[];

        if (!result.length) return { total: 0, dailyRate: 0 };

        return {
            total: result[0].todayRevenue,
            dailyRate: result[0].dailyRate,
        };
    }

    public static async getRevenueData(): Promise<IResServices.IAdminDashboard["revenueData"]> {
        const timeRanges: IResServices.TimeRanges[] = ["7 Days", "30 Days", "6 Months", "1 Year", "All Time"];

        const pipeline = [
            {
                $match: {
                    paymentStatus: PAYMENT_STATUS.PAID,
                },
            },
            {
                $facet: Object.fromEntries(timeRanges.map((range) => [range, this.getBaseRevenuePipeline(range)])),
            },
        ];

        const result = (await TransactionModel.aggregate(pipeline).toArray()) as unknown as {
            [key: string]: { totalRevenue: number; dateRange: { start: Date; end: Date } }[];
        }[];

        const revenueData: Record<IResServices.TimeRanges, number[]> = Object.fromEntries(
            timeRanges.map((range) => [range, result[0][range].map((item) => item.totalRevenue)])
        ) as Record<IResServices.TimeRanges, number[]>;

        return revenueData;
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

    private static getBaseRevenuePipeline(period: IResServices.TimeRanges) {
        const now = new Date();

        let dateRanges: { start: Date; end: Date }[] = [];

        switch (period) {
            case "7 Days":
                dateRanges = Array.from({ length: 7 }, (_, i) => {
                    const end = new Date(now);
                    end.setDate(now.getDate() - i);
                    end.setHours(23, 59, 59, 999);
                    const start = new Date(end);
                    start.setHours(0, 0, 0, 0);
                    return { start, end };
                });
                break;

            case "30 Days":
                dateRanges = Array.from({ length: 30 }, (_, i) => {
                    const end = new Date(now);
                    end.setDate(now.getDate() - i);
                    end.setHours(23, 59, 59, 999);
                    const start = new Date(end);
                    start.setHours(0, 0, 0, 0);
                    return { start, end };
                });
                break;

            case "6 Months":
                dateRanges = Array.from({ length: 6 }, (_, i) => {
                    const end = new Date(now);
                    end.setMonth(now.getMonth() - i + 1);
                    end.setDate(0);
                    end.setHours(23, 59, 59, 999);
                    const start = new Date(end);
                    start.setDate(1);
                    start.setHours(0, 0, 0, 0);
                    return { start, end };
                });
                break;

            case "1 Year":
                dateRanges = Array.from({ length: 12 }, (_, i) => {
                    const end = new Date(now);
                    end.setMonth(now.getMonth() - i + 1);
                    end.setDate(0);
                    end.setHours(23, 59, 59, 999);
                    const start = new Date(end);
                    start.setDate(1);
                    start.setHours(0, 0, 0, 0);
                    return { start, end };
                });
                break;

            case "All Time":
                const startYear = 2024;
                const currentYear = now.getFullYear();

                dateRanges = Array.from({ length: currentYear - startYear + 1 }, (_, i) => {
                    const year = startYear + i;
                    const start = new Date(year, 0, 1, 0, 0, 0, 0);
                    const end = year === currentYear ? new Date(now) : new Date(year, 11, 31, 23, 59, 59, 999);
                    return { start, end };
                });
                break;

            default:
                throw new Error(`Unsupported period: ${period}`);
        }

        const pipeline: any[] = [
            {
                $addFields: {
                    [`${period}`]: {
                        $map: {
                            input: dateRanges,
                            as: "date",
                            in: {
                                $let: {
                                    vars: {
                                        totalRevenue: {
                                            $sum: {
                                                $cond: {
                                                    if: {
                                                        $and: [
                                                            { $gte: ["$paymentTime", "$$date.start"] },
                                                            { $lte: ["$paymentTime", "$$date.end"] },
                                                        ],
                                                    },
                                                    then: "$paymentAmount",
                                                    else: 0,
                                                },
                                            },
                                        },
                                    },
                                    in: {
                                        totalRevenue: "$$totalRevenue",
                                        dateRange: "$$date",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    [`${period}`]: {
                        $filter: {
                            input: `$${period}`,
                            as: "item",
                            cond: { $ne: ["$$item", null] },
                        },
                    },
                },
            },
            {
                $unwind: `$${period}`,
            },
            {
                $group: {
                    _id: {
                        start: `$${period}.dateRange.start`,
                        end: `$${period}.dateRange.end`,
                    },
                    totalRevenue: { $sum: `$${period}.totalRevenue` },
                },
            },
            {
                $sort: { "_id.start": 1 },
            },
            {
                $project: {
                    dateRange: "$_id",
                    totalRevenue: 1,
                    _id: 0,
                },
            },
        ];

        return pipeline;
    }
}
