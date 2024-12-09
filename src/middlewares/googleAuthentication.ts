import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import UserService from "../services/internal/user.js";
import {
    CLIENT_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    SOCIAL_MEDIA_PROVIDER,
    GOOGLE_FAILURE_REDIRECT_PATH,
    ORIGIN,
} from "../constants.js";
import type { IUser } from "../interfaces/database/user.js";

const googleStrategy = new Strategy(
    {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${ORIGIN}/api/v1/auth/google/callback`,
        passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            const { id, displayName } = profile;
            const { email, picture } = profile._json;

            let user = await UserService.getByEmail(email!);

            if (!user) {
                user = (
                    await UserService.insert([
                        {
                            email: email!,
                            name: displayName,
                            avatarUrl: picture,
                            cartId: req.session.cartId,
                            socialMediaAccounts: [{ provider: SOCIAL_MEDIA_PROVIDER.GOOGLE, accountId: id }],
                        },
                    ])
                )[0];
            } else if (!user.socialMediaAccounts.find((account) => account.provider === SOCIAL_MEDIA_PROVIDER.GOOGLE)) {
                user = await UserService.updateSocialMediaAccounts(user._id, {
                    accountId: id,
                    provider: SOCIAL_MEDIA_PROVIDER.GOOGLE,
                    cartId: req.session.cartId,
                });
            } else if (req.session.cartId) {
                user = await UserService.updateById(user._id, { cartId: req.session.cartId });
            }

            done(null, user);
        } catch (error) {
            done(error);
        }
    }
);

passport.use(googleStrategy);
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user as IUser);
});

export const googleRedirect = passport.authenticate("google", { scope: ["profile", "email"] });
export const googleCallback = passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL}${GOOGLE_FAILURE_REDIRECT_PATH}`,
});
