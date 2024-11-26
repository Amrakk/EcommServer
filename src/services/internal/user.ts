import ImgbbService from "../external/imgbb.js";
import { ObjectId, ZodObjectId } from "mongooat";
import { UserModel } from "../../database/models/user.js";
import { SOCIAL_MEDIA_PROVIDER } from "../../constants.js";
import { verifyPassword } from "../../utils/hashPassword.js";
import { removeUndefinedKeys } from "../../utils/removeUndefinedKeys.js";
import { toLowerNonAccentVietnamese } from "../../utils/removeDiacritics.js";

import NotFoundError from "../../errors/NotFoundError.js";
import UnauthorizedError from "../../errors/UnauthorizeError.js";

import type { IResServices } from "../../interfaces/api/response.js";
import type { IUser, IUserProfile } from "../../interfaces/database/user.js";
import type { IOffsetPagination, IReqAuth, IReqUser } from "../../interfaces/api/request.js";

export default class UserService {
    // Query
    public static async getAll(query: IReqUser.Filter & IOffsetPagination): Promise<[IUser[], number]> {
        const { page, limit, role, searchTerm, status } = query;
        const skip = ((page ?? 1) - 1) * (limit ?? 0);

        const normalizedSearchTerm = toLowerNonAccentVietnamese(searchTerm ?? "");
        const filter = {
            role: role?.length ? { $in: role } : undefined,
            status: status?.length ? { $in: status } : undefined,
            $or: searchTerm
                ? [
                      { name: { $regex: normalizedSearchTerm, $options: "i" } },
                      { _name: { $regex: normalizedSearchTerm, $options: "i" } },
                      { email: { $regex: normalizedSearchTerm, $options: "i" } },
                      { phoneNumber: { $regex: normalizedSearchTerm, $options: "i" } },
                  ]
                : undefined,
        };

        const cleanedFilter = removeUndefinedKeys(filter);

        const [users, totalDocuments] = await Promise.all([
            UserModel.collection
                .find(cleanedFilter, { projection: { _name: 0 } })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit ?? 0)
                .toArray(),
            UserModel.countDocuments(cleanedFilter),
        ]);

