import express from "express";
import { api } from "../api/index.js";

const voucherRouter = express.Router();

voucherRouter.get("", api.voucher.getAll);

export default voucherRouter;
