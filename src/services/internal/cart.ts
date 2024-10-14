import { ObjectId, ZodObjectId } from "mongooat";
import { CartModel } from "../../database/models/cart.js";

import NotFoundError from "../../errors/NotFoundError.js";

import type { ICart } from "../../interfaces/database/cart.js";

export default class CartService {
    // Query
    public static async getAll() {
        return CartModel.find();
    }

    public static async getById(id: string | ObjectId) {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        return CartModel.findById(result.data);
    }

    // Mutate
    public static async insert(data: Array<any>): Promise<ICart[]> {
        return CartModel.insertMany(data);
    }
}
