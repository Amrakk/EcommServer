import ApiController from "../../apiController.js";

import type { IOrder } from "../../../interfaces/database/order.js";
import type { IReqOrder } from "../../../interfaces/api/request.js";

export const insert = ApiController.callbackFactory<{}, { body: IReqOrder.Insert }, IOrder>(
    async (req, res, next) => {}
);
