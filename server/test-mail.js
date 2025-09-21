require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true, // 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: { minVersion: 'TLSv1.2' }
  });

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.TEST_TO,
    subject: 'Test mail • Music Space',
    text: 'Xin chào! Đây là email test từ Music Space.'
  });

  console.log('✅ Sent:', info.messageId);
}

main().catch(console.error);
