import { DISCOUNT_TYPE } from "../../constants.js";
import { ValidateError, ZodObjectId } from "mongooat";
import { VoucherModel } from "../../database/models/voucher.js";
import { generateVoucherCode } from "../../utils/generateVoucherCode.js";
import { removeUndefinedKeys } from "../../utils/removeUndefinedKeys.js";
import { toLowerNonAccentVietnamese } from "../../utils/removeDiacritics.js";

import NotFoundError from "../../errors/NotFoundError.js";
import BadRequestError from "../../errors/BadRequestError.js";

import type { IVoucher } from "../../interfaces/database/voucher.js";
import type { IOffsetPagination, IReqVoucher } from "../../interfaces/api/request.js";

export default class VoucherService {
    public static async redeemVoucher(voucherCode: string, totalPrice: number): Promise<number> {
        const voucher = await VoucherModel.findOneAndUpdate({ code: voucherCode, used: false }, { used: true });
        if (!voucher)
            throw new ValidateError("Voucher is invalid", [
                { code: "custom", message: "Voucher is invalid", path: ["voucherCode"] },
            ]);
        const { type, value } = voucher.discount;

        if (type === DISCOUNT_TYPE.PERCENT) return Math.floor(totalPrice * (value / 100));
        else return value;
    }

    // Query
    public static async getAll(query: IReqVoucher.Filter & IOffsetPagination): Promise<[IVoucher[], number]> {
        const { page, limit, code, discountType, used } = query;
        const skip = ((page ?? 1) - 1) * (limit ?? 0);

        const filter = {
            used,
            "discount.type": discountType,
            code: code ? { $regex: code, $options: "i" } : undefined,
        };

        const cleanedFilter = removeUndefinedKeys(filter);

        const [vouchers, totalDocuments] = await Promise.all([
            VoucherModel.collection
                .find(cleanedFilter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit ?? 0)
                .toArray(),
            VoucherModel.countDocuments(cleanedFilter),
        ]);

        return [vouchers, totalDocuments];
    }

    public static async getById(id: string): Promise<IVoucher | null> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) return null;

        return await VoucherModel.findById(result.data);
    }

    // Mutate
    public static async insert(data: Array<any>): Promise<IVoucher[]> {
        const insertData = data.map((voucher) => ({
            ...voucher,
            code: toLowerNonAccentVietnamese(voucher.code.toUpperCase()),
        }));

        return VoucherModel.insertMany(insertData);
    }

    public static async updateById(id: string, data: IReqVoucher.Update): Promise<IVoucher> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (!result.success) throw new NotFoundError("Voucher not found");

        const updateData = {
            ...data,
            code: data.code ? toLowerNonAccentVietnamese(data.code.toUpperCase()) : undefined,
        };

        const voucher = await VoucherModel.findByIdAndUpdate(result.data, removeUndefinedKeys(updateData), {
            returnDocument: "after",
        });
        if (!voucher) throw new NotFoundError("Voucher not found");

        return voucher;
    }

    public static async deleteById(id: string): Promise<IVoucher> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (!result.success) throw new NotFoundError("Voucher not found");

        const voucher = await VoucherModel.findByIdAndDelete(result.data);
        if (!voucher) throw new NotFoundError("Voucher not found");

        return voucher;
    }

    public static async generateCodes(data: IReqVoucher.GenerateCodes): Promise<IVoucher[]> {
        const regexPattern = data.prefix
            ? new RegExp(
                  `^${toLowerNonAccentVietnamese(data.prefix.toUpperCase())}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$`
              )
            : new RegExp(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

        const existingCodes: string[] = (await VoucherModel.find({ used: false, code: { $regex: regexPattern } })).map(
            (voucher) => voucher.code
        );

        const codes: string[] = [];
        const maxAttempts = 100;

        for (let i = 0; i < data.count; i++) {
            let attempts = 0;
            let uniqueCodeGenerated = false;
            while (attempts < maxAttempts && !uniqueCodeGenerated) {
                const code = generateVoucherCode(data.prefix);
                if (!existingCodes.includes(code) && !codes.includes(code)) {
                    codes.push(code);
                    uniqueCodeGenerated = true;
                } else {
                    attempts++;
                }
            }

            if (attempts >= maxAttempts)
                throw new BadRequestError("Cannot generate unique codes with the given prefix", {
                    prefix: data.prefix,
                    count: data.count,
                });
        }

        const vouchers = await VoucherModel.insertMany(
            codes.map((code, i) => ({
                code,
                discount: data.discount,
                expirationDate: new Date(data.expirationDate),
                createdAt: new Date(new Date().getTime() + i),
            }))
        );

        return vouchers;
    }

    public static async validateCode(code: string): Promise<IVoucher | null> {
        return await VoucherModel.findOne({ code, used: false });
    }
}
