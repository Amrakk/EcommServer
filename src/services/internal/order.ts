import { OrderModel } from "../../database/models/order.js";

import NotFoundError from "../../errors/NotFoundError.js";

import type { IOrder } from "../../interfaces/database/order.js";

export default class OrderService {
    // Query
    public static async getAll(): Promise<IOrder[]> {
        return OrderModel.find();
    }

    public static async getById(ids: number[]): Promise<IOrder[]>;
    public static async getById(id: number): Promise<IOrder | null>;
    public static async getById(ids: number[] | number): Promise<IOrder | null | IOrder[]> {
        if (Array.isArray(ids)) return OrderModel.find({ _id: { $in: ids } });
        return OrderModel.findById(ids);
    }

    // Mutate
    public static async insert(data: Array<any>): Promise<IOrder[]> {
        return OrderModel.insertMany(data);
    }

    public static async updateById(
        id: number,
        data: Parameters<typeof OrderModel.findByIdAndUpdate>[1]
    ): Promise<IOrder> {
        const order = await OrderModel.findByIdAndUpdate(id, data, { returnDocument: "after" });
        if (!order) throw new NotFoundError();

        return order;
    }

    public static async deleteById(id: number): Promise<IOrder> {
        const order = await OrderModel.findByIdAndDelete(id);
        if (!order) throw new NotFoundError();

        return order;
    }
}
