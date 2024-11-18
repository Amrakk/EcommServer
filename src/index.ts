import cors from "cors";
import express from "express";
import passport from "passport";
import router from "./routes/api.js";
import session from "express-session";
import { db } from "./database/db.js";
import Redis from "./database/redis.js";
import PaymentService from "./services/external/payment.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { requestLogger } from "./middlewares/logger/loggers.js";
import { ENV, BASE_PATH, CLIENT_URL, PORT, SESSION_SECRET } from "./constants.js";

const app = express();

const isDev = ENV === "development";

app.use(
    cors({
        origin: [CLIENT_URL, "http://localhost:5018"],
        credentials: true,
    })
);

app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: !isDev,
            httpOnly: true,
            sameSite: isDev ? "lax" : "none",
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);
app.use(BASE_PATH, router);
app.use(errorHandler);

app.on("close", async () => {
    await db.close();
    await Redis.close();

    console.log("Server closed");

    process.exit(0);
});

app.listen(PORT, async () => {
    await db.init();
    await Redis.init();
    await PaymentService.init();

    console.log(`\nServer is running on port ${PORT}`);
});

process.on("SIGINT", () => {
    app.emit("close");
});

process.on("SIGTERM", () => {
    app.emit("close");
});
