import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
// Use process.cwd() to ensure same base as server.js static mount
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type || 'general';
    // Handle videos separately
    let typeDir;
    if (file.mimetype.startsWith('video/')) {
      typeDir = path.join(uploadsDir, 'videos');
    } else {
      typeDir = path.join(uploadsDir, type);
    }
    
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
    
    cb(null, typeDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: fileFilter
});

// Upload single image
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate URL for the uploaded file
    const type = req.body.type || 'general';
    const isVideo = req.file.mimetype.startsWith('video/');
    const fileDir = isVideo ? 'videos' : type;
    const filePath = path.join(uploadsDir, fileDir, req.file.filename);
    const fileUrl = `/uploads/${fileDir}/${req.file.filename}`;
    
    // Force check file exists and log detailed info
    const exists = fs.existsSync(filePath);
    const stats = exists ? fs.statSync(filePath) : null;
    
    console.log('📸 Upload details:', { 
      filePath, 
      fileUrl, 
      size: req.file.size, 
      exists,
      actualSize: stats?.size,
      isFile: stats?.isFile(),
      permissions: stats?.mode?.toString(8)
    });
    
    // If file doesn't exist, try to write it again
    if (!exists) {
      console.log('⚠️ File not found, attempting to recreate...');
      const typeDir = path.join(uploadsDir, type);
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true });
      }
      
      // Copy from multer temp location to final location
      const tempPath = req.file.path;
      if (fs.existsSync(tempPath)) {
        fs.copyFileSync(tempPath, filePath);
        console.log('✅ File recreated successfully');
      }
    }
    
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      exists: fs.existsSync(filePath)
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload multiple images
router.post('/multiple', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => {
      const isVideo = file.mimetype.startsWith('video/');
      const fileDir = isVideo ? 'videos' : (req.body.type || 'general');
      return {
        url: `/uploads/${fileDir}/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        type: file.mimetype
      };
    });
    
    res.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Delete uploaded file
router.delete('/:type/:filename', (req, res) => {
  try {
    const { type, filename } = req.params;
    const filePath = path.join(uploadsDir, type, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Get upload statistics
router.get('/stats', (req, res) => {
  try {
    const stats = {};
    
    // Count files in each directory
    const types = ['general', 'events', 'spaces', 'users'];
    types.forEach(type => {
      const typeDir = path.join(uploadsDir, type);
      if (fs.existsSync(typeDir)) {
        const files = fs.readdirSync(typeDir);
        stats[type] = files.length;
      } else {
        stats[type] = 0;
      }
    });
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
