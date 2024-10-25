import { ObjectId } from "mongooat";
import mongooat from "../../../database/db.js";
import ApiController from "../../apiController.js";
import GHNService from "../../../services/external/ghn.js";
import CartService from "../../../services/internal/cart.js";
import UserService from "../../../services/internal/user.js";
import OrderService from "../../../services/internal/order.js";
import ProductService from "../../../services/internal/product.js";
import VoucherService from "../../../services/internal/voucher.js";
import TransactionService from "../../../services/internal/transaction.js";
import { sendInvoiceEmail } from "../../../utils/mailHandlers/mailHandlers.js";
import { updateProductQuantity } from "../../../utils/updateProductQuantity.js";
import { ORDER_STATUS, RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import { ValidateError } from "mongooat";
import NotFoundError from "../../../errors/NotFoundError.js";
import BadRequestError from "../../../errors/BadRequestError.js";
import ServiceResponseError from "../../../errors/ServiceResponseError.js";

import type { IReqOrder } from "../../../interfaces/api/request.js";
import type { ICartItem } from "../../../interfaces/database/cart.js";
import type { IResCheckout } from "../../../interfaces/api/response.js";
import type { IProduct } from "../../../interfaces/database/product.js";
import type { IOrder, IOrderItem, ITransaction } from "../../../interfaces/database/order.js";

export const insert = ApiController.callbackFactory<
    {},
    { body: IReqOrder.PreprocessInsert | IReqOrder.PreprocessInsert[] },
    IOrder[]
>(async (req, res, next) => {
    const session = mongooat.getBase().startSession();
    try {
        const { body } = req;
        const data = Array.isArray(body) ? body : [body];

        const cartItems = await Promise.all(data.map(async (order) => CartService.validateCartItems(order.items)));

        const productIds = Array.from(new Set(cartItems.flat().map((item) => item.productId)));
        const products = await ProductService.getById(productIds);

        const ordersData: IReqOrder.Insert[] = data.map((order) => {
            if (!order.status) order.status = ORDER_STATUS.PACKAGING;

            const orderItems = getOrderItems(order.items, products);
            const totalPrice = calculateTotalPrice(orderItems);

            return {
                ...order,
                items: orderItems,
                totalPrice,
            };
        });

        let orders: IOrder[] = [];

        await session.withTransaction(async () => {
            const insertedOrders = await OrderService.insert(ordersData);

            await Promise.all([
                updateProductQuantity(
                    ordersData.flatMap((order) => order.items),
                    products
                ),
                ...insertedOrders.map((order) => UserService.insertOrderHistory(order.userId, order._id)),
            ]);

            orders = insertedOrders;
        });

        if (orders.length !== data.length)
            throw new ServiceResponseError("MongoDB", "insert", "Insert failed", { data });

        return res.status(201).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: orders,
        });
    } catch (err) {
        next(err);
    } finally {
        session.endSession();
    }
});

export const updateById = ApiController.callbackFactory<{ id: string }, { body: IReqOrder.PreprocessUpdate }, IOrder>(
    async (req, res, next) => {
        const session = mongooat.getBase().startSession();
        try {
            const { id } = req.params;
            const { body } = req;

            if (isNaN(parseInt(id))) throw new NotFoundError();

            const { items, ...rest } = body;
            let orderData: IReqOrder.Update = { ...rest };
            let products: IProduct[] = [];
            let orderItems: IOrderItem[] = [];

            const isTransactionCreated = await TransactionService.getByOrderId(parseInt(id));
            if (
                isTransactionCreated &&
                ("userId" in body || "items" in body || "discount" in body || "shippingAddress" in body)
            )
                throw new BadRequestError(
                    "Cannot update userId, items, discount, shippingAddress after transaction created",
                    { id, body }
                );

            if (body.items) {
                const productIds = Array.from(new Set(body.items.map((item) => item.productId)));
                products = await ProductService.getById(productIds);

                orderItems = getOrderItems(body.items, products);
                const totalPrice = calculateTotalPrice(orderItems);

                orderData.items = orderItems;
                orderData.totalPrice = totalPrice;
            }

            let order: IOrder | undefined = undefined;
            await session.withTransaction(async () => {
                const beforeUpdatedOrder = await OrderService.updateById(parseInt(id), orderData, "before");
                const promises = [];
                if (body.userId) {
                    promises.push(UserService.insertOrderHistory(body.userId, beforeUpdatedOrder._id));
                    promises.push(UserService.removeOrderHistory(beforeUpdatedOrder.userId, beforeUpdatedOrder._id));
                }

                if (body.items) {
                    const beforeUpdatedCartItems = beforeUpdatedOrder.items.map(({ quantity, ...rest }) => ({
                        ...rest,
                        quantity: -quantity,
                    }));
                    const productIds = Array.from(new Set(beforeUpdatedCartItems.map((item) => item.product._id)));
                    products.push(...(await ProductService.getById(productIds)));

                    promises.push(updateProductQuantity([...beforeUpdatedCartItems, ...orderItems], products));
                }

                await Promise.all(promises);

                order = {
                    ...beforeUpdatedOrder,
                    ...body,
                    items: orderItems.length === 0 ? beforeUpdatedOrder.items : orderItems,
                    userId: new ObjectId(body.userId || beforeUpdatedOrder.userId),
                };
            });

            if (!order) throw new ServiceResponseError("MongoDB", "updateById", "Update failed", { id, body });

            return res.json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: order });
        } catch (err) {
            next(err);
        } finally {
            session.endSession();
        }
    }
);

