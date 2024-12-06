import ApiController from "../../apiController.js";
import { deleteRefToken } from "../../../utils/tokenHandlers.js";
import { ENV, RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

const isDev = ENV === "development";

export const logout = ApiController.callbackFactory<{}, {}, {}>(async (req, res, next) => {
    try {
        const { user } = req.ctx;

        req.logOut((err) => {
            if (err) throw err;
        });
        res.clearCookie("accToken", {
            secure: !isDev,
            httpOnly: true,
            sameSite: isDev ? "lax" : "none",
        });
        res.clearCookie("refToken", {
            secure: !isDev,
            httpOnly: true,
            sameSite: isDev ? "lax" : "none",
        });

        await deleteRefToken(user._id);

        return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: {} });
    } catch (err) {
        next(err);
    }
});
