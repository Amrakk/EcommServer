import OrderService from "../services/internal/order.js";
import { ORDER_STATUS, USER_ROLE } from "../constants.js";

import NotFoundError from "../errors/NotFoundError.js";
import ForbiddenError from "../errors/ForbiddenError.js";
import BadRequestError from "../errors/BadRequestError.js";

import type { IUser } from "../interfaces/database/user.js";
import type { IReqProductRating, IReqUser } from "../interfaces/api/request.js";

export function isAuthorizeToUpdateUser(
    requestUser: IUser,
    targetUserId: string,
    body: IReqUser.UpdateUser | IReqUser.UpdateAdmin
): boolean {
    const isSelfUpdate = requestUser._id.toString() === targetUserId;

    if (requestUser.role !== USER_ROLE.ADMIN && !isSelfUpdate) return false;

    if (requestUser.role !== USER_ROLE.ADMIN) {
        const allowedUpdates = [
            "name",
            "email",
            "cartId",
            "password",
            "addresses",
            "avatarUrl",
            "phoneNumber",
            "socialMediaAccounts",
        ];
        const updates = Object.keys(body);
        return updates.every((update) => allowedUpdates.includes(update));
    }

    return true;
}

export function isAuthorizeToGetOrder(requestUser: IUser, params: { targetOrderId?: number; targetUserId?: string }) {
    let isSelfGet: boolean = false;
    if (params.targetOrderId) isSelfGet = requestUser.orderHistory.some((orderId) => orderId === params.targetOrderId);
    else if (params.targetUserId) isSelfGet = requestUser._id.toString() === params.targetUserId;
    return requestUser.role === USER_ROLE.ADMIN || isSelfGet;
}

export async function isAuthorizeToInsertProductRating(
    requestUser: IUser,
    body: IReqProductRating.PreprocessInsert
): Promise<void> {
    if (!body.orderId && isNaN(parseInt(`${body.orderId}`))) throw new NotFoundError("Order not found");

    const order = await OrderService.getById(parseInt(`${body.orderId}`));

    if (!order) throw new NotFoundError("Order not found");
    if (`${order.userId}` !== `${requestUser._id}`) throw new ForbiddenError();

    if (order.status !== ORDER_STATUS.COMPLETED) throw new BadRequestError("Order is not completed yet");

    const product = order.items.find((item) => `${item.product._id}` === `${body.productId}`);
    if (!product) throw new BadRequestError("Product not found in order");
    if (product.productRatingId) throw new BadRequestError("Product already rated");
}
