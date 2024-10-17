import ApiController from "../../apiController.js";
import UserService from "../../../services/internal/user.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import type { IReqAuth } from "../../../interfaces/api/request.js";

export const register = ApiController.callbackFactory<{}, { body: IReqAuth.Register }, {}>(async (req, res, next) => {
    try {
        const user = await UserService.register(req.body);

        return res.status(201).json({
            code: RESPONSE_CODE.SUCCESS,
            message: RESPONSE_MESSAGE.SUCCESS,
            data: { _id: user._id, email: user.email },
        });
    } catch (err) {
        next(err);
    }
});
