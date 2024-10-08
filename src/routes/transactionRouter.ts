import express from "express";
import { api } from "../api/index.js";

const transactionRouter = express.Router();

transactionRouter.get("", api.transaction.getAll);

export default transactionRouter;
