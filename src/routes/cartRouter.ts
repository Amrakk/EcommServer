import express from "express";
import { api } from "../api/index.js";
import { USER_ROLE } from "../constants.js";
import { verify } from "../middlewares/verify.js";

const cartRouter = express.Router();

cartRouter.get("", verify([USER_ROLE.ADMIN]), api.cart.getAll);
cartRouter.get("/:id", api.cart.getById);

cartRouter.post("", api.cart.insert);
cartRouter.patch("/:id", api.cart.updateById);

cartRouter.delete("/:id", api.cart.deleteById);

export default cartRouter;
