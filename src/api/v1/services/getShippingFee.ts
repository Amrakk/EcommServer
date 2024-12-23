import ApiController from "../../apiController.js";
import GHNService from "../../../services/external/ghn.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import NotFoundError from "../../../errors/NotFoundError.js";

import type { IReqServices } from "../../../interfaces/api/request.js";
import type { IResServices } from "../../../interfaces/api/response.js";

export const getShippingFee = ApiController.callbackFactory<
    {},
    { query: IReqServices.GetShippingFee },
    IResServices.CalculateFee
>(async (req, res, next) => {
    try {
        const { districtId, wardCode } = req.query;

        const _districtId = parseInt(districtId);
        if (isNaN(_districtId)) throw new NotFoundError("District not found");

        const shippingFee = await GHNService.getShippingFee(_districtId, wardCode);

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: { shippingFee },
        });
    } catch (err) {
        next(err);
    }
});
