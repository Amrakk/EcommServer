import { ProductModel } from "../database/models/product.js";

export default class ProductService {
    public static async getAll() {
        return ProductModel.find();
    }
}
