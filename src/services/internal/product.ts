import { ZodObjectId } from "mongooat";
import ImgbbService from "../external/imgbb.js";
import { ProductModel } from "../../database/models/product.js";

import NotFoundError from "../../errors/NotFoundError.js";

import type { ObjectId } from "mongooat";
import type { IReqProduct } from "../../interfaces/api/request.js";
import type { IProduct } from "../../interfaces/database/product.js";

export default class ProductService {
    // Query
    public static async getAll(): Promise<IProduct[]> {
        return ProductModel.find({ isDeleted: false });
    }

    public static async getById(ids: (string | ObjectId)[]): Promise<IProduct[]>;
    public static async getById(id: string | ObjectId): Promise<IProduct | null>;
    public static async getById(ids: string | ObjectId | (string | ObjectId)[]): Promise<IProduct | IProduct[] | null> {
        if (Array.isArray(ids)) {
            const result = (
                await Promise.all(ids.map(async (id) => (await ZodObjectId.safeParseAsync(id)).data))
            ).filter((id) => id !== undefined);

            return ProductModel.find({ _id: { $in: result }, isDeleted: false });
        } else {
            const result = await ZodObjectId.safeParseAsync(ids);
            if (result.error) return null;

            return ProductModel.findById(result.data);
        }
    }

    // Mutate
    public static async insert(products: IReqProduct.Insert[]): Promise<IProduct[]> {
        return ProductModel.insertMany(products);
    }

    public static async updateById(id: string | ObjectId, data: IReqProduct.Update): Promise<IProduct> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        const product = await ProductModel.findOneAndUpdate({ _id: result.data, isDeleted: false }, data, {
            returnDocument: "after",
        });
        if (!product) throw new NotFoundError();

        return product;
    }

    public static async updateImages(id: string | ObjectId, images: Buffer): Promise<string> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        const { url, deleteUrl } = await ImgbbService.uploadImage(images);

        const updateResult = await ProductModel.collection
            .updateOne({ _id: result.data, isDeleted: false }, { $push: { images: url } })
            .catch(async (err) => {
                await fetch(deleteUrl, { method: "GET" });
                throw err;
            });

        if (updateResult.matchedCount === 0) throw new NotFoundError();
        return url;
    }

    public static async deleteById(id: string | ObjectId): Promise<IProduct> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        const product = await ProductModel.findOneAndUpdate(
            { _id: result.data, isDeleted: false },
            { isDeleted: true },
            { returnDocument: "after" }
        );
        if (!product) throw new NotFoundError();

        return product;
    }
}
