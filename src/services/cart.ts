import { CartModel } from "../database/models/cart.js";

export default class CartService {
    public static async getAll() {
        return CartModel.find();
    }
}
