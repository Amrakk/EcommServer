import { z } from "zod";
import crypto from "crypto";
import mongooat from "../db.js";
import { ZodObjectId } from "mongooat";
import { hashPassword } from "../../utils/hashPassword.js";
import { toLowerNonAccentVietnamese } from "../../utils/removeDiacritics.js";
import { DEFAULT_AVATAR_URL, SOCIAL_MEDIA_PROVIDER, USER_ROLE, USER_STATUS } from "../../constants.js";

export const userRoleSchema = z.nativeEnum(USER_ROLE);
export const userStatusSchema = z.nativeEnum(USER_STATUS);
export const socialMediaProviderSchema = z.nativeEnum(SOCIAL_MEDIA_PROVIDER);

export const addressSchema = z.object({
    street: z.string(),
    ward: z.object({ code: z.string(), name: z.string() }),
    district: z.object({ id: z.number(), name: z.string() }),
    province: z.object({ id: z.number(), name: z.string() }),
    contactInfo: z.string().optional(),
});

export const socialMediaAccountSchema = z.object({
    provider: socialMediaProviderSchema,
    accountId: z.string(),
});

const userSchema = z.object({
    name: z.string().transform((val) => val.trim()),
    _name: z.string().transform((val) => toLowerNonAccentVietnamese(val.trim())),
    email: z.string().email(),
    password: z
        .string()
        .min(6)
        .default(() => crypto.randomBytes(8).toString("hex"))
        .transform(async (val) => await hashPassword(val)),
    phoneNumber: z
        .string()
        .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/g)
        .optional(),
    loyaltyPoint: z.number().int().min(0).default(0),
    addresses: z.array(addressSchema).default([]),
    role: userRoleSchema.default(USER_ROLE.CUSTOMER),
    status: userStatusSchema.default(USER_STATUS.NORMAL),
    avatarUrl: z.string().default(DEFAULT_AVATAR_URL),
    socialMediaAccounts: z.array(socialMediaAccountSchema).default([]),

    cartId: ZodObjectId.optional(),
    orderHistory: z.array(z.number()).default([]),

    createdAt: z
        .preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date())
        .default(() => new Date()),
    updatedAt: z
        .preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date())
        .default(() => new Date()),
});

export const UserModel = mongooat.Model("User", userSchema);

await UserModel.dropIndexes();
await UserModel.createIndex({ email: 1 }, { unique: true });
