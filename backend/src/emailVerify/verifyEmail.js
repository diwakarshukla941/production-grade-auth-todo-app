import nodemailer from "nodemailer";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import handlebars from "handlebars";

const __fileName = fileURLToPath(import.meta.url);
const __dir = path.dirname(__fileName);

export const verifyEmail = async (token, email) => {
  console.log("verifyEmail called");
  console.log("Sending mail to:", email);

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
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    console.log("Before transporter.verify()");

    await transporter.verify();

    console.log("After transporter.verify()");
    console.log("SMTP connection successful");

    console.log("Before sendMail()");

    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Email Verification",
      html: htmlToSend,
    });

    console.log("After sendMail()");
    console.log("Email sent successfully");
    console.log("Message ID:", info.messageId);

    return true;
  } catch (error) {
    console.error("=========== EMAIL ERROR ===========");
    console.error(error);
    console.error("===================================");

    return false;
  }
};