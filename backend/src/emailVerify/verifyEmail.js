import nodemailer from "nodemailer";
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

    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: process.env.BREVO_SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"ProdAuthTodo" <${process.env.BREVO_SMTP_USER}>`,
      to: email,
      subject: "Email Verification",
      html: htmlToSend,
    });

    console.log("Verification email sent");
    console.log(info.messageId);

    return true;
  } catch (error) {
    console.error("Email Error:", error);
    return false;
  }
};