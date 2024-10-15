import type { ObjectId } from "mongooat";
import type { SOCIAL_MEDIA_PROVIDER, USER_ROLE, USER_STATUS } from "../../constants.js";

export interface IUser {
    _id: ObjectId;
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
    loyaltyPoint: number;
    addresses: IAddress[];
    role: USER_ROLE;
    status: USER_STATUS;
    avatarUrl: string;
    socialMediaAccounts: ISocialMediaAccount[];

    cartId?: ObjectId;
    orderHistory: number[];
}

export interface IAddress {
    street: string;
    ward: { code: string; name: string };
    district: { id: number; name: string };
    province: { id: number; name: string };
    contactInfo?: string;
}

export interface ISocialMediaAccount {
    provider: SOCIAL_MEDIA_PROVIDER;
    accountId: string;
}

export interface IUserProfile {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
    addresses: IAddress[];
}
