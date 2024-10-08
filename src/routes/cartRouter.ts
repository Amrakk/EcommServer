import express from "express";
import { api } from "../api/index.js";

const cartRouter = express.Router();

cartRouter.get("", api.cart.getAll);

export default cartRouter;
