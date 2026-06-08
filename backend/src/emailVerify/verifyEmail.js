import { Resend } from "resend";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import handlebars from "handlebars";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Email Verification",
      html: htmlToSend,
    });

    if (error) {
      console.error("Resend Error:", error);
      return false;
    }

    console.log("Email sent successfully");
    console.log(data);

    return true;
  } catch (error) {
    console.error("Email Error:", error);
    return false;
  }
};