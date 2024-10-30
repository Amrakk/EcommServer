import ApiController from "../../apiController.js";
import PCYService from "../../../services/external/pcy.js";
import ProductService from "../../../services/internal/product.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import type { IReqServices } from "../../../interfaces/api/request.js";
import type { JobStatus } from "../../../interfaces/services/external/pcy.js";

export const analyze = ApiController.callbackFactory<{}, { query: IReqServices.Analyze }, JobStatus>(
    async (req, res, next) => {
        try {
            const { supportThreshold, confidenceThreshold } = req.query;

            const jobStatus = await PCYService.analyze(supportThreshold, confidenceThreshold);

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: jobStatus,
            });
        } catch (err) {
            next(err);
        }
    }
);

export const getJobStatus = ApiController.callbackFactory<{}, {}, JobStatus>(async (req, res, next) => {
    try {
        const jobStatus = await PCYService.getJobStatus();

        return res.status(200).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: jobStatus,
        });
    } catch (err) {
        next(err);
    }
});

export const pcyCallback = ApiController.callbackFactory<{}, { body: any }, {}>(async (req, res, next) => {
    try {
        res.sendStatus(204);

        const associationRules = await PCYService.getAssociationRules();
        await ProductService.updateRelatedProducts(associationRules);

        return;
    } catch (err) {
        next(err);
    }
});
