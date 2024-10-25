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
