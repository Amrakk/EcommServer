import ApiController from "../../apiController.js";
import UserService from "../../../services/user.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import type { ObjectId } from "mongooat";
import type { IReqRegister } from "../../../interfaces/api/request.js";

interface IResRegister {
    _id: ObjectId;
    email: string;
}

export const register = ApiController.callbackFactory<{}, IReqRegister, IResRegister>(async (req, res, next) => {
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
