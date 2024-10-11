import { ProductModel } from "../database/models/product.js";

import NotFoundError from "../errors/NotFoundError.js";

import { Mongooat, ObjectId, ZodObjectId } from "mongooat";

type Product = Mongooat.infer<typeof ProductModel>;

export default class ProductService {
    // Query
    public static async getAll(): Promise<Product[]> {
        return ProductModel.find();
    }

    public static async getById(id: string | ObjectId): Promise<Product | null> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        return ProductModel.findById(result.data);
    }

    // Mutate
    public static async insert(products: Array<any>): Promise<Product[]> {
        return await ProductModel.insertMany(products);
    }
}
