import { ZodObjectId } from "mongooat";
import ImgbbService from "../external/imgbb.js";
import { ProductModel } from "../../database/models/product.js";

import NotFoundError from "../../errors/NotFoundError.js";

import type { Mongooat, ObjectId } from "mongooat";

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

    public static async updateImages(
        id: string | ObjectId,
        images: { file?: Buffer; urls: string[] }
    ): Promise<string[]> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        let deleteUrl: string | undefined = undefined;

        if (images.file) {
            const result = await ImgbbService.uploadImage(images.file);
            images.urls.push(result.url);
            deleteUrl = result.deleteUrl;
        }

        const updateResult = await ProductModel.collection
            .updateOne({ _id: result.data }, { $push: { images: { $each: images.urls } } })
            .catch(async (err) => {
                if (deleteUrl) await fetch(deleteUrl, { method: "GET" });
                throw err;
            });

        if (updateResult.matchedCount === 0) throw new NotFoundError();
        return images.urls;
    }
}
