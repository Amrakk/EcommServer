import { TransactionModel } from "../../database/models/order.js";

export default class TransactionService {
    public static async getAll() {
        return TransactionModel.find();
    }
}
