import express from "express";
import { api } from "../api/index.js";
import { USER_ROLE } from "../constants.js";
import { verify } from "../middlewares/verify.js";
import { addressHandler } from "../middlewares/addressHandler.js";

const servicesRouter = express.Router();

servicesRouter.get("/calculate-fee", api.services.ghn.getShippingFee);

/**
 * wards: /wards
 * provinces: /provinces
 * districts: /districts
 */
servicesRouter.use("/get-addresses", addressHandler, express.static("./public/address", { extensions: ["json"] }));

servicesRouter.post("/payment-callback", api.services.payment.paymentCallback);

servicesRouter.get("/crawl-status", verify([USER_ROLE.ADMIN]), api.services.addressCrawler.getCrawlStatus);
servicesRouter.get("/crawl-addresses", verify([USER_ROLE.ADMIN]), api.services.addressCrawler.crawlAddresses);

servicesRouter.post("/pcy", verify([USER_ROLE.ADMIN]), api.services.pcy.analyze);
servicesRouter.get("/pcy/status", verify([USER_ROLE.ADMIN]), api.services.pcy.getJobStatus);
servicesRouter.post("/pcy/callback", api.services.pcy.pcyCallback);

export default servicesRouter;
