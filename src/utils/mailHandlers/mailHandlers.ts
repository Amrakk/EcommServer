import fs from "fs";
import path from "path";
import { createTransport } from "nodemailer";
import { EMAIL, EMAIL_PASS } from "../../constants.js";
import { getLocalTimestampString } from "../getLocalTimestamp.js";

import type { IUserProfile } from "../../interfaces/database/user.js";
import type { IOrder, IOrderItem, ITransaction } from "../../interfaces/database/order.js";

export async function sendForgotOTP(email: string, otp: number) {
    const transporter = createTransport({
        service: "gmail",
        auth: {
            user: EMAIL,
            pass: EMAIL_PASS,
        },
    });

    const absPath = path.join(process.cwd(), "templates", "forgotPassword.html");
    let html = await fs.promises.readFile(absPath, "utf8");
    html = html.replace("{{ OTP }}", otp.toString());

    const mailOptions = {
        from: `EComm <${EMAIL}>`,
        to: email,
        subject: "Reset Password",
        html,
    };

    await transporter.sendMail(mailOptions);
}

export async function sendInvoiceEmail(user: IUserProfile, order: IOrder, transaction: ITransaction) {
    const transporter = createTransport({
        service: "gmail",
        auth: {
            user: EMAIL,
            pass: EMAIL_PASS,
        },
    });

    const discount = order.totalPrice - transaction.paymentAmount;
    const productList = getProductList(order.items);
    const localTimestamp = await getLocalTimestampString(transaction.createdAt);
    const checkoutBtn = transaction.checkoutUrl ? getCheckoutBtn(transaction.checkoutUrl) : "";

    const absPath = path.join(process.cwd(), "templates", "invoice.html");
    let html = await fs.promises.readFile(absPath, "utf8");

    html = html
        .replaceAll("{{ userName }}", user.name)
        .replace("{{ checkoutBtn }}", checkoutBtn)
        .replace("{{ createdDate }}", localTimestamp)
        .replace("{{ transactionStatus }}", transaction.paymentStatus.toUpperCase())
        .replace("{{ userEmail }}", user.email)
        .replace("{{ userPhone }}", user.phoneNumber ?? "0123456789")
        .replace("{{ paymentType }}", transaction.paymentType)
        .replaceAll("{{ street }}", order.shippingAddress.street)
        .replaceAll("{{ ward }}", order.shippingAddress.ward.name)
        .replaceAll("{{ district }}", order.shippingAddress.district.name)
        .replaceAll("{{ province }}", order.shippingAddress.province.name)
        .replaceAll("{{ contactInfo }}", order.shippingAddress.contactInfo ?? "")
        .replace("{{ productList }}", productList)
        .replace("{{ subtotal }}", formatAmount(order.totalPrice))
        .replace("{{ discount }}", formatAmount(discount ? -discount : 0))
        .replace("{{ shippingFee }}", formatAmount(transaction.shippingFee))
        .replace("{{ total }}", formatAmount(transaction.paymentAmount + transaction.shippingFee));

    const mailOptions = {
        from: `EComm <${EMAIL}>`,
        to: user.email,
        subject: "Order Invoice",
        html,
    };

    await transporter.sendMail(mailOptions);
}

export async function sendReceiptEmail(user: IUserProfile, order: IOrder, transaction: ITransaction) {
    const transporter = createTransport({
        service: "gmail",
        auth: {
            user: EMAIL,
            pass: EMAIL_PASS,
        },
    });

    const discount = order.totalPrice - transaction.paymentAmount;
    const productList = getProductList(order.items);
    const localTimestamp = await getLocalTimestampString(order.createdAt);

    const absPath = path.join(process.cwd(), "templates", "receipt.html");
    let html = await fs.promises.readFile(absPath, "utf8");

    html = html
        .replaceAll("{{ userName }}", user.name)
        .replace("{{ createdDate }}", localTimestamp)
        .replace("{{ orderStatus }}", order.status.toUpperCase())
        .replace("{{ userEmail }}", user.email)
        .replace("{{ userPhone }}", user.phoneNumber ?? "0123456789")
        .replace("{{ paymentType }}", transaction.paymentType)
        .replace("{{ paymentStatus }}", transaction.paymentStatus.toUpperCase())
        .replaceAll("{{ street }}", order.shippingAddress.street)
        .replaceAll("{{ ward }}", order.shippingAddress.ward.name)
        .replaceAll("{{ district }}", order.shippingAddress.district.name)
        .replaceAll("{{ province }}", order.shippingAddress.province.name)
        .replaceAll("{{ contactInfo }}", order.shippingAddress.contactInfo ?? "")
        .replace("{{ productList }}", productList)
        .replace("{{ subtotal }}", formatAmount(order.totalPrice))
        .replace("{{ discount }}", formatAmount(discount ? -discount : 0))
        .replace("{{ shippingFee }}", formatAmount(transaction.shippingFee))
        .replace("{{ total }}", formatAmount(transaction.paymentAmount + transaction.shippingFee));

    const mailOptions = {
        from: `EComm <${EMAIL}>`,
        to: user.email,
        subject: "Order Receipt",
        html,
    };

    await transporter.sendMail(mailOptions);
}

function formatAmount(amount: number) {
    return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

function getProductList(orderItem: IOrderItem[]) {
    return orderItem
        .map((item) => {
            return `
            <tr>
                <td>
                    <div class="product-info">
                        <strong>${item.product.name}</strong>
                        <p class="variant-id">${item.variant.id}</p>
                    </div>
                </td>
                <td>${formatAmount(item.variant.retailPrice)}</td>
                <td>${item.quantity}</td>
                <td>${formatAmount(item.variant.retailPrice * item.quantity)}</td>
            </tr>
        `;
        })
        .join("");
}

function getCheckoutBtn(url: string) {
    return `
        <div class="pay-wrap">
            <a href="${url}" class="btn">Pay Now</a>
        </div>
    `;
}
