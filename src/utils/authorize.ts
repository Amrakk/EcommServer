import { USER_ROLE } from "../constants.js";

import type { IUser } from "../interfaces/database/user.js";
import type { IReqUser } from "../interfaces/api/request.js";

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
