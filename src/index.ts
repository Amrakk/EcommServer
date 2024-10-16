import cors from "cors";
import express from "express";
import passport from "passport";
import router from "./routes/api.js";
import session from "express-session";
import { db } from "./database/db.js";
import Redis from "./database/redis.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { requestLogger } from "./middlewares/logger/loggers.js";
import { BASE_PATH, CLIENT_URL, PORT, SESSION_SECRET } from "./constants.js";

const app = express();

app.use(
    cors({
        origin: CLIENT_URL,
        credentials: true,
    })
);

app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
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
    console.log(`Server is running on port ${PORT}`);
});

process.on("SIGINT", () => {
    app.emit("close");
});

process.on("SIGTERM", () => {
    app.emit("close");
});
