import type { ObjectId } from "mongooat";
import type { ICartItem } from "../database/cart.js";
import type { IOrderItem } from "../database/order.js";
import type { IProductVariant } from "../database/product.js";
import type { IAddress, ISocialMediaAccount } from "../database/user.js";
import type {
    USER_ROLE,
    USER_STATUS,
    ORDER_STATUS,
    PAYMENT_TYPE,
    DISCOUNT_TYPE,
    PAYMENT_STATUS,
    PRODUCT_CATEGORY,
} from "../../constants.js";

export interface IOffsetPagination {
    page?: number;
    limit?: number;
}

export interface ITimeBasedPagination {
    from?: Date;
    limit?: number;
}

// Auth
export namespace IReqAuth {
    export interface Login {
        email: string;
        password: string;
        cartId?: ObjectId | string;
    }

    export interface Google {
        cartId?: ObjectId | string;
    }

    export interface Register {
        name: string;
        email: string;
        password: string;
        phoneNumber?: string;
        address?: IAddress;
        cartId?: ObjectId | string;
    }

    export interface ForgotPassword {
        email: string;
    }

    export interface ResetPassword {
        email: string;
        otp: string;
        password: string;
    }
}

// Cart
export namespace IReqCart {
    export interface Upsert {
        items: ICartItem[];
    }
}

// Order
export namespace IReqOrder {
    export interface GetAllQuery {
        page?: string;
        limit?: string;

        searchTerm?: string;
        isPaid?: "true" | "false";
        statuses?: ORDER_STATUS[];
    }

    export interface Filter {
        /** Search by orderId or user phone number */
        searchTerm?: string;
        isPaid?: boolean;
        statuses?: ORDER_STATUS[];
    }

    export interface PreprocessInsert {
        userId: ObjectId | string;
        items: ICartItem[];
        voucherDiscount?: number;
        loyaltyPointsDiscount?: number;
        isPaid?: boolean;
        shippingAddress: IAddress;
        status?: ORDER_STATUS;
    }

    export interface Insert {
        userId: ObjectId | string;
        items: IOrderItem[];
        voucherDiscount?: number;
        loyaltyPointsDiscount?: number;
        isPaid?: boolean;
        shippingAddress: IAddress;
        totalPrice: number;
        status?: ORDER_STATUS;
    }

    export interface PreprocessUpdate {
        userId?: ObjectId | string;
        items?: ICartItem[];
        voucherDiscount?: number;
        loyaltyPointsDiscount?: number;
        shippingAddress?: IAddress;
        isPaid?: boolean;
        status?: ORDER_STATUS;
    }

    export interface Update {
        userId?: ObjectId | string;
        items?: IOrderItem[];
        voucherDiscount?: number;
        loyaltyPointsDiscount?: number;
        isPaid?: boolean;
        shippingAddress?: IAddress;
        totalPrice?: number;
        status?: ORDER_STATUS;
    }

    export interface Checkout {
        shippingAddress: IAddress;
        paymentType: PAYMENT_TYPE;
        usePoints?: boolean;
        voucherCode?: string;
    }
}

// Product
export namespace IReqProduct {
    export interface GetAllQuery {
        page?: string;
        limit?: string;

        /** Search by name (mainly use by Admin to search for products) */
        name?: string;
        /** Search by name, brand, category, or tags (mainly use by User to search for products) */
        searchTerm?: string;
        categories?: PRODUCT_CATEGORY[];
        brands?: string[];
        minRating?: string;
        minPrice?: string;
        maxPrice?: string;
    }

    export interface Filter {
        /** Search by name (mainly use by Admin to search for products) */
        name?: string;
        /** Search by name, brand, category, or tags (mainly use by User to search for products) */
        searchTerm?: string;
        categories?: PRODUCT_CATEGORY[];
        brands?: string[];
        minRating?: number;
        minPrice?: number;
        maxPrice?: number;
    }

