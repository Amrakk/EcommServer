import ApiController from "../../apiController.js";

export const transactionCallback = ApiController.callbackFactory<{}, {}, {}>(async (req, res, next) => {
    try {
        console.log(req.body);
        return res.sendStatus(204);
    } catch (err) {
        next(err);
    }
});
