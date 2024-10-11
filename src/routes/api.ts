import express from "express";
import authRouter from "./authRouter.js";
import cartRouter from "./cartRouter.js";
import userRouter from "./userRouter.js";
import orderRouter from "./orderRouter.js";
import productRouter from "./productRouter.js";
import voucherRouter from "./voucherRouter.js";
import transactionRouter from "./transactionRouter.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.send("API is working");
});

router.use("/auth", authRouter);
router.use("/carts", cartRouter);
router.use("/users", userRouter);
router.use("/orders", orderRouter);
router.use("/products", productRouter);
router.use("/vouchers", voucherRouter);
router.use("/transactions", transactionRouter);

export default router;
