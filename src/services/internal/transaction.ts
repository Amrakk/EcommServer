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
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
                $facet: Object.fromEntries(timeRanges.map((range) => [range, this.getBaseRevenuePipeline(range)])),
            },
        ];

        const result = (await TransactionModel.aggregate(pipeline).toArray()) as unknown as {
            [key: string]: Record<IResServices.TimeRanges, number[]>[];
        }[];

        const revenueData: Record<IResServices.TimeRanges, number[]> = Object.fromEntries(
            timeRanges.map((range) => [range, result[0][range][0][range]])
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
        let dateRanges: Date[] = [];

        switch (period) {
            case "7 Days":
                dateRanges = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date(now);
                    date.setDate(now.getDate() - i);
                    return date;
                });
                break;

            case "30 Days":
                dateRanges = Array.from({ length: 30 }, (_, i) => {
                    const date = new Date(now);
                    date.setDate(now.getDate() - i);
                    return date;
                });
                break;

            case "6 Months":
                dateRanges = Array.from({ length: 6 }, (_, i) => {
                    const date = new Date(now);
                    date.setMonth(now.getMonth() - i);
                    return new Date(date.setDate(1));
                });
                break;

            case "1 Year":
                dateRanges = Array.from({ length: 12 }, (_, i) => {
                    const date = new Date(now);
                    date.setMonth(now.getMonth() - i);
                    return new Date(date.setDate(1));
                });
                break;

            case "All Time":
                dateRanges = [now];
                break;

            default:
                throw new Error(`Unsupported period: ${period}`);
        }

        const pipeline: any[] = [
            {
                $match: {
                    paymentStatus: PAYMENT_STATUS.PAID,
                },
            },
        ];

        if (period === "All Time") {
            pipeline.push(
                {
                    $addFields: {
                        _id: null,
                        firstTransactionDate: { $min: "$createdAt" },
                    },
                },
                {
                    $addFields: {
                        yearMap: { $range: [{ $year: "$firstTransactionDate" }, { $add: [{ $year: now }, 1] }] },
                    },
                },
                {
                    $addFields: {
                        "All Time": {
                            $map: {
                                input: "$yearMap",
                                as: "year",
                                in: {
                                    $let: {
                                        vars: {
                                            startOfYear: {
                                                $dateFromParts: {
                                                    year: "$$year",
                                                    month: 1,
                                                    day: 1,
                                                    hour: 0,
                                                    minute: 0,
                                                    second: 0,
                                                },
                                            },
                                            endOfYear: {
                                                $dateFromParts: {
                                                    year: "$$year",
                                                    month: 12,
                                                    day: 31,
                                                    hour: 23,
                                                    minute: 59,
                                                    second: 59,
                                                },
                                            },
                                        },
                                        in: {
                                            $sum: {
                                                $cond: {
                                                    if: {
                                                        $and: [
                                                            { $gte: ["$createdAt", "$$startOfYear"] },
                                                            { $lte: ["$createdAt", "$$endOfYear"] },
                                                        ],
                                                    },
                                                    then: "$paymentAmount",
                                                    else: 0,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                }
            );
        } else {
            pipeline.push({
                $addFields: {
                    [`${period}`]: {
                        $map: {
                            input: dateRanges.reverse(),
                            as: "day",
                            in: {
                                $let: {
                                    vars: {
                                        startOfDay: {
                                            $dateFromParts: {
                                                year: { $year: "$$day" },
                                                month: { $month: "$$day" },
                                                day: { $dayOfMonth: "$$day" },
                                                hour: 0,
                                                minute: 0,
                                                second: 0,
                                            },
                                        },
                                        endOfDay: {
                                            $dateFromParts: {
                                                year: { $year: "$$day" },
                                                month: {
                                                    ...(period === "6 Months" || period === "1 Year"
                                                        ? { $add: [{ $month: "$$day" }, 1] }
                                                        : { $month: "$$day" }),
                                                },
                                                day: { $dayOfMonth: "$$day" },
                                                hour: 23,
                                                minute: 59,
                                                second: 59,
                                            },
                                        },
                                    },
                                    in: {
                                        $sum: [
                                            {
                                                $cond: {
                                                    if: {
                                                        $and: [
                                                            { $gte: ["$createdAt", "$$startOfDay"] },
                                                            { $lte: ["$createdAt", "$$endOfDay"] },
                                                        ],
                                                    },
                                                    then: "$paymentAmount",
                                                    else: 0,
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        pipeline.push({
            $group: {
                _id: null,
                [period]: { $first: `$${period}` },
            },
        });

        return pipeline;
    }
}
