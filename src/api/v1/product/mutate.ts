import ApiController from "../../apiController.js";
import ProductService from "../../../services/internal/product.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import ValidateError from "mongooat/build/errors/validateError.js";

import type { IReqProduct } from "../../../interfaces/api/request.js";
import type { IProduct } from "../../../interfaces/database/product.js";

export const insert = ApiController.callbackFactory<
    {},
    { body: IReqProduct.Insert | IReqProduct.Insert[] },
    IProduct[]
>(async (req, res, next) => {
    try {
        const { body } = req;
        let data = [];

        if (Array.isArray(body)) data = body;
        else data = [body];

        const products = await ProductService.insert(data);
        return res.status(201).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: products });
    } catch (err) {
        next(err);
    }
});

export const updateById = ApiController.callbackFactory<{ id: string }, { body: IReqProduct.Update }, IProduct>(
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const { body } = req;

            const product = await ProductService.updateById(id, body);
            return res
                .status(200)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: product });
        } catch (err) {
            next(err);
        }
    }
);

export const updateImages = ApiController.callbackFactory<{ id: string }, {}, { url: string }>(
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const imageFile = req.file;

            if (!imageFile)
                throw new ValidateError("Image is required", [
                    { code: "custom", message: "Image is required", path: ["image"] },
                ]);

            const url = await ProductService.updateImages(id, imageFile.buffer);
            return res
                .status(200)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: { url } });
        } catch (err) {
            next(err);
        }
    }
);

export const deleteById = ApiController.callbackFactory<{ id: string }, {}, IProduct>(async (req, res, next) => {
    try {
        const { id } = req.params;

        const product = await ProductService.deleteById(id);
        return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: product });
    } catch (err) {
        next(err);
    }
});

export const deleteByIdPermanent = ApiController.callbackFactory<{ id: string }, {}, IProduct>(
    async (req, res, next) => {
        try {
            const { id } = req.params;

            const product = await ProductService.deleteByIdPermanent(id);
            return res
                .status(200)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: product });
        } catch (err) {
            next(err);
        }
    }
);
