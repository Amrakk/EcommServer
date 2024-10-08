import type { ObjectId } from "mongooat";

export interface ICart {
    _id: ObjectId;
    items: ICartItem[];
}

export interface ICartItem {
    productId: ObjectId;
    variantId: ObjectId;
    quantity: number;
}
