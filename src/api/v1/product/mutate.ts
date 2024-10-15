import ApiController from "../../apiController.js";
import ProductService from "../../../services/internal/product.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import ValidateError from "mongooat/build/errors/validateError.js";

import type { IProduct } from "../../../interfaces/database/product.js";
import type { IReqInsertProduct } from "../../../interfaces/api/request.js";

export const insert = ApiController.callbackFactory<{}, IReqInsertProduct | IReqInsertProduct[], IProduct[]>(
    async (req, res, next) => {
        try {
            const { body } = req;
            let data = [];

            if (Array.isArray(body)) data = body;
            else data = [body];

            const products = await ProductService.insert(data);
            return res
                .status(201)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: products });
        } catch (err) {
            next(err);
        }
    }
);

export const updateImages = ApiController.callbackFactory<{ id: string }, { imageUrls?: string[] }, { urls: string[] }>(
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const imageFile = req.file;
            const { imageUrls } = req.body;

            if (!imageFile && (!imageUrls || imageUrls.length === 0))
                throw new ValidateError("Image is required", [
                    { code: "custom", message: "Image is required", path: ["image"] },
                ]);

            const urls = await ProductService.updateImages(id, { file: imageFile?.buffer, urls: imageUrls ?? [] });

            return res
                .status(200)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: { urls } });
        } catch (err) {
            next(err);
        }
    }
);
