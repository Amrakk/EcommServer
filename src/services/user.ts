import { ObjectId } from "mongooat";
import { UserModel } from "../database/models/user.js";
import { verifyPassword } from "../utils/hashPassword.js";

export default class UserService {
    // CRUD
    public static async getAll() {
        return UserModel.find();
    }

    public async getUserById(id: ObjectId) {
        return UserModel.findById(id);
    }

    public async getUserByEmail(email: string) {
        return UserModel.findOne({ email });
    }

    // Auth
    public async login(email: string, password: string) {
        const user = await this.getUserByEmail(email);
        if (!user) return false;

        const result = await verifyPassword(password, user.password);
        if (!result) return false;

        // TODO: assign token
        return true;
    }
}
