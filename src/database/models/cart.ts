import mongooat from "../db.js";
import { z, ZodObjectId } from "mongooat";

export const cartItemSchema = z.object({
    productId: ZodObjectId,
    variantId: z.string(),
    quantity: z.number().int().positive().default(1),
});

export const cartSchema = z.object({
    items: z.array(cartItemSchema).default([]),
    updatedAt: z
        .preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date())
        .default(() => new Date()),
});

export const CartModel = mongooat.Model("Cart", cartSchema);

await CartModel.dropIndexes();
await CartModel.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
