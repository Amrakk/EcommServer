import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    console.log("API is working");
    res.send("API is working");
});

router.post("/login", (req, res) => {
    console.log(req.body);
    res.send("Login successful");
});

export default router;
