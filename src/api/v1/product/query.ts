import { z } from "zod";
import ApiController from "../../apiController.js";
import ProductService from "../../../services/internal/product.js";
import { PRODUCT_CATEGORY, RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import { ValidateError } from "mongooat";
import NotFoundError from "../../../errors/NotFoundError.js";

import type { IProduct } from "../../../interfaces/database/product.js";
import type { IReqProduct } from "../../../interfaces/api/request.js";
import { IResGetAll } from "../../../interfaces/api/response.js";

const querySchema = z
    .object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),

        name: z.string().optional(),
        searchTerm: z.string().optional(),
        category: z.nativeEnum(PRODUCT_CATEGORY).optional(),
        brand: z.string().optional(),
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

export const getProductById = ApiController.callbackFactory<{ id: string }, {}, IProduct>(async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await ProductService.getById(id);
        if (!product) throw new NotFoundError("Product not found");

        return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: product });
    } catch (err) {
        next(err);
    }
});

export const getBrands = ApiController.callbackFactory<{}, {}, string[]>(async (req, res, next) => {
    try {
        const brands = await ProductService.getBrands();
        return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: brands });
    } catch (err) {
        next(err);
    }
});
