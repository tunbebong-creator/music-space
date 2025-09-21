// server/config/mail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // Gmail 587 STARTTLS
  auth: {
    user: process.env.SMTP_USER, // ví dụ: your@gmail.com
    pass: process.env.SMTP_PASS, // app password
  },
});

async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  return transporter.sendMail({ from, to, subject, html, text });
}

module.exports = { transporter, sendMail };
