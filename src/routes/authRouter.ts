import express from "express";
import { api } from "../api/index.js";
import { verify } from "../middlewares/verify.js";
import { googleCallback } from "../middlewares/googleAuthentication.js";

const authRouter = express.Router();

authRouter.post("/login", api.auth.login);
authRouter.post("/register", api.auth.register);
authRouter.post("/verify", verify(), api.auth.verify);
authRouter.post("/logout", verify(), api.auth.logout);

authRouter.post("/reset-password", api.auth.resetPassword);
authRouter.post("/forgot-password", api.auth.forgotPassword);

authRouter.get("/google", api.auth.google);
authRouter.get("/google/callback", googleCallback, api.auth.googleCallback);

export default authRouter;
