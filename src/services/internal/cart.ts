import { ZodObjectId } from "mongooat";
import { CartModel } from "../../database/models/cart.js";

import NotFoundError from "../../errors/NotFoundError.js";
import ValidateError from "mongooat/build/errors/validateError.js";

import type { ObjectId } from "mongooat";
import type { IReqCart } from "../../interfaces/api/request.js";
import type { ICart, ICartItem } from "../../interfaces/database/cart.js";

export default class CartService {
    public static async validateCartItems(items: Array<any>): Promise<ICartItem[]> {
        const result = await CartModel.schema.shape.items.safeParseAsync(items);
        if (result.error) throw new ValidateError("Invalid cart items", result.error.errors);

        return result.data;
    }

    // Query
    public static async getAll(): Promise<ICart[]> {
        return CartModel.find();
    }

    public static async getById(id: string | ObjectId): Promise<ICart | null> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) return null;

        return CartModel.findById(result.data);
    }

    // Mutate
    public static async insert(data: IReqCart.Upsert[]): Promise<ICart[]> {
        return CartModel.insertMany(data);
    }

    public static async updateById(id: string | ObjectId, data: IReqCart.Upsert): Promise<ICart> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        const cart = await CartModel.findByIdAndUpdate(
            result.data,
            {
                items: data.items,
                updatedAt: new Date(),
            },
            { returnDocument: "after" }
        );
        if (!cart) throw new NotFoundError();

        return cart;
    }

    public static async deleteById(id: string | ObjectId): Promise<ICart> {
        const result = await ZodObjectId.safeParseAsync(id);
        if (result.error) throw new NotFoundError();

        const cart = await CartModel.findByIdAndDelete(result.data);
        if (!cart) throw new NotFoundError();

        return cart;
    }
}
