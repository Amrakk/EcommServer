import express from "express";
import { api } from "../api/index.js";
import { USER_ROLE } from "../constants.js";
import { verify } from "../middlewares/verify.js";

const orderRouter = express.Router();

orderRouter.get("", verify([USER_ROLE.ADMIN]), api.order.getAll);
orderRouter.get("", verify(), api.order.getById);

export default orderRouter;
