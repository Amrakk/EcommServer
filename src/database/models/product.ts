import { z } from "zod";
import mongooat from "../db.js";
import { ZodObjectId } from "mongooat";
import { PRODUCT_CATEGORY } from "../../constants.js";

export const productCategorySchema = z.nativeEnum(PRODUCT_CATEGORY);

export const productVariantSchema = z.object({
    id: z.string().default(() => crypto.randomUUID()),
    quantity: z.number().int().positive().default(0),
    importPrice: z.number().positive(),
    retailPrice: z.number().positive(),
    details: z.record(z.string()).default({}),
});

export const productSchema = z.object({
    name: z.string(),
    images: z.array(z.string()).default([]),
    description: z.string().default(""),
    category: productCategorySchema,
    variants: z.array(productVariantSchema).nonempty(),
    relevantProduct: z.array(ZodObjectId),
    details: z.record(z.string()).default({}),
    ratings: z.number().default(-1),
    tags: z.array(z.string()).default([]),
});

export const productRatingSchema = z.object({
    userId: ZodObjectId,
    productId: ZodObjectId,
    rating: z.number(),
    review: z.string().default(""),
    timestamp: z.date().default(() => new Date()),
});

export const ProductModel = mongooat.Model("Product", productSchema);
export const ProductRatingModel = mongooat.Model("ProductRating", productRatingSchema);

ProductModel.createIndex({ category: 1 });
ProductModel.createIndex({ name: "text", tags: "text" }, { name: "searchIndex" });

ProductRatingModel.createIndex({ productId: 1 });
