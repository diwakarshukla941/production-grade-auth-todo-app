import { Resend } from "resend";
import "dotenv/config";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendOtpMail = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Password Reset OTP",
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is:</p>
        <h1>${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return false;
    }

    console.log("OTP email sent successfully");
    console.log(data);

    return true;
  } catch (error) {
    console.error("OTP Email Error:", error);
    return false;
  }
};