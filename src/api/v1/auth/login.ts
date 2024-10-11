import ApiController from "../../apiController.js";
import CartService from "../../../services/cart.js";
import UserService from "../../../services/user.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";
import { setAccToken, setRefToken } from "../../../utils/tokenHandlers.js";

import NotFoundError from "../../../errors/NotFoundError.js";

import type { ICart } from "../../../interfaces/database/cart.js";
import type { IUser } from "../../../interfaces/database/user.js";
import type { IReqLogin } from "../../../interfaces/api/request.js";

interface IResLogin {
    user: Omit<IUser, "password">;
    cart: ICart | null;
}

export const login = ApiController.callbackFactory<{}, IReqLogin, IResLogin>(async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await UserService.login(email, password);

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
