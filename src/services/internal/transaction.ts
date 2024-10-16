import { TransactionModel } from "../../database/models/order.js";

import type { ITransaction } from "../../interfaces/database/order.js";

export default class TransactionService {
    public static async getAll(): Promise<ITransaction[]> {
        return TransactionModel.find();
    }
}
