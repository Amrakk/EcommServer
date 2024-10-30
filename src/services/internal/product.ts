import { ZodObjectId } from "mongooat";
import ImgbbService from "../external/imgbb.js";
import { ProductModel } from "../../database/models/product.js";
import { removeUndefinedKeys } from "../../utils/removeUndefinedKeys.js";
import { toLowerNonAccentVietnamese } from "../../utils/removeDiacritics.js";

import NotFoundError from "../../errors/NotFoundError.js";
import BadRequestError from "../../errors/BadRequestError.js";

import type { ObjectId } from "mongooat";
import type { AssociationRule } from "../../interfaces/services/external/pcy.js";
import type { IOffsetPagination, IReqProduct } from "../../interfaces/api/request.js";
import type { IProduct, IRelevantProduct } from "../../interfaces/database/product.js";

export default class ProductService {
    // Query
    public static async getAll(query: IReqProduct.Filter & IOffsetPagination): Promise<[IProduct[], number]> {
        const { page, limit, ...queryFilter } = query;
        const skip = ((page ?? 1) - 1) * (limit ?? 0);

        queryFilter.name = queryFilter.name ? toLowerNonAccentVietnamese(queryFilter.name.trim()) : undefined;

        const baseMatch = { isDeleted: false };

        const matchConditions = {
            ...(queryFilter.name ? { name: { $regex: queryFilter.name, $options: "i" } } : {}),
            ...(queryFilter.name ? { _name: { $regex: queryFilter.name, $options: "i" } } : {}),
            ...(queryFilter.category ? { category: queryFilter.category } : {}),
            ...(queryFilter.brand ? { brand: queryFilter.brand } : {}),
            ...(queryFilter.searchTerm
                ? {
                      $or: [
                          { name: { $regex: queryFilter.searchTerm, $options: "i" } },
                          { _name: { $regex: queryFilter.searchTerm, $options: "i" } },
                          { brand: { $regex: queryFilter.searchTerm, $options: "i" } },
                          { category: { $regex: queryFilter.searchTerm, $options: "i" } },
                          { tags: { $elemMatch: { $regex: queryFilter.searchTerm, $options: "i" } } },
                      ],
                  }
                : {}),
            ...(queryFilter.minRating !== undefined ? { ratings: { $gte: queryFilter.minRating } } : {}),
            ...(queryFilter.minPrice !== undefined ? { minVariantPrice: { $gte: queryFilter.minPrice } } : {}),
            ...(queryFilter.maxPrice !== undefined ? { minVariantPrice: { $lte: queryFilter.maxPrice } } : {}),
        };

        const pipeline: any[] = [
            { $match: baseMatch },
            { $addFields: { minVariantPrice: { $min: "$variants.retailPrice" } } },
            { $match: matchConditions },
            { $unset: ["minVariantPrice"] },
            { $sort: { createdAt: -1 } },
            { $project: { _name: 0 } },
        ];

        const totalCountPipeline = [
            { $match: baseMatch },
            { $addFields: { minVariantPrice: { $min: "$variants.retailPrice" } } },
            { $match: matchConditions },
            { $count: "count" },
        ];

        if (skip && skip !== 0) pipeline.push({ $skip: skip });
        if (limit && limit !== 0) pipeline.push({ $limit: limit });

        const [products, totalCount] = await Promise.all([
            // Get the products with pagination
            ProductModel.aggregate(pipeline).toArray(),
            // Get the filtered product count
            ProductModel.collection.aggregate(totalCountPipeline).toArray(),
        ]);

        return [products, totalCount?.length > 0 ? totalCount[0].count : 0];
    }

    public static async getById(ids: (string | ObjectId)[]): Promise<IProduct[]>;
    public static async getById(id: string | ObjectId): Promise<IProduct | null>;
    public static async getById(ids: string | ObjectId | (string | ObjectId)[]): Promise<IProduct | IProduct[] | null> {
        if (Array.isArray(ids)) {
            const result = (
                await Promise.all(ids.map(async (id) => (await ZodObjectId.safeParseAsync(id)).data))
            ).filter((id) => id !== undefined);

            return ProductModel.find({ _id: { $in: result }, isDeleted: false }, { projection: { _name: 0 } });
        } else {
            const result = await ZodObjectId.safeParseAsync(ids);
            if (result.error) return null;

            return ProductModel.findOne({ _id: result.data, isDeleted: false }, { projection: { _name: 0 } });
        }
    }

