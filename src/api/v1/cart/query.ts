import ApiController from "../../apiController.js";
import CartService from "../../../services/internal/cart.js";
import ProductService from "../../../services/internal/product.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import NotFoundError from "../../../errors/NotFoundError.js";

import type { ObjectId } from "mongooat";
import type { ICart } from "../../../interfaces/database/cart.js";
import type { IResGetById } from "../../../interfaces/api/response.js";

export const getAll = ApiController.callbackFactory<{}, {}, ICart[]>(async (req, res, next) => {
    try {
        const carts = await CartService.getAll();
        res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: carts });
    } catch (err) {
        next(err);
    }
});

export const getById = ApiController.callbackFactory<{ id: string }, {}, IResGetById.Cart>(async (req, res, next) => {
    try {
        const { id } = req.params;

        const cart = await CartService.getById(id);
        if (!cart) throw new NotFoundError("Cart not found");

        const cartProductIds = cart.items.map((item) => item.productId);
        const cartProducts = await ProductService.getById(cartProductIds);

        const notExistProducts: ObjectId[] = [];
        const items = cart.items.reduce((acc: IResGetById.Cart["items"], item) => {
            const product = cartProducts.find((product) => product._id.equals(item.productId));
            if (!product) {
                notExistProducts.push(item.productId);
                return acc;
            }

            acc.push({
                variantId: item.variantId,
                quantity: item.quantity,
                product,
            });
            return acc;
        }, []);

        if (notExistProducts.length > 0) {
            await CartService.updateById(id, {
                items: cart.items.filter((item) => !notExistProducts.includes(item.productId)),
            });
        }

        res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: {
                items,
                _id: cart._id,
                updatedAt: cart.updatedAt,
            },
        });
    } catch (err) {
        next(err);
    }
});
