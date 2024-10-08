import type { ObjectId } from "mongooat";
import type { IAddress } from "../database/user.js";
import type { PAYMENT_TYPE } from "../../constants.js";
import type { ICartItem } from "../database/cart.js";

export interface ICheckout {
    userId: ObjectId;
    shippingAddress: IAddress;
    paymentType: PAYMENT_TYPE;
    items: ICartItem[];
    totalPrice: number;
    shippingFee: number;

    usePoints?: boolean;
    voucherCode?: string;
}
