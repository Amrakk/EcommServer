import express from "express";
import { api } from "../api/index.js";

const authRouter = express.Router();

authRouter.post("/login", api.auth.login);
authRouter.post("/register", api.auth.register);

export default authRouter;
