import redis from "../../database/redis.js";
import {
    EMAIL,
    ORIGIN,
    BASE_PATH,
    CLIENT_URL,
    PAYOS_API_KEY,
    PAYMENT_STATUS,
    PAYMENT_API_URL,
    PAYOS_CLIENT_ID,
    PAYOS_CHECKSUM_KEY,
    PAYMENT_CALLBACK_URL,
    PAYMENT_REDIRECT_URL,
    SUPPORTED_PAYMENT_SERVICE,
} from "../../constants.js";

import BadRequestError from "../../errors/BadRequestError.js";
import ServiceResponseError from "../../errors/ServiceResponseError.js";

import type { IReqPayment, IResPayment, PaymentServiceStatus } from "../../interfaces/services/external/payment.js";

const paymentServiceStatus: PaymentServiceStatus[] = [
    {
        service: SUPPORTED_PAYMENT_SERVICE.PAYOS,
        available: true,
    },
    {
        service: SUPPORTED_PAYMENT_SERVICE.MOMO,
        available: false,
    },
];

export default class PaymentService {
    public static async init(): Promise<void> {
        const cache = redis.getRedis();

        if (!(await cache.get("PaymentClientId"))) {
            const callbackUrl = `${ORIGIN}${BASE_PATH}${PAYMENT_CALLBACK_URL}`;

            const body: IReqPayment.CreateUser = {
                email: EMAIL,
                ipnUrl: callbackUrl,
                services: {
                    payos: {
                        apiKey: PAYOS_API_KEY,
                        clientId: PAYOS_CLIENT_ID,
                        checksumKey: PAYOS_CHECKSUM_KEY,
                    },
                },
            };

            const clientId = await fetch(`${PAYMENT_API_URL}/create_user`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
                .then((res) => res.json())
                .then((data: IResPayment.CreateUser) => {
                    if (data.code !== 0) {
                        paymentServiceStatus[0].available = false;
                        console.log("Payment service failed to initialize");
                    } else {
                        paymentServiceStatus[0].available = true;
                        return data.data.id;
                    }
                });

            clientId && (await cache.set("PaymentClientId", clientId));
        }

        console.log("Payment service initialized");
    }

    public static getServiceStatus(): PaymentServiceStatus[] {
        return paymentServiceStatus;
    }

    public static async createTransaction(
        service: SUPPORTED_PAYMENT_SERVICE,
        data: IReqPayment.CreateTransaction
    ): Promise<IResPayment.CreateTransaction> {
        const cache = redis.getRedis();

        const clientId = await cache.get("PaymentClientId");
        if (!clientId) throw new ServiceResponseError(service, "createTransaction", "Client ID not found");

        const body = this.buildCreateTransactionRequestBody(service, data);

        const response = await this.fetchCreateTransaction(service, clientId, body);

        return this.processCreateTransactionResponse(service, response);
    }

    private static buildCreateTransactionRequestBody(
        service: SUPPORTED_PAYMENT_SERVICE,
        data: IReqPayment.CreateTransaction
    ): IReqPayment.PayOSPaymentLinkRequest | IReqPayment.MomoPaymentLinkRequest {
        switch (service) {
            case SUPPORTED_PAYMENT_SERVICE.PAYOS:
                return {
                    amount: data.amount,
                    description: data.description,
                    cancelUrl: `${CLIENT_URL}${PAYMENT_REDIRECT_URL}`,
                    returnUrl: `${CLIENT_URL}${PAYMENT_REDIRECT_URL}`,
                    orderCode: data.orderId,
                    expiredAt: data.expireTime ? new Date().getTime() + data.expireTime * 60 * 1000 : undefined,
                } as IReqPayment.PayOSPaymentLinkRequest;

            case SUPPORTED_PAYMENT_SERVICE.MOMO:
                return {
                    amount: data.amount,
                    orderInfo: data.description,
                    redirectUrl: `${CLIENT_URL}${PAYMENT_REDIRECT_URL}`,
                    orderId: `${data.orderId}`,
                    requestId: `${data.orderId}`,
                    orderExpireTime: data.expireTime,
                    requestType: "captureWallet",
                    extraData: "",
                    lang: "vi",
                } as IReqPayment.MomoPaymentLinkRequest;

            default:
                throw new BadRequestError("Invalid payment service", { service });
        }
    }

    private static async fetchCreateTransaction(
        service: SUPPORTED_PAYMENT_SERVICE,
        clientId: string,
        body: IReqPayment.PayOSPaymentLinkRequest | IReqPayment.MomoPaymentLinkRequest
    ): Promise<IResPayment.PayOSPaymentLink | IResPayment.MomoPaymentLink> {
        const response = await fetch(`${PAYMENT_API_URL}/payment_link?service=${service}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": clientId,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (data.code !== 0) {
            throw new ServiceResponseError(service, "createTransaction", "Failed to create transaction", data);
        }

        return data;
    }

    private static processCreateTransactionResponse(
        service: SUPPORTED_PAYMENT_SERVICE,
        data: IResPayment.PayOSPaymentLink | IResPayment.MomoPaymentLink
    ): IResPayment.CreateTransaction {
        switch (service) {
            case SUPPORTED_PAYMENT_SERVICE.PAYOS:
                const payOSData = (data as IResPayment.PayOSPaymentLink).data;
                return {
                    amount: payOSData.amount,
                    orderId: payOSData.orderCode,
                    checkoutUrl: payOSData.checkoutUrl,
                };

            case SUPPORTED_PAYMENT_SERVICE.MOMO:
                const momoData = (data as IResPayment.MomoPaymentLink).data;
                return {
                    amount: momoData.amount,
                    checkoutUrl: momoData.payUrl,
                    orderId: parseInt(momoData.orderId),
                };

            default:
                throw new BadRequestError("Invalid payment service", { service });
        }
    }

    public static async getTransactionStatus(
        service: SUPPORTED_PAYMENT_SERVICE,
        data: IReqPayment.GetTransactionStatus
    ): Promise<IResPayment.GetTransactionStatus> {
        const cache = redis.getRedis();

        const clientId = await cache.get("PaymentClientId");
        if (!clientId) throw new ServiceResponseError(service, "getTransactionStatus", "Client ID not found");

        const body = this.buildTransactionStatusRequestBody(service, data);
        const response = await this.fetchTransactionStatus(service, clientId, body);

        return this.processTransactionStatusResponse(service, response);
    }

    private static buildTransactionStatusRequestBody(
        service: SUPPORTED_PAYMENT_SERVICE,
        data: IReqPayment.GetTransactionStatus
    ): IReqPayment.PayOSGetTransactionStatus | IReqPayment.MomoPaymentLinkRequest {
        switch (service) {
            case SUPPORTED_PAYMENT_SERVICE.PAYOS:
                return { id: data.id } as IReqPayment.PayOSGetTransactionStatus;
            case SUPPORTED_PAYMENT_SERVICE.MOMO:
                return {
                    orderId: `${data.id}`,
                    requestId: `${data.id}`,
                    lang: "vi",
                } as IReqPayment.MomoPaymentLinkRequest;
            default:
                throw new BadRequestError("Invalid payment service", { service });
        }
    }

    private static async fetchTransactionStatus(
        service: SUPPORTED_PAYMENT_SERVICE,
        clientId: string,
        body: IReqPayment.PayOSGetTransactionStatus | IReqPayment.MomoPaymentLinkRequest
    ): Promise<IResPayment.PayOSGetTransactionStatus | IResPayment.MomoGetTransactionStatus> {
        const response = await fetch(`${PAYMENT_API_URL}/transaction_status?service=${service}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-client-id": clientId,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (data.code !== 0 && !(service === SUPPORTED_PAYMENT_SERVICE.MOMO && data.code === 10))
            throw new ServiceResponseError(service, "getTransactionStatus", "Failed to get transaction status", data);

        return data;
    }

    private static processTransactionStatusResponse(
        service: SUPPORTED_PAYMENT_SERVICE,
        data: IResPayment.PayOSGetTransactionStatus | IResPayment.MomoGetTransactionStatus
    ): IResPayment.GetTransactionStatus {
        switch (service) {
            case SUPPORTED_PAYMENT_SERVICE.PAYOS:
                const payOSData = (data as IResPayment.PayOSGetTransactionStatus).data;
                return {
                    amount: payOSData.amount,
                    orderId: payOSData.orderCode,
                    status: payOSData.status.toLowerCase() as PAYMENT_STATUS,
                };
            case SUPPORTED_PAYMENT_SERVICE.MOMO:
                const momoData = (data as IResPayment.MomoGetTransactionStatus).data;
                const status: PAYMENT_STATUS = this.getMomoResponseCode(momoData.resultCode);
                return {
                    amount: momoData.amount,
                    orderId: parseInt(momoData.orderId),
                    status,
                };
            default:
                throw new BadRequestError("Invalid payment service", { service });
        }
    }

    public static getMomoResponseCode(code: number): PAYMENT_STATUS {
        return MomoResponseCode[code] || PAYMENT_STATUS.CANCELLED;
    }
}

export const MomoResponseCode: { [key: number]: PAYMENT_STATUS } = Object.freeze({
    0: PAYMENT_STATUS.PAID,
    1000: PAYMENT_STATUS.PENDING,
    1005: PAYMENT_STATUS.EXPIRED,
    1006: PAYMENT_STATUS.CANCELLED,
});
