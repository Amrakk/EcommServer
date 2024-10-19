import express from "express";
import { api } from "../api/index.js";
import { USER_ROLE } from "../constants.js";
import { verify } from "../middlewares/verify.js";

const voucherRouter = express.Router();

voucherRouter.post("/code", verify(), api.voucher.validateCode);

voucherRouter.use(verify([USER_ROLE.ADMIN]));
voucherRouter.get("", api.voucher.getAll);
voucherRouter.get("/:id", api.voucher.getById);

voucherRouter.post("", api.voucher.insert);
voucherRouter.patch("/:id", api.voucher.updateById);
voucherRouter.delete("/:id", api.voucher.deleteById);

voucherRouter.post("/generate-codes", api.voucher.generateCodes);

export default voucherRouter;
