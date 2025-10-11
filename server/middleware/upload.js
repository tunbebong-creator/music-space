const multer = require('multer');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(root, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, root),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
  }
});

const fileFilter = (_, file, cb) => {
  const ok = /image\/(png|jpe?g|webp|gif)/i.test(file.mimetype);
  cb(ok ? null : new Error('invalid_file_type'), ok);
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
