import type { ObjectId } from "mongooat";
import type { IAddress } from "../database/user.js";
import type { ICartItem } from "../database/cart.js";
import type { IProductVariant } from "../database/product.js";
import type { PAYMENT_TYPE, PRODUCT_CATEGORY } from "../../constants.js";

// Auth
export interface IReqLogin {
    email: string;
    password: string;
}

export interface IReqRegister {
    name: string;
    email: string;
    password?: string;
    phoneNumber: string;
    addresses: IAddress[];
}

// Product
export interface IReqInsertProduct {
    name: string;
    description: string;
    category: PRODUCT_CATEGORY;
    variants: IProductVariant[];
    details: { [key: string]: string };
    tags: string[];
}

// Cart
export interface IReqInsertCart {
    items: ICartItem[];
}

export interface IReqCheckout {
    userId: ObjectId;
    shippingAddress: IAddress;
    paymentType: PAYMENT_TYPE;
    items: ICartItem[];
    totalPrice: number;
    shippingFee: number;

    usePoints?: boolean;
    voucherCode?: string;
}
