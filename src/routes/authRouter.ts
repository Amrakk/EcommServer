import express from "express";
import { api } from "../api/index.js";
import { verify } from "../middlewares/verify.js";

const authRouter = express.Router();

authRouter.post("/login", api.auth.login);
authRouter.post("/register", api.auth.register);
authRouter.post("/logout", verify(), api.auth.logout);

export default authRouter;
