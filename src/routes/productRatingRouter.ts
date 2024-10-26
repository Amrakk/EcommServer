import express from "express";
import { api } from "../api/index.js";
import { verify } from "../middlewares/verify.js";

const productRatingRouter = express.Router();

productRatingRouter.get("/:id", api.productRating.getById);
productRatingRouter.get("/product/:productId", api.productRating.getByProductId);

productRatingRouter.post("", verify(), api.productRating.insert);
productRatingRouter.patch("/:id", verify(), api.productRating.updateById);
productRatingRouter.delete("/:id", verify(), api.productRating.deleteById);

export default productRatingRouter;
