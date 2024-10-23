import type { PAYMENT_STATUS, SUPPORTED_PAYMENT_SERVICE } from "../../../constants.js";

export namespace IReqPayment {
    export interface CreateUser {
        email: string;
        ipnUrl: string;
        services: Services;
    }

    export interface Services {
        momo?: Momo;
        payos?: PayOS;
    }

    export interface PayOS {
        apiKey: string;
        clientId: string;
        checksumKey: string;
    }

    export interface Momo {
        partnerCode: string;
        accessKey: string;
        secretKey: string;
        publicKey: string | null;
    }

    export interface CreateTransaction {
        orderId: number;
        amount: number;
        /** Expire time in minute */
        expireTime?: number;
        description: string;
    }

    export interface PayOSPaymentLinkRequest {
        orderCode: number;
        amount: number;
        description: string;
        cancelUrl: string;
        returnUrl: string;
        /** Timestamp of the order */
        expiredAt?: number;
    }

    export interface MomoPaymentLinkRequest {
        orderId: string;
        requestId: string;
        amount: number;
        orderInfo: string;
        redirectUrl: string;
        /** Expire time of the order (minutes)[default: 100 minutes] */
        orderExpireTime?: number;

        requestType: "payWithMethod" | "captureWallet";
        extraData: "";
        lang: "vi";
    }

    export interface GetTransactionStatus {
        id: number;
    }

    export interface PayOSGetTransactionStatus {
        id: string | number;
    }

    export interface MomoGetTransactionStatus {
        orderId: string;
        requestId: string;
        lang: "vi";
    }

    export interface PaymentLinkCallbackQuery {
        service: SUPPORTED_PAYMENT_SERVICE;
    }

    export type PaymentLinkCallbackBody = MomoPaymentLinkCallback | PayOSPaymentLinkCallback;

    export interface MomoPaymentLinkCallback {
        partnerCode: string;
        orderId: string;
        requestId: string;
        amount: number;
        orderInfo: string;
        orderType: string;
        transId: number;
        resultCode: number;
        message: string;
        payType: "qr" | "webApp" | "credit" | "napas" | "";
        responseTime: number;
        extraData: string;
        signature: string;
    }

    export interface PayOSPaymentLinkCallback {
        orderCode: number;
        amount: number;
        description: string;
        accountNumber: string;
        reference: string;
        transactionDateTime: string;
        currency: string;
        paymentLinkId: string;
        code: string;
        desc: string;
        counterAccountBankId: string | null;
        counterAccountBankName: string | null;
        counterAccountName: string | null;
        counterAccountNumber: string | null;
        virtualAccountName: string | null;
        virtualAccountNumber: string | null;
    }
}

export namespace IResPayment {
    export interface CreateUser {
        code: number;
        message: string;
        data: {
            id: string;
            email: string;
            ipnUrl: string;
        };
    }

    export interface CreateTransaction {
        orderId: number;
        amount: number;
        checkoutUrl: string;
    }

    export interface PayOSPaymentLink {
        code: number;
        message: string;
        data: {
            bin: string;
            accountNumber: string;
            accountName: string;
            amount: number;
            description: string;
            orderCode: number;
            currency: string;
            paymentLinkId: string;
            status: PAYMENT_STATUS;
            expiredAt?: number;
            checkoutUrl: string;
            qrCode: string;
        };
    }

    export interface MomoPaymentLink {
        code: number;
        message: string;
        data: {
            partnerCode: string;
            orderId: string;
            responseTime: number;
            message: string;
            resultCode: number;
            requestId: string;
            amount: number;
            payUrl: string;

            /** CAPTURE_WALLET */
            deeplink?: string;
            qrCodeUrl?: string;
            deeplinkMiniApp?: string;
            signature?: string;

            /** PAY_WITH_METHOD */
            shortLink?: string;
        };
    }

    export interface GetTransactionStatus {
        orderId: number;
        amount: number;
        status: PAYMENT_STATUS;
    }

    export interface PayOSGetTransactionStatus {
        code: number;
        message: string;
        data: {
            id: string;
            orderCode: number;
            amount: number;
            amountPaid: number;
            amountRemaining: number;
            status: PAYMENT_STATUS;
            createdAt: Date;
            transactions: PayOSTransaction[] | null;
            canceledAt: Date | null;
            cancellationReason: string | null;
        };
    }

    export interface MomoGetTransactionStatus {
        code: number;
        message: string;
        data: {
            partnerCode: string;
            orderId: string;
            responseTime: number;
            message: string;
            resultCode: number;
            requestId: string;
            extraData: string;
            amount: number;
            transId: number;
            payType: "qr" | "webApp" | "credit" | "napas" | "";
            refundTrans: unknown[];
            lastUpdated: number;
            signature: string | null;
        };
    }

    export interface PayOSTransaction {
        amount: number;
        description: string;
        accountNumber: string;
        reference: string;
        transactionDateTime: Date;
        counterAccountBankId: string | null;
        counterAccountBankName: string | null;
        counterAccountName: string | null;
        counterAccountNumber: string | null;
        virtualAccountName: string | null;
        virtualAccountNumber: string | null;
    }
}
