import { z } from "zod";
import ApiController from "../../apiController.js";
import ProductService from "../../../services/internal/product.js";
import { PRODUCT_CATEGORY, RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import { ValidateError } from "mongooat";
import NotFoundError from "../../../errors/NotFoundError.js";

import type { IReqProduct } from "../../../interfaces/api/request.js";
import type { IRelevantProduct } from "../../../interfaces/database/product.js";
import type { IResGetAll, IResGetById } from "../../../interfaces/api/response.js";

const categoriesQuerySchema = z.preprocess(
    (value) => (value ? [value].flat() : value),
    z.array(z.nativeEnum(PRODUCT_CATEGORY)).optional()
);

const querySchema = z
    .object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),

        name: z.string().optional(),
        searchTerm: z.string().optional(),
        categories: categoriesQuerySchema,
        brands: z.preprocess((value) => (value ? [value].flat() : value), z.array(z.string()).optional()),
        minRating: z.coerce.number().int().positive().optional(),
        minPrice: z.coerce.number().int().positive().optional(),
        maxPrice: z.coerce.number().int().positive().optional(),
    })
    .strict()
    .refine(
        (data) => {
            if (!data.limit && data.page) return false;
            return true;
        },
        { message: "'limit' must be provided if 'page' is provided", path: ["limit"] }
    )
    .refine(
        (data) => {
            if (data.minPrice && data.maxPrice && data.minPrice > data.maxPrice) return false;
            return true;
        },
        { message: "'minPrice' must be less than 'maxPrice'", path: ["minPrice", "maxPrice"] }
    );

export const getAll = ApiController.callbackFactory<{}, { query: IReqProduct.GetAllQuery }, IResGetAll.Product>(
    async (req, res, next) => {
        try {
            const { query } = req;

            const validatedQuery = await querySchema.safeParseAsync(query);
            if (!validatedQuery.success)
                throw new ValidateError("Invalid query parameters", validatedQuery.error.errors);

            const [products, totalDocuments] = await ProductService.getAll(validatedQuery.data);

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: { products, totalDocuments },
            });
        } catch (err) {
            next(err);
        }
    }
);

export const getProductById = ApiController.callbackFactory<{ id: string }, {}, IResGetById.Product>(
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const product = await ProductService.getById(id);
            if (!product) throw new NotFoundError("Product not found");

            let relevantProducts: IRelevantProduct[] = [];
            if (product.relevantProducts)
                relevantProducts = await ProductService.getRelevantProducts(product.relevantProducts);

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: { product, relevantProducts },
            });
        } catch (err) {
            next(err);
        }
    }
);

export const getBrands = ApiController.callbackFactory<{}, { query: { categories?: PRODUCT_CATEGORY[] } }, string[]>(
    async (req, res, next) => {
        try {
            const result = await categoriesQuerySchema.safeParseAsync(req.query.categories);
            if (result.error) throw new ValidateError("Invalid query parameters", result.error.errors);

            const brands = await ProductService.getBrands(result.data);

            return res
                .status(200)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: brands });
        } catch (err) {
            next(err);
        }
    }
);
