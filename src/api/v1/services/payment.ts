import ApiController from "../../apiController.js";
import PaymentService from "../../../services/external/payment.js";
import TransactionService from "../../../services/internal/transaction.js";
import { PAYMENT_STATUS, RESPONSE_CODE, RESPONSE_MESSAGE, SUPPORTED_PAYMENT_SERVICE } from "../../../constants.js";

import ServiceResponseError from "../../../errors/ServiceResponseError.js";

import type { IReqPayment, PaymentServiceStatus } from "../../../interfaces/services/external/payment.js";

export const paymentServiceStatus = ApiController.callbackFactory<{}, {}, PaymentServiceStatus[]>(
    async (req, res, next) => {
        try {
            const status = PaymentService.getServiceStatus();

            return res.status(200).json({
                code: RESPONSE_CODE.SUCCESS,
                message: RESPONSE_MESSAGE.SUCCESS,
                data: status,
            });
        } catch (err) {
            next(err);
        }
    }
);

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
