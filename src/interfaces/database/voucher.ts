import type { ObjectId } from "mongooat";
import type { DISCOUNT_TYPE } from "../../constants.js";

export interface IVoucher {
    _id: ObjectId;
    code: string;
    discount: {
        type: DISCOUNT_TYPE;
        value: number;
    };
    expirationDate: Date;
    used: boolean;
}
