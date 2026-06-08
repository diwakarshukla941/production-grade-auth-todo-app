import nodemailer from "nodemailer";
import "dotenv/config";

export const sendOtpMail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.verify();
    console.log("SMTP connection successful");

    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
      `,
    });

    console.log("OTP email sent successfully");
    console.log("Message ID:", info.messageId);

    return true;
  } catch (error) {
    console.error("OTP Email Error:", error.message);
    return false;
  }
};