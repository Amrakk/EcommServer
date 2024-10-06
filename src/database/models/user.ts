import { z } from "zod";
import mongooat from "../db.js";

const userSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

const UserModel = mongooat.Model("User", userSchema);

export default UserModel;
