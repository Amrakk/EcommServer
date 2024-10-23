import express from "express";
import { api } from "../api/index.js";
import { verify } from "../middlewares/verify.js";
import { USER_ROLE } from "../constants.js";

const transactionRouter = express.Router();

transactionRouter.use(verify([USER_ROLE.ADMIN]));
transactionRouter.get("", api.transaction.getAll);
transactionRouter.get("/:id", api.transaction.getById);
transactionRouter.get("/order/:orderId", api.transaction.getByOrderId);

transactionRouter.post("", api.transaction.insert);

export default transactionRouter;
