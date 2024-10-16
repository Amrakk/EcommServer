import type { ObjectId } from "mongooat";
import type { IAddress, ISocialMediaAccount } from "../database/user.js";
import type { ICartItem } from "../database/cart.js";
import type { IProductVariant } from "../database/product.js";
import type { UserModel } from "../../database/models/user.js";
import type { PAYMENT_TYPE, PRODUCT_CATEGORY, USER_ROLE, USER_STATUS } from "../../constants.js";

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

    // TODO: implement Insert type
    export interface Insert {
        userId: ObjectId;
        shippingAddress: IAddress;
        paymentType: PAYMENT_TYPE;
        items: ICartItem[];
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
        cartId?: ObjectId;
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
        cartId?: ObjectId;
        orderHistory?: number[];
    }

    export interface UpdateUser {
        name?: string;
        email?: string;
        password?: string;
        phoneNumber?: string;
        addresses?: IAddress[];
        avatarUrl?: string;
        cartId?: ObjectId;
    }
}

// Transaction
export namespace IReqTransaction {}

// Voucher
export namespace IReqVoucher {}
