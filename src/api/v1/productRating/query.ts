import ApiController from "../../apiController.js";
import UserService from "../../../services/internal/user.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";
import ProductRatingService from "../../../services/internal/productRating.js";

import NotFoundError from "../../../errors/NotFoundError.js";

import type { IResGetProductRatingByProductId } from "../../../interfaces/api/response.js";

export const getByProductId = ApiController.callbackFactory<
    { productId: string },
    {},
    IResGetProductRatingByProductId[]
>(async (req, res, next) => {
    try {
        const { productId } = req.params;

        const productRatings = await ProductRatingService.getByProductId(productId);

        const ratings: IResGetProductRatingByProductId[] = (
            await Promise.all(
                productRatings.map(async ({ userId, ...rest }) => {
                    const user = await UserService.getById(userId);
                    if (!user) return null;

                    const profile = { _id: user._id, name: user.name, avatarUrl: user.avatarUrl };
                    return {
                        ...rest,
                        user: profile,
                    };
                })
            )
        ).filter((rating) => rating !== null);

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: ratings,
        });
    } catch (err) {
        next(err);
    }
});

export const getById = ApiController.callbackFactory<{ id: string }, {}, IResGetProductRatingByProductId>(
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const productRating = await ProductRatingService.getById(id);

            const user = await UserService.getById(productRating.userId);
            if (!user) throw new NotFoundError("User not found");

            const profile = { _id: user._id, name: user.name, avatarUrl: user.avatarUrl };
            const rating: IResGetProductRatingByProductId = { ...productRating, user: profile };

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: rating,
            });
        } catch (err) {
            next(err);
        }
    }
);
