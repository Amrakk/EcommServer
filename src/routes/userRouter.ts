import express from "express";
import { api } from "../api/index.js";
import { USER_ROLE } from "../constants.js";
import { verify } from "../middlewares/verify.js";
import { imageUploader } from "../middlewares/fileHandlers.js";

const userRouter = express.Router();

userRouter.get("/:id", verify(), api.user.getById);
userRouter.patch("/:id", verify(), api.user.updateById);
userRouter.patch("/:id/avatar", verify(), imageUploader, api.user.updateAvatar);
userRouter.delete("/:id", verify(), api.user.deleteById);

userRouter.get("", verify([USER_ROLE.ADMIN]), api.user.getAll);
userRouter.post("", verify([USER_ROLE.ADMIN]), api.user.insert);

export default userRouter;
