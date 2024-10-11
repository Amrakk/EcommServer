import cors from "cors";
import express from "express";
import router from "./routes/api.js";
import { db } from "./database/db.js";
import Redis from "./database/redis.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { BASE_PATH, CLIENT_URL, PORT } from "./constants.js";
import { requestLogger } from "./middlewares/logger/loggers.js";

const app = express();

app.use(
    cors({
        origin: CLIENT_URL,
        credentials: true,
    })
);

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
