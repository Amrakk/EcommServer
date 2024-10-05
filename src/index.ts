import cors from "cors";
import express from "express";
import router from "./routes/api.js";
import { CLIENT_URL, PORT } from "./constants.js";
import errorHandler from "./middlewares/errorHandler.js";
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
app.use("/api/v1", router);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
