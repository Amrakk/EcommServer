import { Mongooat } from "mongooat";
import { MONGO_URI } from "../constants.js";

const mongooat = new Mongooat(MONGO_URI);
mongooat.useDb("EComm");

export default mongooat;
