import express from "express";
import { api } from "../api/index.js";

const cartRouter = express.Router();

cartRouter.get("", api.cart.getAll);
cartRouter.get("/:id", api.cart.getById);

cartRouter.post("", api.cart.insert);

export default cartRouter;
