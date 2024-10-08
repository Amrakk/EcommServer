import { z } from "zod";
import mongooat from "../db.js";
import { ZodObjectId } from "mongooat";

export const cartItemSchema = z.object({
    productId: ZodObjectId,
    variantId: ZodObjectId,
    quantity: z.number().int().positive().default(1),
});

export const cartSchema = z.object({
    items: z.array(cartItemSchema).default([]),
});

export const CartModel = mongooat.Model("Cart", cartSchema);
