import express from "express";
import { api } from "../api/index.js";
import { USER_ROLE } from "../constants.js";
import { verify } from "../middlewares/verify.js";
import { addressHandler } from "../middlewares/addressHandler.js";

const servicesRouter = express.Router();

servicesRouter.get("/calculate-fee", api.services.getShippingFee);

/**
 * wards: /wards
 * provinces: /provinces
 * districts: /districts
 */
servicesRouter.use("/get-addresses", addressHandler, express.static("./public/address", { extensions: ["json"] }));

servicesRouter.get("/crawl-status", verify([USER_ROLE.ADMIN]), api.services.getCrawlStatus);
servicesRouter.get("/crawl-addresses", verify([USER_ROLE.ADMIN]), api.services.crawlAddresses);

export default servicesRouter;
