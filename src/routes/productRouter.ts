import express from "express";
import { api } from "../api/index.js";

const productRouter = express.Router();

productRouter.get("", api.product.getAll);

export default productRouter;