export const deleteById = ApiController.callbackFactory<{ id: string }, {}, IOrder>(async (req, res, next) => {
    const session = mongooat.getBase().startSession();
    try {
        const { id } = req.params;

        if (isNaN(parseInt(id))) throw new NotFoundError();

        const isTransactionCreated = await TransactionService.getByOrderId(parseInt(id));
        if (isTransactionCreated) throw new BadRequestError("Cannot delete order after transaction created.", { id });

        let order: IOrder | undefined = undefined;
        await session.withTransaction(async () => {
            const deletedOrder = await OrderService.deleteById(parseInt(id));

            const promises = [];
            promises.push(UserService.removeOrderHistory(deletedOrder.userId, deletedOrder._id));

            const orderCartItems = deletedOrder.items.map(({ quantity, ...rest }) => ({
                ...rest,
                quantity: -quantity,
            }));
            const productIds = Array.from(new Set(orderCartItems.map((item) => item.product._id)));
            const products = await ProductService.getById(productIds);

            promises.push(updateProductQuantity(orderCartItems, products));
            await Promise.all(promises);

            order = deletedOrder;
        });

        if (!order) throw new ServiceResponseError("MongoDB", "deleteById", "Delete failed", { id });

        return res.json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: order });
    } catch (err) {
        next(err);
    } finally {
        session.endSession();
    }
});

export const checkout = ApiController.callbackFactory<{}, { body: IReqOrder.Checkout }, IResCheckout>(
    async (req, res, next) => {
        const session = mongooat.getBase().startSession();
        try {
            const { body } = req;
            const { user } = req.ctx;

            const { shippingAddress, paymentType, usePoints, voucherCode } = body;

            // Get Order Items
            if (!user.cartId)
                throw new ValidateError("Cart is empty", [
                    { code: "custom", message: "Cart is empty", path: ["cartId"] },
                ]);

            const cartItems = await CartService.getById(user.cartId);
            if (!cartItems || cartItems.items.length === 0)
                throw new ValidateError("Cart is empty", [
                    { code: "custom", message: "Cart is empty", path: ["cartId"] },
                ]);

            const productIds = Array.from(new Set(cartItems.items.map((item) => item.productId)));
            const products = await ProductService.getById(productIds);

            const orderItems = getOrderItems(cartItems.items, products);
            const totalPrice = calculateTotalPrice(orderItems);

            // Get Discount
            let discount = 0;

            if (voucherCode) {
                const voucher = await VoucherService.validateCode(voucherCode);
                if (!voucher)
                    throw new ValidateError("Voucher is invalid", [
                        { code: "custom", message: "Voucher is invalid", path: ["voucherCode"] },
                    ]);

                discount += await VoucherService.redeemVoucher(voucher, totalPrice);
            }

            if (usePoints && user.loyaltyPoint && discount < totalPrice) {
                const pointUsed = Math.ceil(Math.min(user.loyaltyPoint * 1000, totalPrice - discount) / 1000);

                user.loyaltyPoint = user.loyaltyPoint - pointUsed;
                discount = Math.min(discount + pointUsed * 1000, totalPrice);
            }

            /**
             * Update steps
             * TODO: Implement rollback mechanism when error occurs
             * IMPORTANT: WithTransaction seem not to work
             */
            let order: IOrder | undefined = undefined;
            let transaction: ITransaction | undefined = undefined;

            await session.withTransaction(async () => {
                // Create Order
                const orderData: IReqOrder.Insert = {
                    userId: user._id,
                    discount,
                    totalPrice,
                    shippingAddress,
                    items: orderItems,
                };

                const [orders, shippingFee] = await Promise.all([
                    OrderService.insert([orderData]),
                    GHNService.getShippingFee(shippingAddress.district.id, shippingAddress.ward.code),
                ]);

                order = { ...orders[0] };
                user.orderHistory.push(order._id);

                const [newTransaction] = await Promise.all([
                    // Create Transaction
                    TransactionService.insert({
                        userId: user._id,
                        orderId: order._id,
                        paymentType,
                        paymentAmount: totalPrice - discount,
                        shippingFee: shippingFee,
                    }),
                    // Update Product Quantity
                    updateProductQuantity(orderItems, products),
                    // Update User
                    UserService.updateById(user._id, {
                        loyaltyPoint: user.loyaltyPoint,
                        orderHistory: user.orderHistory,
                    }),
                    CartService.updateById(user.cartId!, { items: [] }),
                ]);

                transaction = { ...newTransaction };
            });

            if (!order || !transaction)
                throw new ServiceResponseError("MongoDB", "Checkout", "Checkout failed", {
                    body,
                    order,
                    cartItems,
                    transaction,
                });

            // Send Invoice via Email
            sendInvoiceEmail(user, order, transaction);

            return res
                .status(201)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: { order, transaction } });
        } catch (err) {
            next(err);
        } finally {
            session.endSession();
        }
    }
);

function getOrderItems(cartItems: ICartItem[], products: IProduct[]) {
    return cartItems.map((item) => {
        const product = products.find((p) => `${p._id}` === `${item.productId}`);
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
}

function calculateTotalPrice(orderItems: IOrderItem[]) {
    return orderItems.reduce((acc, item) => acc + item.variant.retailPrice * item.quantity, 0);
}
