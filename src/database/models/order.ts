import { z } from "zod";
import mongooat from "../db.js";
import { ZodObjectId } from "mongooat";
import { addressSchema } from "./user.js";
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_TYPE } from "../../constants.js";

export const orderStatusSchema = z.nativeEnum(ORDER_STATUS);

export const orderItemSchema = z.object({
    product: z.object({
        _id: ZodObjectId,
        name: z.string(),
        images: z.array(z.string()).default([]),
    }),
    variant: z.object({
        id: z.string(),
        importPrice: z.number().positive(),
        retailPrice: z.number().positive(),
        details: z.record(z.string()).default({}),
    }),
    quantity: z.number().int().positive().default(0),
});

export const orderSchema = z.object({
    _id: z.number().default(() => Date.now() + Math.floor(Math.random() * 1000)),
    userId: ZodObjectId,
    items: z.array(orderItemSchema),
    voucherDiscount: z.number().optional(),
    loyaltyPointsDiscount: z.number().optional(),
    totalPrice: z.number().positive(),
    isPaid: z.boolean().default(false),
    shippingAddress: addressSchema,
    status: orderStatusSchema.default(ORDER_STATUS.PENDING),
    createdAt: z
        .preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date())
        .default(() => new Date()),
    updatedAt: z
        .preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date())
        .default(() => new Date()),
});

export const paymentTypeSchema = z.nativeEnum(PAYMENT_TYPE);
export const paymentStatusSchema = z.nativeEnum(PAYMENT_STATUS);

export const transactionSchema = z.object({
    orderId: z.number(),
    paymentType: paymentTypeSchema,
    paymentStatus: paymentStatusSchema.default(PAYMENT_STATUS.PENDING),
    paymentTime: z
        .preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date())
        .optional(),
    paymentDetails: z.string(),
    paymentAmount: z.number().int().min(0).default(0),
    shippingFee: z.number().int().min(0).default(0),
    checkoutUrl: z.string().optional(),
    createdAt: z
        .preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date())
        .default(() => new Date()),
});

export const OrderModel = mongooat.Model("Order", orderSchema);
export const TransactionModel = mongooat.Model("Transaction", transactionSchema);

await OrderModel.dropIndexes();
await OrderModel.createIndex({ userId: 1, status: 1, isPaid: 1 });

await TransactionModel.dropIndexes();
await TransactionModel.createIndex({ orderId: 1, paymentType: 1, paymentStatus: 1 });
