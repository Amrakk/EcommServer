import Redis from "../../../database/redis.js";
import ApiController from "../../apiController.js";
import UserService from "../../../services/internal/user.js";
import OrderService from "../../../services/internal/order.js";
import { IResServices } from "../../../interfaces/api/response.js";
import { RESPONSE_CODE, RESPONSE_MESSAGE } from "../../../constants.js";
import TransactionService from "../../../services/internal/transaction.js";

export const getDashboardData = ApiController.callbackFactory<{}, {}, IResServices.IAdminDashboard>(
    async (req, res, next) => {
        try {
            const cache = Redis.getRedis();
            const cachedData = await cache.get("dashboardData");

            let data: Partial<IResServices.IAdminDashboard> = {};

            if (cachedData) {
                data = JSON.parse(cachedData);
            } else {
                const getHeaderData = async () => {
                    const result = await Promise.all([
                        OrderService.getOrderHeaderData(),
                        TransactionService.getRevenueHeaderData(),
                        UserService.getUserHeaderData(),
                    ]);

                    return {
                        orders: result[0],
                        revenue: result[1],
                        users: result[2],
                    };
                };

                const result = await Promise.all([
                    UserService.getNewUsers(),
                    TransactionService.getRevenueData(),
                    OrderService.getTopProducts(),
                    getHeaderData(),
                ]);

                data = {
                    newUserData: result[0],
                    revenueData: result[1],
                    topProductData: result[2],
                    headerData: result[3],
                };
                await cache.set("dashboardData", JSON.stringify(data), "EX", 5);
            }

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: data as IResServices.IAdminDashboard,
            });
        } catch (err) {
            next(err);
        }
    }
);
