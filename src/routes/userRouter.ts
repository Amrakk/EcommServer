import express from "express";
import { api } from "../api/index.js";
import { USER_ROLE } from "../constants.js";
import { verify } from "../middlewares/verify.js";

const userRouter = express.Router();

userRouter.use(verify([USER_ROLE.ADMIN]));

userRouter.get("", api.user.getAll);

export default userRouter;
