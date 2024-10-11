import ApiController from "../../apiController.js";
import { deleteRefToken } from "../../../utils/tokenHandlers.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

export const logout = ApiController.callbackFactory<{}, {}, {}>(async (req, res, next) => {
    try {
        const { user } = req.ctx;

        res.clearCookie("accToken");
        res.clearCookie("refToken");

        await deleteRefToken(user._id);

        return res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: {} });
    } catch (err) {
        next(err);
    }
});