        return [users, totalDocuments];
    }

    public static async getById(id: ObjectId | string): Promise<IUser | null>;
    public static async getById(id: ObjectId | string, isGetProfile: true): Promise<IUserProfile | null>;
    public static async getById(id: ObjectId | string, isGetProfile?: true): Promise<IUserProfile | IUser | null> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("User not found");

        const user = await UserModel.findById(result.data, { projection: { _name: 0 } });
        if (user && isGetProfile) {
            const { _id, addresses, email, name, phoneNumber } = user;
            return { _id, email, name, phoneNumber, addresses };
        }

        return user;
    }

    public static async getByEmail(email: string): Promise<IUser | null> {
        return UserModel.findOne({ email }, { projection: { _name: 0 } });
    }

    public static async getNewUsers(): Promise<IResServices.INewUserData> {
        const filter = { createdAt: { $gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000) } };

        const result = await Promise.all([
            (await UserModel.collection
                .find(filter, { projection: { _id: 1, name: 1, avatarUrl: 1 } })
                .sort({ createdAt: -1 })
                .limit(15)
                .toArray()) as IResServices.INewUserData["users"],
            UserModel.countDocuments(filter),
        ]);

        return { users: result[0], total: result[1] };
    }

    public static async getUserHeaderData(): Promise<IResServices.Metric> {
        const pipeline = [
            {
                $addFields: {
                    isToday: {
                        $cond: {
                            if: { $gte: ["$createdAt", new Date(new Date().setHours(0, 0, 0, 0))] },
                            then: 1,
                            else: 0,
                        },
                    },
                    isYesterday: {
                        $cond: {
                            if: {
                                $gte: [
                                    "$createdAt",
                                    new Date(new Date(new Date().setHours(0, 0, 0, 0)).getTime() - 24 * 60 * 60 * 1000),
                                ],
                            },
                            then: 1,
                            else: 0,
                        },
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    todayCount: { $sum: "$isToday" },
                    yesterdayCount: { $sum: "$isYesterday" },
                },
            },
            {
                $addFields: {
                    dailyRate: {
                        $cond: {
                            if: { $eq: ["$yesterdayCount", 0] },
                            then: 0,
                            else: {
                                $multiply: [
                                    {
                                        $divide: [{ $subtract: ["$todayCount", "$yesterdayCount"] }, "$yesterdayCount"],
                                    },
                                    100,
                                ],
                            },
                        },
                    },
                },
            },
        ];

        const result = (await UserModel.aggregate(pipeline).toArray()) as unknown as {
            totalUsers: number;
            dailyRate: number;
        }[];

        if (result.length === 0) {
            return { total: 0, dailyRate: 0 };
        }

        return { total: result[0].totalUsers, dailyRate: result[0].dailyRate };
    }

    // Mutate
    public static async insert(users: IReqUser.Insert[]): Promise<IUser[]> {
        const insertUser = users.map((user, i) => ({
            ...user,
            _name: user.name,
            createdAt: new Date(new Date().getTime() + i),
        }));
        const insertedUsers = await UserModel.insertMany(insertUser);
        return insertedUsers.map(({ _name, ...user }) => user);
    }

    public static async updateById(
        id: ObjectId | string,
        data: IReqUser.UpdateAdmin | IReqUser.UpdateUser
    ): Promise<IUser> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("User not found");

        const updateData = {
            ...data,
            _name: data.name ? data.name : undefined,
            updatedAt: new Date(),
        };

        const user = await UserModel.findOneAndUpdate({ _id: result.data }, removeUndefinedKeys(updateData), {
            returnDocument: "after",
            projection: { _name: 0 },
        });
        if (!user) throw new NotFoundError("User not found");

        return user;
    }

    public static async updateByEmail(email: string, data: IReqUser.UpdateAdmin | IReqUser.UpdateUser): Promise<IUser> {
        const updateData = {
            ...data,
            _name: data.name ? data.name : undefined,
            updatedAt: new Date(),
        };

        const user = await UserModel.findOneAndUpdate({ email }, removeUndefinedKeys(updateData), {
            returnDocument: "after",
            projection: { _name: 0 },
        });
        if (!user) throw new NotFoundError("User not found");

        return user;
    }

    public static async updateAvatar(id: ObjectId | string, image: Buffer): Promise<string> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("User not found");

        const { url, deleteUrl } = await ImgbbService.uploadImage(image);

        const updateResult = await UserModel.updateOne(
            { _id: result.data },
            { avatarUrl: url, updatedAt: new Date() }
        ).catch(async (err) => {
            await fetch(deleteUrl, { method: "GET" });
            throw err;
        });

        if (updateResult.matchedCount === 0) throw new NotFoundError("User not found");
        return url;
    }

    public static async updateLoyaltyPoint(id: ObjectId | string, point: number): Promise<IUser> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("User not found");

        const user = await UserModel.collection.findOneAndUpdate(
            { _id: result.data },
            { $inc: { loyaltyPoint: point }, $set: { updatedAt: new Date() } },
            { returnDocument: "after", projection: { _name: 0 } }
        );
        if (!user) throw new NotFoundError("User not found");

        return user;
    }

    public static async updateSocialMediaAccounts(
        id: ObjectId | string,
        data: {
            accountId: string;
            provider: SOCIAL_MEDIA_PROVIDER;
            cartId?: string | ObjectId;
        }
    ): Promise<IUser> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("User not found");

        const user = await UserModel.collection.findOneAndUpdate(
            { _id: result.data },
            {
                $push: { socialMediaAccounts: { provider: data.provider, accountId: data.accountId } },
                $set: { cartId: data.cartId ? new ObjectId(data.cartId) : undefined, updatedAt: new Date() },
            },
            { returnDocument: "after", projection: { _name: 0 } }
        );
        if (!user) throw new NotFoundError("User not found");

        return user;
    }

    public static async insertOrderHistory(id: ObjectId | string, orderId: number): Promise<IUser> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("User not found");

        const user = await UserModel.collection.findOneAndUpdate(
            { _id: result.data },
            { $push: { orderHistory: orderId }, $set: { updatedAt: new Date() } },
            { returnDocument: "after", projection: { _name: 0 } }
        );
        if (!user) throw new NotFoundError("User not found");

        return user;
    }

    public static async removeOrderHistory(id: ObjectId | string, orderId: number): Promise<IUser> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("User not found");

        const user = await UserModel.collection.findOneAndUpdate(
            { _id: result.data },
            { $pull: { orderHistory: orderId }, $set: { updatedAt: new Date() } },
            { returnDocument: "after", projection: { _name: 0 } }
        );
        if (!user) throw new NotFoundError("User not found");

        return user;
    }

    public static async deleteById(id: ObjectId | string): Promise<IUser> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError("User not found");

        const user = await UserModel.findOneAndDelete({ _id: result.data }, { projection: { _name: 0 } });
        if (!user) throw new NotFoundError("User not found");

        return user;
    }

    // Auth
    public static async login(
        email: string,
        pass: string,
        cartId?: string | ObjectId
    ): Promise<Omit<IUser, "password">> {
        let user = await this.getByEmail(email);
        if (!user) throw new UnauthorizedError();

        const result = await verifyPassword(pass, user.password);
        if (!result) throw new UnauthorizedError();

        if (cartId) user = await this.updateByEmail(email, { cartId });

        const { password, ...rest } = user;
        return rest;
    }

    public static async register(data: IReqAuth.Register): Promise<Omit<IUser, "password">> {
        const { address, name, ...restData } = data;

        const user = await UserModel.insertOne({
            ...restData,
            name,
            _name: name,
            addresses: address ? [address] : [],
        });

        const { password, _name, ...rest } = user;
        return rest;
    }
}
