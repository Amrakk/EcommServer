import express from "express";
import { api } from "../api/index.js";
import { USER_ROLE } from "../constants.js";
import { verify } from "../middlewares/verify.js";

const transactionRouter = express.Router();

transactionRouter.get("/order/:orderId", verify(), api.transaction.getByOrderId);

transactionRouter.use(verify([USER_ROLE.ADMIN]));
transactionRouter.get("", api.transaction.getAll);
transactionRouter.get("/:id", api.transaction.getById);
transactionRouter.patch("/order/:orderId", api.transaction.updateByOrderId);

transactionRouter.post("", api.transaction.insert);

export default transactionRouter;
