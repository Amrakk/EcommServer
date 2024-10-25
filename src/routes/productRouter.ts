import express from "express";
import { api } from "../api/index.js";
import { USER_ROLE } from "../constants.js";
import { verify } from "../middlewares/verify.js";
import { imageUploader } from "../middlewares/fileHandlers.js";

const productRouter = express.Router();

productRouter.get("/", api.product.getAll);
productRouter.get("/brands", api.product.getBrands);
productRouter.get("/:id", api.product.getProductById);

productRouter.use(verify([USER_ROLE.ADMIN]));

productRouter.post("/", api.product.insert);

productRouter.patch("/:id", api.product.updateById);
productRouter.patch("/:id/images", imageUploader, api.product.updateImages);

productRouter.delete("/:id", api.product.deleteById);
productRouter.delete("/:id/permanent", api.product.deleteByIdPermanent);

export default productRouter;
