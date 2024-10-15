import { z } from "zod";
import mongooat from "../db.js";
import { DISCOUNT_TYPE } from "../../constants.js";

export const discountTypeSchema = z.nativeEnum(DISCOUNT_TYPE);

export const voucherSchema = z.object({
    code: z.string(),
    discount: z.object({
        type: discountTypeSchema,
        value: z.number().positive(),
    }),
    expirationDate: z.date(),
    used: z.boolean().default(false),
});

export const VoucherModel = mongooat.Model("Voucher", voucherSchema);

await VoucherModel.dropIndexes();
await VoucherModel.createIndex({ code: 1 }, { unique: true });
