import express from "express";
import { api } from "../api/index.js";
import { imageUploader } from "../middlewares/fileHandlers.js";

const productRouter = express.Router();

// Query
productRouter.get("/", api.product.getAll);
productRouter.get("/:id", api.product.getProductById);

// Mutate
productRouter.post("/", api.product.insert);
// productRouter.put("/:id", api.product.update);
productRouter.patch(
    "/:id/images",
    (req, res, next) => imageUploader(req, res, (err) => (err ? next(err) : next())),
    api.product.updateImages
);

export default productRouter;
