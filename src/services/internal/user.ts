import ImgbbService from "../external/imgbb.js";
import { ObjectId, ZodObjectId } from "mongooat";
import { UserModel } from "../../database/models/user.js";
import { verifyPassword } from "../../utils/hashPassword.js";

import NotFoundError from "../../errors/NotFoundError.js";
import UnauthorizedError from "../../errors/UnauthorizeError.js";

import type { IReqAuth, IReqUser } from "../../interfaces/api/request.js";
import type { IUser, IUserProfile } from "../../interfaces/database/user.js";

export default class UserService {
    // Query
    public static async getAll(): Promise<IUser[]> {
        return UserModel.find();
    }

    public static async getById(id: ObjectId | string): Promise<IUser | null>;
    public static async getById(id: ObjectId | string, isGetProfile: true): Promise<IUserProfile | null>;
    public static async getById(id: ObjectId | string, isGetProfile?: true): Promise<IUserProfile | IUser | null> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        const user = await UserModel.findById(result.data);
        if (user && isGetProfile) {
            const { _id, addresses, email, name, phoneNumber } = user;
            return { _id, email, name, phoneNumber, addresses } as IUserProfile;
        }

        return user;
    }

    public static async getByEmail(email: string): Promise<IUser | null> {
        return UserModel.findOne({ email });
    }

    // Mutate
    public static async insert(users: IReqUser.Insert[]): Promise<IUser[]> {
        return await UserModel.insertMany(users);
    }

    public static async updateById(
        id: ObjectId | string,
        data: IReqUser.UpdateAdmin | IReqUser.UpdateUser
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

    public static async updateByEmail(email: string, data: IReqUser.UpdateAdmin | IReqUser.UpdateUser): Promise<IUser> {
        const user = await UserModel.findOneAndUpdate(
            { email },
            { ...data, updatedAt: new Date() },
            { returnDocument: "after" }
        );
        if (!user) throw new NotFoundError();

        return user;
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

    public static async insertOrderHistory(id: ObjectId | string, orderId: number): Promise<IUser> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        const user = await UserModel.collection.findOneAndUpdate(
            { _id: result.data },
            { $push: { orderHistory: orderId }, $set: { updatedAt: new Date() } },
            { returnDocument: "after" }
        );
        if (!user) throw new NotFoundError();

        return user;
    }

    public static async removeOrderHistory(id: ObjectId | string, orderId: number): Promise<IUser> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        const user = await UserModel.collection.findOneAndUpdate(
            { _id: result.data },
            { $pull: { orderHistory: orderId }, $set: { updatedAt: new Date() } },
            { returnDocument: "after" }
        );
        if (!user) throw new NotFoundError();

        return user;
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
        const user = await UserModel.insertOne(data);

        const { password, ...rest } = user;
        return rest;
    }
}
