import nodemailer from "nodemailer";
import "../config/env.js";


const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.NODE_MAILER_EMAIL,
    pass: process.env.NODE_MAILER_PASSWORD,
  },
});

export const sendOtpEmail = async (toEmail, otpCode) => {
  // Check scripts set this; they used to send real mail through the account in .env.
  if (process.env.MAIL_DISABLED === "true") return;
  await transporter.sendMail({
    from: `"ChowGo Support" <${process.env.NODE_MAILER_EMAIL}>`,
    to: toEmail,
    subject: "Your Password Reset Code",
    html: `<p>Your password reset code is: <b>${otpCode}</b>. It expires in 5 minutes</p>`,
  });
};
