import ApiController from "../../apiController.js";
import CartService from "../../../services/internal/cart.js";
import OrderService from "../../../services/internal/order.js";
import ProductService from "../../../services/internal/product.js";
import { ORDER_STATUS, RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import NotFoundError from "../../../errors/NotFoundError.js";

import type { IOrder } from "../../../interfaces/database/order.js";
import type { IReqOrder } from "../../../interfaces/api/request.js";

export const insert = ApiController.callbackFactory<{}, { body: IReqOrder.Insert | IReqOrder.Insert[] }, IOrder[]>(
    async (req, res, next) => {
        try {
            const { body } = req;
            const data = Array.isArray(body) ? body : [body];

            const cartItems = await Promise.all(data.map(async (order) => CartService.validateCartItems(order.items)));

            const productIds = Array.from(new Set(cartItems.flat().map((item) => item.productId)));
            const products = await ProductService.getById(productIds);

            const ordersData = data.map(async (order) => {
                if (!order.status) order.status = ORDER_STATUS.PACKAGING;

                const orderItems = order.items.map((item) => {
                    const product = products.find((p) => p._id === item.productId);
                    if (!product) throw new NotFoundError();

                    const variant = product.variants.find((v) => v.id === item.variantId);
                    if (!variant) throw new NotFoundError();

                    const { quantity, ...rest } = variant;

                    return {
                        product: {
                            _id: product._id,
                            name: product.name,
                            images: product.images,
                        },
                        variant: rest,
                        quantity: item.quantity,
                    };
                });

                const totalPrice = orderItems.reduce((acc, item) => acc + item.variant.retailPrice * item.quantity, 0);

                return {
                    ...order,
                    items: orderItems,
                    totalPrice,
                };
            });

            const orders = await OrderService.insert(ordersData);

            return res.status(201).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: orders,
            });
        } catch (err) {
            next(err);
        }
    }
);

export const updateById = ApiController.callbackFactory<{ id: string }, { body: IReqOrder.Update }, IOrder>(
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { body } = req;

            if (isNaN(parseInt(id))) throw new NotFoundError();

            const order = await OrderService.updateById(parseInt(id), body);
            return res.json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: order });
        } catch (err) {
            next(err);
        }
    }
);

export const deleteById = ApiController.callbackFactory<{ id: string }, {}, IOrder>(async (req, res, next) => {
    try {
        const { id } = req.params;

        if (isNaN(parseInt(id))) throw new NotFoundError();

        const order = await OrderService.deleteById(parseInt(id));
        return res.json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: order });
    } catch (err) {
        next(err);
    }
});

// export const checkout = ApiController.callbackFactory<{}, { body: IReqOrder.Insert }, IOrder>(
//     async (req, res, next) => {
//         try {
//             const { body } = req;

//             const order = await OrderService.checkout(body);
//             res.status(201).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: order });
//         } catch (err) {
//             next(err);
//         }
//     }
// );
