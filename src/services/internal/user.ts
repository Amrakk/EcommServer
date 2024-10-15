import ImgbbService from "../external/imgbb.js";
import { ObjectId, ZodObjectId } from "mongooat";
import { UserModel } from "../../database/models/user.js";
import { verifyPassword } from "../../utils/hashPassword.js";

import { MongoServerError } from "mongodb";
import NotFoundError from "../../errors/NotFoundError.js";
import UnauthorizedError from "../../errors/UnauthorizeError.js";
import ValidateError from "mongooat/build/errors/validateError.js";

import type { IUser } from "../../interfaces/database/user.js";
import type { IReqAuth } from "../../interfaces/api/request.js";

export default class UserService {
    // Query
    public static async getAll() {
        return UserModel.find();
    }

    public static async getById(id: ObjectId | string) {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        return UserModel.findById(result.data);
    }

    public static async getByEmail(email: string) {
        return UserModel.findOne({ email });
    }

    // Mutate
    public static async insert(users: Array<any>) {
        return await UserModel.insertMany(users);
    }

    public static async updateById(
        id: ObjectId | string,
        data: Parameters<typeof UserModel.findOneAndUpdate>[1]
    ): Promise<IUser> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        const user = await UserModel.findOneAndUpdate(
            { _id: result.data },
            { ...data, updatedAt: new Date() },
            { returnDocument: "after" }
        );
        if (!user) throw new NotFoundError();

        return user;
    }

    public static async updateByEmail(email: string, data: Parameters<typeof UserModel.findOneAndUpdate>[1]) {
        return UserModel.findOneAndUpdate({ email }, { ...data, updatedAt: new Date() }, { returnDocument: "after" });
    }

    public static async updateAvatar(id: ObjectId | string, image: Buffer): Promise<string> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        const { url, deleteUrl } = await ImgbbService.uploadImage(image);

        const updateResult = await UserModel.updateOne(
            { _id: result.data },
            { avatarUrl: url, updatedAt: new Date() }
        ).catch(async (err) => {
            await fetch(deleteUrl, { method: "GET" });
            throw err;
        });

        if (updateResult.matchedCount === 0) throw new NotFoundError();
        return url;
    }

    public static async deleteById(id: ObjectId | string): Promise<IUser> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        const user = await UserModel.findOneAndDelete({ _id: result.data });
        if (!user) throw new NotFoundError();

        return user;
    }

    // Auth
    public static async login(email: string, pass: string): Promise<Omit<IUser, "password">> {
        const user = await this.getByEmail(email);
        if (!user) throw new UnauthorizedError();

        const result = await verifyPassword(pass, user.password);
        if (!result) throw new UnauthorizedError();

        const { password, ...rest } = user;
        return rest;
    }

    public static async register(data: IReqAuth.Register): Promise<Omit<IUser, "password">> {
        const user = await UserModel.insertOne(data).catch((err) => {
            if (err instanceof MongoServerError && err.code === 11000) {
                const key = Object.keys(err.keyPattern)[0];

                let displayKey = key.replace(/([A-Z])/g, " $1").toLowerCase();
                displayKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1);

                throw new ValidateError(`${displayKey} is already taken`, [
                    { code: "custom", message: `${displayKey} is already taken`, path: [key] },
                ]);
            }
            throw err;
        });

        const { password, ...rest } = user;
        return rest;
    }
}
