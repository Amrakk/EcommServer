import { VoucherModel } from "../../database/models/voucher.js";

import type { IVoucher } from "../../interfaces/database/voucher.js";

export default class VoucherService {
    public static async getAll(): Promise<IVoucher[]> {
        return VoucherModel.find();
    }
}
