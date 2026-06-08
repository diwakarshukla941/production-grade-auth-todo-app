import nodemailer from 'nodemailer'
import 'dotenv/config'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';

const __fileName = fileURLToPath(import.meta.url)
const __dir = path.dirname(__fileName)

export const verifyEmail = async (token, email) => {

    const emailTemplateSource = fs.readFileSync(
        path.join(__dir, "template.hbs"),
        "utf-8"
    )

    const template = handlebars.compile(emailTemplateSource)
    const htmlToSend = template({token: encodeURIComponent(token)})


    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    })

    const mailConfigurations = {
        from: process.env.MAIL_USER,
        to: email,
        subject: 'Email Verification',
        html: htmlToSend,
    }

    transporter.sendMail(mailConfigurations, function (err, info) {
        if (err) {
            throw new Error(err)
        }

        console.log(`email sent successfully`)
        console.log(info);

    })
}