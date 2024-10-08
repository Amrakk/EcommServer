import express from "express";
import { api } from "../api/index.js";

const orderRouter = express.Router();

orderRouter.get("", api.order.getAll);

export default orderRouter;
