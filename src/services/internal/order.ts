import { ORDER_STATUS } from "../../constants.js";
import { OrderModel } from "../../database/models/order.js";

import NotFoundError from "../../errors/NotFoundError.js";
import BadRequestError from "../../errors/BadRequestError.js";
import ServiceResponseError from "../../errors/ServiceResponseError.js";

import type { IOrder } from "../../interfaces/database/order.js";
import type { IReqOrder } from "../../interfaces/api/request.js";

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
    public static async insert(data: IReqOrder.Insert[]): Promise<IOrder[]> {
        return OrderModel.insertMany(data);
    }

    // TODO: Verify updatable
    public static async updateById(
        id: number,
        data: IReqOrder.Update,
        returnDocument?: "before" | "after"
    ): Promise<IOrder> {
        const order = await OrderModel.findByIdAndUpdate(id, data, { returnDocument });
        if (!order) throw new NotFoundError("Order not found");

        return order;
    }

    public static async updateOrderStatus(
        id: number,
        params: { isPaid?: boolean; isCancelled?: boolean; status?: ORDER_STATUS }
    ): Promise<IOrder> {
        const order = await OrderModel.findById(id);
        if (!order) throw new NotFoundError("Order not found");

        if (order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.COMPLETED)
            throw new BadRequestError(`Order is already ${order.status}`, { order });

        if (params.isPaid) {
            if (order.status === ORDER_STATUS.DELIVERED) order.status = ORDER_STATUS.COMPLETED;
            order.isPaid = true;
        } else if (params.isCancelled) {
            order.status = ORDER_STATUS.CANCELLED;
        } else {
            if (!params.status)
                throw new ServiceResponseError("ECommServer", "updateOrderStatus", "Status is required", {
                    id,
                    params,
                });
            order.status = params.status;
        }

        const updateData = { status: order.status, isPaid: order.isPaid, updatedAt: new Date() };

        const newOrder = await OrderModel.findByIdAndUpdate(id, updateData, { returnDocument: "after" });
        if (!newOrder) throw new NotFoundError("Order not found");

        return newOrder;
    }

    public static async deleteById(id: number): Promise<IOrder> {
        const order = await OrderModel.findByIdAndDelete(id);
        if (!order) throw new NotFoundError("Order not found");

        return order;
    }
}
