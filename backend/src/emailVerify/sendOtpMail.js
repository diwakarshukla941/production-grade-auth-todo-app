import { MailtrapClient } from "mailtrap";
import "dotenv/config";

const client = new MailtrapClient({
  token: process.env.MAILTRAP_TOKEN,
});

const sender = {
  email: "hello@demomailtrap.co",
  name: "ProdAuthTodo",
};

export const sendOtpMail = async (email, otp) => {
  try {
    const response = await client.send({
      from: sender,
      to: [{ email }],
      subject: "Password Reset OTP",
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
      `,
      category: "Password Reset",
    });

    console.log("OTP email sent successfully");
    console.log(response);

    return true;
  } catch (error) {
    console.error("Mailtrap Error:", error);
    return false;
  }
};