import { VoucherModel } from "../../database/models/voucher.js";

export default class VoucherService {
    public static async getAll() {
        return VoucherModel.find();
    }
}
