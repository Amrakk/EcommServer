import { OrderModel } from "../../database/models/order.js";

export default class OrderService {
    public static async getAll() {
        return OrderModel.find();
    }
}
