import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer cho việc upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique với timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter để chỉ cho phép upload ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
    files: 10 // Tối đa 10 files
  }
});

// Middleware để upload nhiều ảnh
export const uploadMultipleImages = upload.array('images', 10);

// Middleware để upload 1 ảnh
export const uploadSingleImage = upload.single('image');

// Middleware để xử lý lỗi upload
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File quá lớn! Kích thước tối đa 5MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Quá nhiều file! Tối đa 10 files.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Field không mong đợi!' });
    }
  }
  if (error.message === 'Chỉ cho phép upload file ảnh!') {
    return res.status(400).json({ error: error.message });
  }
  next(error);
};

// Helper function để xóa file
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error('Lỗi khi xóa file:', error);
  }
  return false;
};

// Helper function để lấy URL của file
export const getFileUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};


















