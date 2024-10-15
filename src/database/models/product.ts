import { z } from "zod";
import mongooat from "../db.js";
import { ZodObjectId } from "mongooat";
import { PRODUCT_CATEGORY } from "../../constants.js";

export const productCategorySchema = z.nativeEnum(PRODUCT_CATEGORY);

export const productVariantSchema = z.object({
    id: z.string(),
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
    relevantProducts: z.array(ZodObjectId).default([]),
    details: z.record(z.string()).default({}),
    ratings: z.number().default(-1),
    tags: z.array(z.string()).default([]),
    isDeleted: z.boolean().default(false),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

export const productRatingSchema = z.object({
    userId: ZodObjectId,
    productId: ZodObjectId,
    rating: z.number(),
    review: z.string().default(""),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
});

export const ProductModel = mongooat.Model("Product", productSchema);
export const ProductRatingModel = mongooat.Model("ProductRating", productRatingSchema);

await ProductModel.dropIndexes();
await ProductModel.createIndex({ category: 1 });
await ProductModel.createIndex({ name: "text", tags: "text" }, { name: "searchIndex" });

await ProductRatingModel.createIndex({ productId: 1 });
