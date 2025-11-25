import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

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
  await transporter.sendMail({
    from: `"ChowGo Support" <${process.env.NODE_MAILER_EMAIL}>`,
    to: toEmail,
    subject: "Your Password Reset Code",
    html: `<p>Your password reset code is: <b>${otpCode}</b>. It expires in 5 minutes</p>`,
  });
};
