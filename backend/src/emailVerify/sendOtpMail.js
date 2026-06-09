import axios from "axios";
import "dotenv/config";

export const sendOtpMail = async (email, otp) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "ProdAuthTodo",
          email: "shukladiwakar941@gmail.com", // verified sender
        },
        to: [{ email }],
        subject: "Password Reset OTP",
        htmlContent: `
          <h2>Password Reset Request</h2>
          <p>Your OTP for password reset is:</p>
          <h1>${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
        `,
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
      }
    );

    console.log("OTP email sent");
    console.log(response.data);

    return true;
  } catch (error) {
    console.error(
      "Brevo Error:",
      error.response?.data || error.message
    );
    return false;
  }
};