import type { ObjectId } from "mongooat";
import type { ICartItem } from "../database/cart.js";
import type { IProductVariant } from "../database/product.js";
import type { IAddress, ISocialMediaAccount } from "../database/user.js";
import type { ORDER_STATUS, PAYMENT_TYPE, PRODUCT_CATEGORY, USER_ROLE, USER_STATUS } from "../../constants.js";

export namespace IReqAuth {
    export interface Login {
        email: string;
        password: string;
    }

    export interface Register {
        name: string;
        email: string;
        password?: string;
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
    export interface Get {
        isSelf?: true;
    }

    export interface Insert {
        userId: ObjectId | string;
        items: ICartItem[];
        discount?: number;
        isPaid?: boolean;
        shippingAddress: IAddress;
        status?: ORDER_STATUS;
    }

    export interface Update {
        userId?: ObjectId | string;
        items?: ICartItem[];
        discount?: number;
        isPaid?: boolean;
        shippingAddress?: IAddress;
        status?: ORDER_STATUS;
    }

    // TODO: implement Checkout type
    export interface Checkout {
        userId: ObjectId | string;
        items: ICartItem[];
        shippingAddress: IAddress;
        paymentType: PAYMENT_TYPE;
        totalPrice: number;
        shippingFee: number;

        usePoints?: boolean;
        voucherCode?: string;
    }
}

// Product
export namespace IReqProduct {
    export interface Insert {
        name: string;
        description: string;
        category: PRODUCT_CATEGORY;
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
        variants?: IProductVariant[];
        details?: { [key: string]: string };
        tags?: string[];
        ratings?: number;
        images?: string[];
    }
}

// User
export namespace IReqUser {
    export interface Insert {
        name: string;
        email: string;
        password: string;
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
export namespace IReqTransaction {}

// Voucher
export namespace IReqVoucher {}
