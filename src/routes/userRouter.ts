import express from "express";
import { api } from "../api/index.js";

const userRouter = express.Router();

userRouter.get("", api.user.getAll);

export default userRouter;
