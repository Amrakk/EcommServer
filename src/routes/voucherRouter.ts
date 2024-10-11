import express from "express";
import { api } from "../api/index.js";
import { USER_ROLE } from "../constants.js";
import { verify } from "../middlewares/verify.js";

const voucherRouter = express.Router();

voucherRouter.use(verify([USER_ROLE.ADMIN]));

voucherRouter.get("", api.voucher.getAll);

export default voucherRouter;
