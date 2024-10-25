import ApiController from "../../apiController.js";
import PaymentService from "../../../services/external/payment.js";
import TransactionService from "../../../services/internal/transaction.js";
import { PAYMENT_STATUS, SUPPORTED_PAYMENT_SERVICE } from "../../../constants.js";

import ServiceResponseError from "../../../errors/ServiceResponseError.js";

import type { IReqPayment } from "../../../interfaces/services/external/payment.js";

export const paymentCallback = ApiController.callbackFactory<
    {},
    { query: IReqPayment.PaymentLinkCallbackQuery; body: IReqPayment.PaymentLinkCallbackBody },
    {}
>(async (req, res, next) => {
    try {
        res.sendStatus(204);

        const { service } = req.query;

        let orderId: number | undefined = undefined;
        let status: PAYMENT_STATUS | undefined = undefined;
        let paymentTime: Date | undefined = undefined;

        if (service === SUPPORTED_PAYMENT_SERVICE.MOMO) {
            const data = req.body as IReqPayment.MomoPaymentLinkCallback;

            orderId = parseInt(data.orderId);
            status = PaymentService.getMomoResponseCode(data.resultCode);
            paymentTime = status === PAYMENT_STATUS.PAID ? new Date(data.responseTime) : undefined;
        } else if (service === SUPPORTED_PAYMENT_SERVICE.PAYOS) {
            const data = req.body as IReqPayment.PayOSPaymentLinkCallback;

            orderId = data.orderCode;
            status = PAYMENT_STATUS.PAID;
            paymentTime = new Date(Date.parse(data.transactionDateTime));
        } else {
            throw new ServiceResponseError(
                "ECommServer",
                "paymentCallback",
                "Something wrong with Payment service and EcommServer",
                { service, body: req.body }
            );
        }

        await TransactionService.updateByOrderId(orderId, { paymentStatus: status, paymentTime });

        return;
    } catch (err) {
        next(err);
    }
});
