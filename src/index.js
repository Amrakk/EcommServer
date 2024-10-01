import express from "express";
import router from "./routes/api.js";

const app = express();

app.use("/api/v1", router);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

import { hashPassword, verifyPassword } from "./utils/hashPassword.js";
const pass = "password";
const hash = await hashPassword(pass);
console.log(hash);
const isMatch = await verifyPassword(pass, hash);
console.log(isMatch);
