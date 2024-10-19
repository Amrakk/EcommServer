import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import UserService from "../services/internal/user.js";
import {
    CLIENT_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_FAILURE_REDIRECT_PATH,
    SOCIAL_MEDIA_PROVIDER,
} from "../constants.js";

const googleStrategy = new Strategy(
    {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
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
                            socialMediaAccounts: [{ provider: SOCIAL_MEDIA_PROVIDER.GOOGLE, accountId: id }],
                        },
                    ])
                )[0];
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

export const googleRedirect = passport.authenticate("google", { scope: ["profile", "email"] });
export const googleCallback = passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL}${GOOGLE_FAILURE_REDIRECT_PATH}`,
});
