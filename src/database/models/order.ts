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
    _id: z.preprocess(
        async () => await new Promise<number>((res) => setTimeout(() => res(Date.now()), 50)),
        z.number()
    ),
    userId: ZodObjectId,
    items: z.array(orderItemSchema),
    discount: z.number().optional(),
    totalPrice: z.number().positive(),
    isPaid: z.boolean().default(false),
    shippingAddress: addressSchema,
    status: orderStatusSchema.default(ORDER_STATUS.PENDING),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

export const paymentTypeSchema = z.nativeEnum(PAYMENT_TYPE);
export const paymentStatusSchema = z.nativeEnum(PAYMENT_STATUS);

export const transactionSchema = z.object({
    orderId: ZodObjectId,
    paymentType: paymentTypeSchema,
    paymentStatus: paymentStatusSchema,
    paymentTime: z.date().optional(),
    paymentDetails: z.string().optional(),
    paymentAmount: z.number().positive(),
    shippingFee: z.number().positive(),
    totalAmount: z.number().positive(),
    createdAt: z.date().default(() => new Date()),
});

export const OrderModel = mongooat.Model("Order", orderSchema);
export const TransactionModel = mongooat.Model("Transaction", transactionSchema);

await OrderModel.dropIndexes();
await OrderModel.createIndex({ userId: 1, status: 1, isPaid: 1 });

await TransactionModel.dropIndexes();
await TransactionModel.createIndex({ orderId: 1, paymentType: 1, paymentStatus: 1 });
