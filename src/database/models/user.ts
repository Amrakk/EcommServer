import { z } from "zod";
import mongooat from "../db.js";
import { DEFAULT_AVATAR_URL, SOCIAL_MEDIA_PROVIDER, USER_ROLE, USER_STATUS } from "../../constants.js";

export const userRoleSchema = z.nativeEnum(USER_ROLE);
export const userStatusSchema = z.nativeEnum(USER_STATUS);
export const socialMediaProviderSchema = z.nativeEnum(SOCIAL_MEDIA_PROVIDER);

export const addressSchema = z.object({
    street: z.string(),
    ward: z.string(),
    district: z.string(),
    province: z.string(),
    contactInfo: z.string().optional(),
});

export const socialMediaAccountSchema = z.object({
    provider: socialMediaProviderSchema,
    accountId: z.string(),
});

const userSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
    phoneNumber: z
        .string()
        .regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/g)
        .nullable(),
    loyaltyPoint: z.number().int().positive().default(0),
    addresses: z.array(addressSchema).default([]),
    role: userRoleSchema.default(USER_ROLE.CUSTOMER),
    status: userStatusSchema.default(USER_STATUS.UNVERIFIED),
    avatarUrl: z.string().default(DEFAULT_AVATAR_URL),
    socialMediaAccounts: z.array(socialMediaAccountSchema).default([]),

    cartId: z.string().optional(),
    orderHistory: z.array(z.number()).default([]),
});

export const UserModel = mongooat.Model("User", userSchema);

UserModel.createIndex({ name: 1 });
UserModel.createIndex({ email: 1 }, { unique: true });
UserModel.createIndex({ phoneNumber: 1 }, { unique: true });
