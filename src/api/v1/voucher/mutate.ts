import ApiController from "../../apiController.js";
import VoucherService from "../../../services/internal/voucher.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";
import { checkValidateCodeRateLimit } from "../../../utils/checkValidateCodeRateLimit.js";

import NotFoundError from "../../../errors/NotFoundError.js";

import type { IReqVoucher } from "../../../interfaces/api/request.js";
import type { IVoucher } from "../../../interfaces/database/voucher.js";

export const insert = ApiController.callbackFactory<
    {},
    { body: IReqVoucher.Insert | IReqVoucher.Insert[] },
    IVoucher[]
>(async (req, res, next) => {
    try {
        const { body } = req;
        let data = [];

        if (Array.isArray(body)) data = body;
        else data = [body];

        const vouchers = await VoucherService.insert(data);
        return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: vouchers });
    } catch (err) {
        next(err);
    }
});

export const updateById = ApiController.callbackFactory<{ id: string }, { body: IReqVoucher.Update }, IVoucher>(
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { body } = req;

            const voucher = await VoucherService.updateById(id, body);
            return res
                .status(200)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: voucher });
        } catch (err) {
            next(err);
        }
    }
);

export const deleteById = ApiController.callbackFactory<{ id: string }, {}, IVoucher>(async (req, res, next) => {
    try {
        const { id } = req.params;

        const voucher = await VoucherService.deleteById(id);

        return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: voucher });
    } catch (err) {
        next(err);
    }
});

export const generateCodes = ApiController.callbackFactory<{}, { body: IReqVoucher.GenerateCodes }, IVoucher[]>(
    async (req, res, next) => {
        try {
            const vouchers = await VoucherService.generateCodes(req.body);
            return res
                .status(200)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: vouchers });
        } catch (err) {
            next(err);
        }
    }
);

export const validateCode = ApiController.callbackFactory<{}, { body: IReqVoucher.ValidateCode }, IVoucher>(
    async (req, res, next) => {
        try {
            const { code } = req.body;

            const { user } = req.ctx;
            await checkValidateCodeRateLimit(user._id);

            const voucher = await VoucherService.validateCode(code);
            if (!voucher) throw new NotFoundError("Voucher not found");

            return res
                .status(200)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: voucher });
        } catch (err) {
            next(err);
        }
    }
);
