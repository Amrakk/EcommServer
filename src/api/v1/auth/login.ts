import ApiController from "../../apiController.js";
import CartService from "../../../services/internal/cart.js";
import UserService from "../../../services/internal/user.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";
import { setAccToken, setRefToken } from "../../../utils/tokenHandlers.js";
import { googleRedirect } from "../../../middlewares/googleAuthentication.js";

import NotFoundError from "../../../errors/NotFoundError.js";

import type { ICart } from "../../../interfaces/database/cart.js";
import type { IUser } from "../../../interfaces/database/user.js";
import type { IReqAuth } from "../../../interfaces/api/request.js";
import type { IResLogin } from "../../../interfaces/api/response.js";

export const login = ApiController.callbackFactory<{}, { body: IReqAuth.Login }, IResLogin>(async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await UserService.login(email, password);

        let cart: ICart | null = null;

        const cartPromise = new Promise<void>(async (res) => {
            if (user.cartId)
                cart = await CartService.getById(user.cartId)
                    .then(async (data) => {
                        if (!data) await UserService.updateById(user._id, { cartId: undefined });
                        return data;
                    })
                    .catch((err) => {
                        if (!(err instanceof NotFoundError)) throw err;
                        return null;
                    });
            res();
        });

        await Promise.all([setAccToken(user._id, res), setRefToken(user._id, res), cartPromise]);

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: { user, cart },
        });
    } catch (err) {
        next(err);
    }
});

export const google = ApiController.callbackFactory<{}, {}, {}>(async (req, res, next) => {
    try {
        return googleRedirect(req, res, next);
    } catch (err) {
        next(err);
    }
});

export const googleCallback = ApiController.callbackFactory<{}, {}, IResLogin>(async (req, res, next) => {
    try {
        const user = req.user as IUser;

        let cart: ICart | null = null;

        const cartPromise = new Promise<void>(async (res) => {
            if (user.cartId)
                cart = await CartService.getById(user.cartId).catch((err) => {
                    if (!(err instanceof NotFoundError)) throw err;
                    return null;
                });
            res();
        });

        await Promise.all([setAccToken(user._id, res), setRefToken(user._id, res), cartPromise]);

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: { user, cart },
        });
    } catch (err) {
        next(err);
    }
});
