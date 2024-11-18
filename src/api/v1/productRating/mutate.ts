import ApiController from "../../apiController.js";
import OrderService from "../../../services/internal/order.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";
import ProductRatingService from "../../../services/internal/productRating.js";
import { isAuthorizeToInsertProductRating } from "../../../utils/authorize.js";

import type { ObjectId } from "mongooat";
import type { IReqProductRating } from "../../../interfaces/api/request.js";
import type { IProductRating } from "../../../interfaces/database/product.js";
import ProductService from "../../../services/internal/product.js";

export const insert = ApiController.callbackFactory<{}, { body: IReqProductRating.PreprocessInsert }, IProductRating>(
    async (req, res, next) => {
        try {
            const { body } = req;
            const { user } = req.ctx;

            await isAuthorizeToInsertProductRating(user, body);

            const { orderId, ...productRatingData } = body;

            const productRating = (await ProductRatingService.insert([productRatingData]))[0];
            await OrderService.updateProductRating(parseInt(`${orderId}`), body.productId, productRating._id);

            const productRatings = await ProductRatingService.getByProductId(productRating.productId, {});

            const products = Array.from(
                productRatings.reduce((acc, { productId, rating }) => {
                    if (!acc.has(productId)) acc.set(productId, []);
                    acc.get(productId)!.push(rating);

                    return acc;
                }, new Map<string | ObjectId, number[]>())
            ).map(([productId, ratings]) => {
                const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
                return { productId, avgRating };
            });

            await ProductService.updateRatings(products);

            return res.status(201).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: productRating,
            });
        } catch (err) {
            next(err);
        }
    }
);

export const updateById = ApiController.callbackFactory<
    { id: string },
    { body: IReqProductRating.Update },
    IProductRating
>(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { body } = req;

        const productRating = await ProductRatingService.updateById(id, body);

        const productRatings = await ProductRatingService.getByProductId(productRating.productId, {});

        const products = Array.from(
            productRatings.reduce((acc, { productId, rating }) => {
                if (!acc.has(productId)) acc.set(productId, []);
                acc.get(productId)!.push(rating);

                return acc;
            }, new Map<string | ObjectId, number[]>())
        ).map(([productId, ratings]) => {
            const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
            return { productId, avgRating };
        });

        await ProductService.updateRatings(products);

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: productRating,
        });
    } catch (err) {
        next(err);
    }
});

export const deleteById = ApiController.callbackFactory<{ id: string }, {}, IProductRating>(async (req, res, next) => {
    try {
        const { id } = req.params;

        const productRating = await ProductRatingService.deleteById(id);

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: productRating,
        });
    } catch (err) {
        next(err);
    }
});
