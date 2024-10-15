import { OrderModel } from "../../database/models/order.js";

import type { IOrder } from "../../interfaces/database/order.js";

export default class OrderService {
    // Query
    public static async getAll(): Promise<IOrder[]> {
        return OrderModel.find();
    }

    public static async getById(ids: number[]): Promise<IOrder[]>;
    public static async getById(id: number): Promise<IOrder | null>;
    public static async getById(ids: number[] | number): Promise<IOrder | null | IOrder[]> {
        if (Array.isArray(ids)) {
            return OrderModel.find({ _id: { $in: ids } });
        } else {
            return OrderModel.findById(ids);
        }
    }

    // Mutate
}
