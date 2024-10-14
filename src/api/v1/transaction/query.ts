import ApiController from "../../apiController.js";
import TransactionService from "../../../services/internal/transaction.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";

import type { ITransaction } from "../../../interfaces/database/order.js";

export const getAll = ApiController.callbackFactory<{}, {}, ITransaction[]>(async (req, res, next) => {
    try {
        const transactions = await TransactionService.getAll();
        res.status(200).json({ code: RESPONSE_CODE.SUCCESS, message: RESPONSE_MESSAGE.SUCCESS, data: transactions });
    } catch (err) {
        next(err);
    }
});