    public static async getRelevantProducts(ids: (string | ObjectId)[]): Promise<IRelevantProduct[]> {
        const result = (await Promise.all(ids.map(async (id) => (await ZodObjectId.safeParseAsync(id)).data))).filter(
            (id) => id !== undefined
        );

        const pipeline = [
            { $match: { _id: { $in: result }, isDeleted: false } },
            { $unwind: "$variants" },
            {
                $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    images: { $first: "$images" },
                    ratings: { $first: "$ratings" },
                    retailPrice: { $min: "$variants.retailPrice" },
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    images: 1,
                    ratings: 1,
                    retailPrice: 1,
                },
            },
        ];

        return ProductModel.collection.aggregate<IRelevantProduct>(pipeline).toArray();
    }

    public static async getBrands(): Promise<string[]> {
        return ProductModel.distinct("brand", { isDeleted: false });
    }

    // Mutate
    public static async insert(products: IReqProduct.Insert[]): Promise<IProduct[]> {
        const insertData = products.map((product, i) => ({
            ...product,
            _name: product.name,
            createdAt: new Date(new Date().getTime() + i),
        }));

        const insertedProducts = await ProductModel.insertMany(insertData);
        return insertedProducts.map(({ _name, ...product }) => product);
    }

    public static async updateById(id: string | ObjectId, data: IReqProduct.Update): Promise<IProduct> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("Product not found");

        const updateData = {
            ...data,
            _name: data.name ? data.name : undefined,
            updatedAt: new Date(),
        };

        const product = await ProductModel.findOneAndUpdate(
            { _id: result.data, isDeleted: false },
            removeUndefinedKeys(updateData),
            { returnDocument: "after", projection: { _name: 0 } }
        );
        if (!product) throw new NotFoundError("Product not found");

        return product;
    }

    public static async updateImages(id: string | ObjectId, images: Buffer): Promise<string> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("Product not found");

        const { url, deleteUrl } = await ImgbbService.uploadImage(images);

        const updateResult = await ProductModel.collection
            .updateOne(
                { _id: result.data, isDeleted: false },
                { $push: { images: url }, $set: { updatedAt: new Date() } }
            )
            .catch(async (err) => {
                await fetch(deleteUrl, { method: "GET" });
                throw err;
            });

        if (updateResult.matchedCount === 0) throw new NotFoundError("Product not found");
        return url;
    }

    public static async updateVariantQuantity(
        id: string | ObjectId,
        variantId: string,
        quantityOffset: number
    ): Promise<IProduct> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("Product not found");

        const product = await ProductModel.collection.findOne(
            { _id: result.data, isDeleted: false, "variants.id": variantId },
            { projection: { "variants.$": 1 } }
        );

        if (!product || !product.variants || product.variants.length === 0)
            throw new NotFoundError("Product or variant not found");

        const variant = product.variants[0];
        if (variant.quantity + quantityOffset < 0)
            throw new BadRequestError("Insufficient stock for this variant", { productId: id, variantId });

        const updatedProduct = await ProductModel.collection.findOneAndUpdate(
            { _id: result.data, isDeleted: false, variants: { $elemMatch: { id: variantId } } },
            { $inc: { "variants.$.quantity": quantityOffset }, $set: { updatedAt: new Date() } },
            { returnDocument: "after", projection: { _name: 0 } }
        );
        if (!updatedProduct) throw new NotFoundError("Product not found");

        return updatedProduct;
    }

    public static async updateRelatedProducts(associationRules: AssociationRule[]): Promise<void> {
        const updateData = new Map<string, ObjectId[]>();

        await Promise.all(
            associationRules.map(async (rule) => {
                const existing = updateData.get(rule.antecedent) ?? [];
                existing.push(await ZodObjectId.parseAsync(rule.consequent));
                updateData.set(rule.antecedent, existing);
            })
        );

        const bulkOperations = await Promise.all(
            Array.from(updateData.entries()).map(async ([antecedent, consequences]) => ({
                updateOne: {
                    filter: { _id: await ZodObjectId.parseAsync(antecedent) },
                    update: { $set: { relevantProducts: consequences } },
                },
            }))
        );

        if (bulkOperations.length > 0) await ProductModel.collection.bulkWrite(bulkOperations);
    }

    public static async deleteById(id: string | ObjectId): Promise<IProduct> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("Product not found");

        const product = await ProductModel.findOneAndUpdate(
            { _id: result.data, isDeleted: false },
            { isDeleted: true, updatedAt: new Date() },
            { returnDocument: "after", projection: { _name: 0 } }
        );
        if (!product) throw new NotFoundError("Product not found");

        return product;
    }

    public static async deleteByIdPermanent(id: string | ObjectId): Promise<IProduct> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("Product not found");

        const product = await ProductModel.findByIdAndDelete(result.data, { projection: { _name: 0 } });
        if (!product) throw new NotFoundError("Product not found");

        return product;
    }
}
