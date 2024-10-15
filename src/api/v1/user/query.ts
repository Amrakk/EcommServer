import ApiController from "../../apiController.js";
import UserService from "../../../services/internal/user.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import type { IUser } from "../../../interfaces/database/user.js";

export const getAll = ApiController.callbackFactory<{}, {}, Omit<IUser, "password">[]>(async (req, res, next) => {
    try {
        const users = await UserService.getAll();

        const returnUser = users.map(({ password, ...rest }) => rest);
        res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: returnUser });
    } catch (err) {
        next(err);
    }
});
