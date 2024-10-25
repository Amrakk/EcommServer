import ApiController from "../../apiController.js";
import VoucherService from "../../../services/internal/voucher.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import NotFoundError from "../../../errors/NotFoundError.js";

import type { IVoucher } from "../../../interfaces/database/voucher.js";

export const getAll = ApiController.callbackFactory<{}, {}, IVoucher[]>(async (req, res, next) => {
    try {
        const vouchers = await VoucherService.getAll();
        res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: vouchers });
    } catch (err) {
        next(err);
    }
});

export const getById = ApiController.callbackFactory<{ id: string }, {}, IVoucher>(async (req, res, next) => {
    try {
        const { id: code } = req.params;

        const voucher = await VoucherService.getById(code);
        if (!voucher) throw new NotFoundError("Voucher not found");

        res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: voucher });
    } catch (err) {
        next(err);
    }
});
