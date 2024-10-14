import { Mongooat } from "mongooat";
import { MONGO_URI } from "../constants.js";

const mongooat = new Mongooat(MONGO_URI, {});
mongooat.useDb("EComm");

const init = async () => {
    await mongooat.connect();
    console.log("Database connected");
};

const close = async () => {
    await mongooat.close();
    console.log("Database disconnected");
};

export default mongooat;
export const db = { init, close };