    export interface Insert {
        name: string;
        description: string;
        category: PRODUCT_CATEGORY;
        brand?: string;
        variants: IProductVariant[];
        details: { [key: string]: string };
        tags: string[];
        ratings?: number;
        images?: string[];
    }

    export interface Update {
        name?: string;
        description?: string;
        category?: PRODUCT_CATEGORY;
        brand?: string;
        variants?: IProductVariant[];
        details?: { [key: string]: string };
        tags?: string[];
        ratings?: number;
        images?: string[];
    }
}

// Product Rating
export namespace IReqProductRating {
    export interface PreprocessInsert {
        userId: string | ObjectId;
        productId: string | ObjectId;
        rating: number;
        review?: string;
        orderId: number | string;
    }

    export interface Insert {
        userId: string | ObjectId;
        productId: string | ObjectId;
        rating: number;
        review?: string | undefined;
    }

    export interface Update {
        rating?: number;
        review?: string;
    }
}

// User
export namespace IReqUser {
    export interface GetAllQuery {
        page?: string;
        limit?: string;

        searchTerm?: string;
        role?: USER_ROLE[];
        status?: USER_STATUS[];
    }

    export interface Filter {
        searchTerm?: string;
        role?: USER_ROLE[];
        status?: USER_STATUS[];
    }

    export interface Insert {
        name: string;
        email: string;
        password?: string;
        role?: USER_ROLE;
        status?: USER_STATUS;
        phoneNumber?: string;
        loyaltyPoint?: number;
        addresses?: IAddress[];
        avatarUrl?: string;
        socialMediaAccounts?: ISocialMediaAccount[];
        cartId?: ObjectId | string;
        orderHistory?: number[];
    }

    export interface UpdateAdmin {
        name?: string;
        email?: string;
        password?: string;
        role?: USER_ROLE;
        status?: USER_STATUS;
        phoneNumber?: string;
        loyaltyPoint?: number;
        addresses?: IAddress[];
        avatarUrl?: string;
        socialMediaAccounts?: ISocialMediaAccount[];
        cartId?: ObjectId | string;
        orderHistory?: number[];
    }

    export interface UpdateUser {
        name?: string;
        email?: string;
        password?: string;
        phoneNumber?: string;
        addresses?: IAddress[];
        avatarUrl?: string;
        cartId?: ObjectId | string;
    }
}

// Transaction
export namespace IReqTransaction {
    export interface PreprocessInsert {
        isPaid?: boolean; // For COD only
        orderId: number;
        paymentType: PAYMENT_TYPE;
    }

    export interface Insert {
        userId: ObjectId | string;
        orderId: number;
        paymentAmount: number;
        shippingFee: number;
        paymentType: PAYMENT_TYPE;
        paymentStatus?: PAYMENT_STATUS.PAID;
    }

    export interface Update {
        paymentStatus?: PAYMENT_STATUS;
        paymentTime?: Date;
    }
}

// Voucher
export namespace IReqVoucher {
    export interface GetAllQuery {
        page?: string;
        limit?: string;

        code?: string;
        used?: "true" | "false";
        discountType?: DISCOUNT_TYPE;
    }

    export interface Filter {
        code?: string;
        used?: boolean;
        discountType?: DISCOUNT_TYPE;
    }

    export interface Insert {
        code: string;
        discount: {
            type: DISCOUNT_TYPE;
            value: number;
        };
        expirationDate: string;
    }

    export interface Update {
        code?: string;
        discount?: {
            type: DISCOUNT_TYPE;
            value: number;
        };
        expirationDate?: string;
    }

    export interface GenerateCodes {
        prefix?: string;
        count: number;
        discount: {
            type: DISCOUNT_TYPE;
            value: number;
        };
        expirationDate: string;
    }

    export interface ValidateCode {
        code: string;
    }
}

// Services
export namespace IReqServices {
    export interface GetShippingFee {
        districtId: string;
        wardCode: string;
    }

    export interface Analyze {
        supportThreshold?: number;
        confidenceThreshold?: number;
    }
}
