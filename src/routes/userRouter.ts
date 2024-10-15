import express from "express";
import { api } from "../api/index.js";
import { USER_ROLE } from "../constants.js";
import { verify } from "../middlewares/verify.js";
import { imageUploader } from "../middlewares/fileHandlers.js";

const userRouter = express.Router();

userRouter.use(verify());
userRouter.get("/:id", api.user.getById);
userRouter.patch("/:id", api.user.updateById);
userRouter.patch(
    "/:id/avatar",
    (req, res, next) => imageUploader(req, res, (err) => (err ? next(err) : next())),
    api.user.updateAvatar
);

userRouter.use(verify([USER_ROLE.ADMIN]));
userRouter.get("", api.user.getAll);
userRouter.post("", api.user.insert);
userRouter.delete("/:id", api.user.deleteById);

export default userRouter;
