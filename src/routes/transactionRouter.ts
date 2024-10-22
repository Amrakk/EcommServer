import express from "express";
import { api } from "../api/index.js";

const transactionRouter = express.Router();

transactionRouter.get("", api.transaction.getAll);

transactionRouter.post("/callback", api.transaction.transactionCallback);

export default transactionRouter;
