// server/config/mail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587), // Gmail: 587 (STARTTLS)
  secure: false,
  auth: {
    user: process.env.SMTP_USER, // ví dụ: your@gmail.com (App password)
    pass: process.env.SMTP_PASS, // 16 ký tự app password
  },
});

async function sendMail({ to, subject, html, text }) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  if (!from || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials are missing');
  }
  return transporter.sendMail({ from, to, subject, html, text });
}

module.exports = { transporter, sendMail };
