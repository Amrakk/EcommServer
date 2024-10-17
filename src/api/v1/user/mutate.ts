import ApiController from "../../apiController.js";
import UserService from "../../../services/internal/user.js";
import { isAuthorizeToUpdateUser } from "../../../utils/authorize.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE, USER_ROLE } from "../../../constants.js";

import ForbiddenError from "../../../errors/ForbiddenError.js";
import ValidateError from "mongooat/build/errors/validateError.js";

import type { IUser } from "../../../interfaces/database/user.js";
import type { IReqUser } from "../../../interfaces/api/request.js";

export const insert = ApiController.callbackFactory<{}, { body: IReqUser.Insert | IReqUser.Insert[] }, IUser[]>(
    async (req, res, next) => {
        try {
            const { body } = req;
            let data = [];

            if (Array.isArray(body)) data = body;
            else data = [body];

            const users = await UserService.insert(data);

            return res
                .status(201)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: users });
        } catch (err) {
            next(err);
        }
    }
);

export const updateById = ApiController.callbackFactory<
    { id: string },
    { body: IReqUser.UpdateAdmin | IReqUser.UpdateUser },
    IUser
>(async (req, res, next) => {
    try {
        const { id } = req.params;
        const { body } = req;
        const requestUser = req.ctx.user;

        if (!isAuthorizeToUpdateUser(requestUser, id, body)) throw new ForbiddenError();

        const user = await UserService.updateById(id, body);

        return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: user });
    } catch (err) {
        next(err);
    }
});

export const updateAvatar = ApiController.callbackFactory<{ id: string }, {}, { url: string }>(
    async (req, res, next) => {
        try {
            const { id } = req.params;
            const imageFile = req.file;
            const requestUser = req.ctx.user;

            if (requestUser.role !== USER_ROLE.ADMIN && requestUser._id.toString() !== id) throw new ForbiddenError();

            if (!imageFile)
                throw new ValidateError("Image is required", [
                    { code: "custom", message: "Image is required", path: ["image"] },
                ]);

            const url = await UserService.updateAvatar(id, imageFile.buffer);

            return res
                .status(200)
                .json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: { url } });
        } catch (err) {
            next(err);
        }
    }
);

export const deleteById = ApiController.callbackFactory<{ id: string }, {}, IUser>(async (req, res, next) => {
    try {
        const { id } = req.params;
        const requestUser = req.ctx.user;

        if (requestUser.role !== USER_ROLE.ADMIN && requestUser._id.toString() !== id) throw new ForbiddenError();

        const user = await UserService.deleteById(id);

        return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: user });
    } catch (err) {
        next(err);
    }
});
