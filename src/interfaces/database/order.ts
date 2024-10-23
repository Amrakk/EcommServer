import type { ObjectId } from "mongooat";
import type { IAddress } from "./user.js";
import type { IProduct, IProductVariant } from "./product.js";
import type { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_TYPE } from "../../constants.js";

export interface IOrder {
    _id: number;
    userId: ObjectId;
    items: IOrderItem[];
    discount?: number;
    totalPrice: number;
    isPaid: boolean;
    shippingAddress: IAddress;
    status: ORDER_STATUS;
    createdAt: Date;
    updatedAt: Date;
}

export interface IOrderItem {
    product: Pick<IProduct, "_id" | "name" | "images">;
    variant: Omit<IProductVariant, "quantity">;
    quantity: number;
}

export interface ITransaction {
    _id: ObjectId;
    orderId: number;
    paymentType: PAYMENT_TYPE;
    paymentStatus: PAYMENT_STATUS;
    paymentTime?: Date;
    /** Payment amount after discount */
    paymentAmount: number;
    shippingFee: number;
    checkoutUrl?: string;
    paymentDetails?: string;
}
