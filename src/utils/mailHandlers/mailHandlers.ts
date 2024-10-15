import fs from "fs";
import path from "path";
import { createTransport } from "nodemailer";
import { EMAIL, EMAIL_PASS } from "../../constants.js";

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
    html = html.replace("{{OTP}}", otp.toString());

    const mailOptions = {
        from: `EComm <${EMAIL}>`,
        to: email,
        subject: "Reset Password",
        html,
    };

    await transporter.sendMail(mailOptions).then((res) => console.log(JSON.stringify(res, undefined, 2)));
}
