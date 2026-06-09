import { MailtrapClient } from "mailtrap";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import handlebars from "handlebars";

const client = new MailtrapClient({
  token: process.env.MAILTRAP_TOKEN,
});

const sender = {
  email: "hello@demomailtrap.co",
  name: "ProdAuthTodo",
};

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

    const response = await client.send({
      from: sender,
      to: [{ email }],
      subject: "Email Verification",
      html: htmlToSend,
      category: "Email Verification",
    });

    console.log("Verification email sent successfully");
    console.log(response);

    return true;
  } catch (error) {
    console.error("Mailtrap Error:", error);
    return false;
  }
};