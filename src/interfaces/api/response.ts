import type { ObjectId } from "mongooat";
import type { ICart } from "../database/cart.js";
import type { IVoucher } from "../database/voucher.js";
import type ECommServerError from "../../errors/ECommServerError.js";
import type { IProduct, IRelevantProduct } from "../database/product.js";
import type { IOrder, IOrderItem, ITransaction } from "../database/order.js";
import type { ORDER_STATUS, RESPONSE_CODE, RESPONSE_MESSAGE, USER_ROLE, USER_STATUS } from "../../constants.js";
import type { IAddress, ISocialMediaAccount, IUser, IUserProductRating, IUserProfile } from "../database/user.js";

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

export namespace IResGetAll {
    export interface Order {
        orders: (IOrder & { customerName?: string })[];
        totalDocuments: number;
    }

    export interface Product {
        products: IProduct[];
        totalDocuments: number;
    }

    export interface ProductRating {
        productRatings: IResGetProductRatingByProductId[];
        next_from: Date | null;
    }

    export interface User {
        users: Omit<IUser, "password">[];
        totalDocuments: number;
    }

    export interface Voucher {
        vouchers: IVoucher[];
        totalDocuments: number;
    }
}

export namespace IResGetById {
    export interface Cart {
        _id: ObjectId;
        items: ICartItemDetail[];
        updatedAt: Date;
    }

    interface ICartItemDetail {
        quantity: number;
        variantId: string;
        product: IProduct;
    }

    export interface Product {
        product: IProduct;
        relevantProducts: IRelevantProduct[];
    }

    export interface User {
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

    export interface Order {
        _id: number;
        user: IUserProfile | null;
        transaction: ITransaction | null;
        items: IOrderItem[];
        voucherDiscount?: number;
        loyaltyPointsDiscount?: number;
        totalPrice: number;
        isPaid: boolean;
        shippingAddress: IAddress;
        status: ORDER_STATUS;
        createdAt: Date;
        updatedAt: Date;
    }
}

export interface IResGetProductRatingByProductId {
    _id: ObjectId;
    user: IUserProductRating;
    productId: ObjectId;
    rating: number;
    review: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IResCheckout {
    order: IOrder;
    transaction: ITransaction;
}

export namespace IResServices {
    export interface CalculateFee {
        shippingFee: number;
    }

    export interface Province {
        province_id: number;
        province_name: string;
    }

    export interface District {
        district_id: number;
        district_name: string;
        province_id: number;
    }

    export interface Ward {
        ward_code: string;
        ward_name: string;
        district_id: number;
    }

    export interface AddressCrawlStatus {
        isCrawling: boolean;
        start: Date | null;
        end: Date | null;
        duration: string;
        stat: Stat;
    }

    export interface Stat {
        provinces: Unit;
        districts: Unit;
        wards: Unit;
    }

    export interface Unit {
        length: number;
        size: string;
    }

    export interface IAdminDashboard {
        newUserData: INewUserData;
        revenueData: Record<TimeRanges, number[]>;
        topProductData: Record<"day" | "week" | "month", ProductStat[]>;
        headerData: Record<"orders" | "revenue" | "users", Metric>;
    }

    export interface INewUserData {
        users: UserData[];
        total: number;
    }

    export type Metric = {
        total: number;
        dailyRate: number;
    };

    export type UserData = {
        _id: ObjectId;
        name: string;
        avatarUrl: string;
    };

    export type TimeRanges = "7 Days" | "30 Days" | "6 Months" | "1 Year" | "All Time";

    export type ProductStat = {
        name: string;
        value: number;
    };
}
