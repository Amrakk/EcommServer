import { z, ObjectId, ZodObjectId, ValidateError } from "mongooat";
import { ProductRatingModel } from "../../database/models/product.js";

import NotFoundError from "../../errors/NotFoundError.js";

import type { IProductRating } from "../../interfaces/database/product.js";
import { IReqProductRating } from "../../interfaces/api/request.js";

export default class ProductRatingService {
    // Query
    public static async getByProductId(productId: string | ObjectId): Promise<IProductRating[]> {
        const result = await ZodObjectId.safeParseAsync(productId);
        if (result.error) throw new NotFoundError("Product not found");

        return ProductRatingModel.find({ productId: result.data });
    }

    public static async getById(ids: string | ObjectId): Promise<IProductRating> {
        const result = await ZodObjectId.safeParseAsync(ids);
        if (result.error) throw new NotFoundError("Product rating not found");

        const productRating = await ProductRatingModel.findById(result.data);
        if (!productRating) throw new NotFoundError("Product rating not found");

        return productRating;
    }

    // Mutation
    public static async insert(productRating: IReqProductRating.Insert[]): Promise<IProductRating[]> {
        return ProductRatingModel.insertMany(productRating);
    }

    public static async updateById(
        id: string | ObjectId,
        productRating: IReqProductRating.Update
    ): Promise<IProductRating> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("Product rating not found");

        const schema = z
            .object({
                rating: z.number().int().min(1).max(5),
                review: z.string().default(""),
            })
            .strict();

        const validated = await schema.safeParseAsync(productRating);
        if (validated.error) throw new ValidateError("Invalid update data", validated.error.errors);

        const updated = await ProductRatingModel.findByIdAndUpdate(
            result.data,
            { ...productRating, updatedAt: new Date() },
            {
                returnDocument: "after",
            }
        );
        if (!updated) throw new NotFoundError("Product rating not found");

        return updated;
    }

    public static async deleteById(id: string | ObjectId): Promise<IProductRating> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("Product rating not found");

        const deleted = await ProductRatingModel.findByIdAndDelete(result.data);
        if (!deleted) throw new NotFoundError("Product rating not found");

        return deleted;
    }
}
