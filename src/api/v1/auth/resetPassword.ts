import redis from "../../../database/redis.js";
import ApiController from "../../apiController.js";
import UserService from "../../../services/internal/user.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import ValidateError from "mongooat/build/errors/validateError.js";

export const resetPassword = ApiController.callbackFactory<{}, { email: string; otp: string; password: string }, {}>(
    async (req, res, next) => {
        try {
            const { email, otp, password } = req.body;

            const cache = redis.getRedis();
            if ((await cache.get(email)) !== otp)
                throw new ValidateError("OTP is invalid or expired", [
                    { code: "custom", message: "OTP is invalid or expired", path: ["otp"] },
                ]);

            await UserService.updateOneBy({ email }, { password });
            await cache.del(email);

            return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: {} });
        } catch (err) {
            next(err);
        }
    }
);
