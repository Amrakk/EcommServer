import { z } from "zod";
import mongooat from "../db.js";
import { ZodObjectId } from "mongooat";
import { getLocalTime } from "../../utils/getLocalTime.js";

export const cartItemSchema = z.object({
    productId: ZodObjectId,
    variantId: z.string(),
    quantity: z.number().int().positive().default(1),
});

export const cartSchema = z.object({
    items: z.array(cartItemSchema).default([]),
    updatedAt: z.date().default(() => getLocalTime()),
});

export const CartModel = mongooat.Model("Cart", cartSchema);

await CartModel.dropIndexes();
await CartModel.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
