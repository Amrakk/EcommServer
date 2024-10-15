import type { ObjectId } from "mongooat";
import type { IProduct } from "./product.js";

export interface ICart {
    _id: ObjectId;
    items: ICartItem[];
    updatedAt: Date;
}

export interface ICartItem {
    productId: ObjectId;
    variantId: string;
    quantity: number;
}

export interface ICartDetail {
    _id: ObjectId;
    items: ICartItemDetail[];
    updatedAt: Date;
}

export interface ICartItemDetail {
    quantity: number;
    variantId: string;
    product: IProduct;
}
