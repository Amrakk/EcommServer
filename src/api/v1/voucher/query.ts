import { z } from "zod";
import ApiController from "../../apiController.js";
import VoucherService from "../../../services/internal/voucher.js";
import { DISCOUNT_TYPE, RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import { ValidateError } from "mongooat";
import NotFoundError from "../../../errors/NotFoundError.js";

import type { IResGetAll } from "../../../interfaces/api/response.js";
import type { IReqVoucher } from "../../../interfaces/api/request.js";
import type { IVoucher } from "../../../interfaces/database/voucher.js";

const querySchema = z
    .object({
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().optional(),

        code: z
            .string()
            .transform((val) => val.toUpperCase())
            .optional(),
        used: z
            .enum(["true", "false"])
            .transform((val) => val === "true")
            .optional(),
        discountType: z.nativeEnum(DISCOUNT_TYPE).optional(),
    })
    .strict()
    .refine(
        (data) => {
            if (!data.limit && data.page) return false;
            return true;
        },
        { message: "'limit' must be provided if 'page' is provided", path: ["limit"] }
    );

export const getAll = ApiController.callbackFactory<{}, { query: IReqVoucher.GetAllQuery }, IResGetAll.Voucher>(
    async (req, res, next) => {
        try {
            const { query } = req;

            const validatedQuery = await querySchema.safeParseAsync(query);
            if (!validatedQuery.success)
                throw new ValidateError("Invalid query parameters", validatedQuery.error.errors);

            const [vouchers, totalDocuments] = await VoucherService.getAll(validatedQuery.data);

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: { vouchers, totalDocuments },
            });
        } catch (err) {
            next(err);
        }
    }
);

export const getById = ApiController.callbackFactory<{ id: string }, {}, IVoucher>(async (req, res, next) => {
    try {
        const { id: code } = req.params;

        const voucher = await VoucherService.getById(code);
        if (!voucher) throw new NotFoundError("Voucher not found");

        return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: voucher });
    } catch (err) {
        next(err);
    }
});
