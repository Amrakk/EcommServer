import type { ObjectId } from "mongooat";
import type { ICart } from "../database/cart.js";
import type { IProduct } from "../database/product.js";
import type { IOrder, IOrderItem } from "../database/order.js";
import type ECommServerError from "../../errors/ECommServerError.js";
import type { IAddress, ISocialMediaAccount, IUser, IUserProfile } from "../database/user.js";
import type { ORDER_STATUS, RESPONSE_CODE, RESPONSE_MESSAGE, USER_ROLE, USER_STATUS } from "../../constants.js";

// CORE RESPONSE INTERFACE
export interface IResponse<T = undefined> {
    /** Response code */
    code: RESPONSE_CODE;
    /** Response message */
    message: RESPONSE_MESSAGE;
    /** Response data */
    data?: T;
    /** Error details */
    error?: ECommServerError | Record<string, unknown> | Array<unknown>;
}

// API RESPONSE INTERFACES
export interface IResLogin {
    user: Omit<IUser, "password">;
    cart: ICart | null;
}

/**
 * This remove password and modify orderHistory to be an array of order objects
 */
export interface IResUserGetById {
    _id: ObjectId;
    name: string;
    email: string;
    phoneNumber?: string;
    loyaltyPoint: number;
    addresses: IAddress[];
    role: USER_ROLE;
    status: USER_STATUS;
    avatarUrl: string;
    socialMediaAccounts: ISocialMediaAccount[];
    cartId?: ObjectId;
    orderHistory: IOrder[];
}

export interface IResOtherGetById {
    _id: number;
    user: IUserProfile | null;
    items: IOrderItem[];
    discount?: number;
    totalPrice: number;
    isPaid: boolean;
    shippingAddress: IAddress;
    status: ORDER_STATUS;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAdminDashboard {
    totalUsers: number;
    newUsers: number;
    totalOrders: number;
    totalRevenue: number;
    bestSellingProducts: IProduct[];
}

export interface IOrderOverview {
    orderId: number;
    buyerName: string;
    purchaseTime: Date;
    /** Total amount after discount */
    totalAmount: number;
    discountApplied?: boolean;
    status: ORDER_STATUS;
}

export interface IOrderDetail {
    orderId: number;
    items: IOrderItem[];
    discount?: number;
    totalPrice: number;
    buyer: IUserProfile;
    shippingAddress: IAddress;
    status: ORDER_STATUS;
}
