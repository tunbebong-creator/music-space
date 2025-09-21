// server/lib/mailer.js  (tạo file riêng hoặc đặt ngay chỗ đang dùng)
const nodemailer = require('nodemailer');

async function createTransport() {
  const base = {
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }, // App Password 16 ký tự!
    pool: true,
    maxConnections: 2,
    maxMessages: 50,
    connectionTimeout: 20000,   // 20s
    greetingTimeout: 20000,
    socketTimeout: 20000,
    logger: true,               // log chi tiết vào console
    debug: true,
    tls: { servername: 'smtp.gmail.com' }, // tránh SNI lỗi lặt vặt
  };

  // đầu tiên thử SSL 465
  try {
    const t465 = nodemailer.createTransport({
      ...base, host: 'smtp.gmail.com', port: 465, secure: true,
    });
    await t465.verify();
    return t465;
  } catch (e) {
    console.warn('SMTP 465 failed:', e.message);
  }

  // fallback STARTTLS 587
  const t587 = nodemailer.createTransport({
    ...base, host: 'smtp.gmail.com', port: 587, secure: false, requireTLS: true,
  });
  await t587.verify();
  return t587;
}

module.exports = { createTransport };
