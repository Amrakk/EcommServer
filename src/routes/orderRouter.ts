import express from "express";
import { api } from "../api/index.js";
import { USER_ROLE } from "../constants.js";
import { verify } from "../middlewares/verify.js";

const orderRouter = express.Router();

orderRouter.get("", verify(), api.order.getAll);
orderRouter.get("/:id", verify(), api.order.getById);

orderRouter.post("", verify([USER_ROLE.ADMIN]), api.order.insert);
orderRouter.patch("/:id", verify([USER_ROLE.ADMIN]), api.order.updateById);
orderRouter.delete("/:id", verify([USER_ROLE.ADMIN]), api.order.deleteById);

export default orderRouter;
