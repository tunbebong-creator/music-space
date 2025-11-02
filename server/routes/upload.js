import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { 
  isCloudinaryConfigured, 
  uploadToCloudinary, 
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl 
} from '../services/cloudinary.js';

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
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const type = req.body.type || 'general';
    const isVideo = req.file.mimetype.startsWith('video/');
    const fileDir = isVideo ? 'videos' : type;

    // Try Cloudinary first if configured
    if (isCloudinaryConfigured()) {
      try {
        console.log('☁️ Uploading to Cloudinary...');
        const cloudinaryResult = await uploadToCloudinary(
          req.file.path,
          fileDir,
          `image-${Date.now()}-${Math.round(Math.random() * 1E9)}`
        );

        // Clean up local file after successful upload
        try {
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup local file:', cleanupError.message);
        }

        console.log('✅ Uploaded to Cloudinary:', cloudinaryResult.url);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.json({
          success: true,
          url: cloudinaryResult.url, // Full Cloudinary URL
          cloudinary_url: cloudinaryResult.url,
          public_id: cloudinaryResult.public_id,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: cloudinaryResult.bytes || req.file.size,
          type: req.file.mimetype,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          storage: 'cloudinary'
        });
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary upload failed, falling back to local:', cloudinaryError.message);
        // Fall through to local storage
      }
    }

    // Fallback to local storage
    console.log('💾 Using local storage (Cloudinary not configured or failed)');
    const filePath = path.join(uploadsDir, fileDir, req.file.filename);
    const fileUrl = `/uploads/${fileDir}/${req.file.filename}`;
    
    // Ensure directory exists
    const typeDir = path.join(uploadsDir, fileDir);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }

    // Move file from temp location to final location if needed
    if (req.file.path !== filePath && fs.existsSync(req.file.path)) {
      fs.renameSync(req.file.path, filePath);
    }
    
    const exists = fs.existsSync(filePath);
    const stats = exists ? fs.statSync(filePath) : null;
    
    console.log('📸 Local upload details:', { 
      filePath, 
      fileUrl, 
      size: req.file.size, 
      exists,
      actualSize: stats?.size,
    });
    
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      exists: exists,
      storage: 'local'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Upload multiple images
router.post('/multiple', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const type = req.body.type || 'general';
    const uploadedFiles = [];

    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith('video/');
      const fileDir = isVideo ? 'videos' : type;

      // Try Cloudinary first
      if (isCloudinaryConfigured()) {
        try {
          const cloudinaryResult = await uploadToCloudinary(
            file.path,
            fileDir,
            `image-${Date.now()}-${Math.round(Math.random() * 1E9)}`
          );

          // Clean up local file
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (cleanupError) {
            console.warn('⚠️ Failed to cleanup local file:', cleanupError.message);
          }

          uploadedFiles.push({
            url: cloudinaryResult.url,
            cloudinary_url: cloudinaryResult.url,
            public_id: cloudinaryResult.public_id,
            filename: file.filename,
            originalName: file.originalname,
            size: cloudinaryResult.bytes || file.size,
            type: file.mimetype,
            storage: 'cloudinary'
          });
          continue;
        } catch (cloudinaryError) {
          console.error('❌ Cloudinary upload failed for file, using local:', cloudinaryError.message);
        }
      }

      // Fallback to local
      const filePath = path.join(uploadsDir, fileDir, file.filename);
      const typeDir = path.join(uploadsDir, fileDir);
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true });
      }
      if (file.path !== filePath && fs.existsSync(file.path)) {
        fs.renameSync(file.path, filePath);
      }

      uploadedFiles.push({
        url: `/uploads/${fileDir}/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        type: file.mimetype,
        storage: 'local'
      });
    }
    
    res.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Delete uploaded file
router.delete('/:type/:filename', async (req, res) => {
  try {
    const { type, filename } = req.params;
    const { url, public_id } = req.query; // Accept URL or public_id for Cloudinary

    // Try Cloudinary deletion first if public_id or URL provided
    if (isCloudinaryConfigured() && (public_id || url)) {
      try {
        const publicId = public_id || extractPublicIdFromUrl(url);
        if (publicId) {
          await deleteFromCloudinary(publicId);
          return res.json({ success: true, message: 'File deleted from Cloudinary successfully' });
        }
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary delete failed:', cloudinaryError.message);
        // Fall through to local deletion
      }
    }

    // Fallback to local deletion
    const filePath = path.join(uploadsDir, type, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'File deleted from local storage successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed', details: error.message });
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
