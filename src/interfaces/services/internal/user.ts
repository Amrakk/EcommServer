import { IUser } from "../../database/user.js";

export interface LoginWithUser {
    user: IUser;
}

export interface LoginWithEmailPassword {
    email: string;
    password: string;
}
