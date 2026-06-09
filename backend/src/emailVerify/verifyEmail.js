import axios from "axios";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import handlebars from "handlebars";

const __fileName = fileURLToPath(import.meta.url);
const __dir = path.dirname(__fileName);

export const verifyEmail = async (token, email) => {
  try {
    const emailTemplateSource = fs.readFileSync(
      path.join(__dir, "template.hbs"),
      "utf-8"
    );

    const template = handlebars.compile(emailTemplateSource);

    const verificationLink = `${process.env.CLIENT_URL}/verify/${encodeURIComponent(
      token
    )}`;

    const htmlToSend = template({
      verificationLink,
      token: encodeURIComponent(token),
    });

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "ProdAuthTodo",
          email: "shukladiwakar941@gmail.com", // verified sender
        },
        to: [{ email }],
        subject: "Email Verification",
        htmlContent: htmlToSend,
      },
      {
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
      }
    );

    console.log("Verification email sent");
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