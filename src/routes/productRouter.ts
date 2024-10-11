import express from "express";
import { api } from "../api/index.js";

const productRouter = express.Router();

// Query
productRouter.get("/", api.product.getAll);
productRouter.get("/:id", api.product.getProductById);

// Mutate
productRouter.post("/", api.product.insert);

export default productRouter;
