import type { IProduct } from "../database/product.js";
import type { IOrderItem } from "../database/order.js";
import type { IAddress, IUserProfile } from "../database/user.js";
import type ECommServerError from "../../errors/ECommServerError.js";
import type { ORDER_STATUS, RESPONSE_CODE, RESPONSE_MESSAGE } from "../../constants.js";

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
