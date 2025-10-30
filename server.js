import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import adminRoutes from './server/routes/admin.js';
import uploadRoutes from './server/routes/upload.js';
import { uploadMultipleImages, uploadSingleImage, handleUploadError, deleteFile, getFileUrl } from './server/middleware/upload.js';

dotenv.config();

// HARD-CODE SMTP gmail, bypass mọi lỗi .env!
process.env.SMTP_HOST = 'smtp.gmail.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'monkeyboys267@gmail.com';
process.env.SMTP_PASS = 'ywwpomopyosababe';
process.env.SMTP_FROM = 'musicspace@gmail.com';
process.env.SITE_NAME = 'Music Space';

console.log('================== SMTP DEBUG ==================');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '(đã tồn tại)' : '(không có)');
console.log('SMTP_FROM:', process.env.SMTP_FROM);
console.log('SITE_NAME:', process.env.SITE_NAME);
console.log('================================================');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://music-space-frontend.onrender.com',
      'https://music-space.vercel.app',
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log('⚠️ CORS blocked origin:', origin);
      callback(null, true); // Allow all for now to debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Serve static files from uploads directory (use absolute path for reliability)
const uploadsAbsolutePath = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsAbsolutePath)) {
  fs.mkdirSync(uploadsAbsolutePath, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsAbsolutePath);
}

app.use('/uploads', express.static(uploadsAbsolutePath, {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
}));

// Fallback resolver for uploads in case of path discrepancies
app.get('/uploads/:type/:filename', (req, res, next) => {
  const { type, filename } = req.params;
  const candidates = [
    path.join(uploadsAbsolutePath, type, filename),
    path.join(process.cwd(), 'uploads', type, filename),
  ];
  
  console.log('🔍 Looking for file:', { type, filename, candidates });
  
  for (const full of candidates) {
    if (fs.existsSync(full)) {
      console.log('✅ Found file at:', full);
      return res.sendFile(full);
    }
  }
  
  console.log('❌ File not found in any candidate path');
  return res.status(404).json({ error: 'File not found', type, filename, candidates });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Music Space API Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      events: '/api/events',
      spaces: '/api/spaces',
      admin: '/api/admin'
    }
  });
});

// Debug: check uploads existence
app.get('/api/debug/uploads', (req, res) => {
  try {
    const rel = req.query.path || '';
    const full = path.join(uploadsAbsolutePath, rel.replace(/^\/+/, ''));
    const exists = fs.existsSync(full);
    const eventsDir = path.join(uploadsAbsolutePath, 'events');
    const generalDir = path.join(uploadsAbsolutePath, 'general');
    const spacesDir = path.join(uploadsAbsolutePath, 'spaces');
    
    let eventsSample = [];
    let generalSample = [];
    let spacesSample = [];
    
    if (fs.existsSync(eventsDir)) {
      eventsSample = fs.readdirSync(eventsDir).slice(0, 10);
    }
    if (fs.existsSync(generalDir)) {
      generalSample = fs.readdirSync(generalDir).slice(0, 10);
    }
    if (fs.existsSync(spacesDir)) {
      spacesSample = fs.readdirSync(spacesDir).slice(0, 10);
    }
    
    res.json({ 
      base: uploadsAbsolutePath, 
      check: rel, 
      fullPath: full, 
      exists,
      directories: {
        events: { exists: fs.existsSync(eventsDir), files: eventsSample },
        general: { exists: fs.existsSync(generalDir), files: generalSample },
        spaces: { exists: fs.existsSync(spacesDir), files: spacesSample }
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Neon Database connection - SIMPLE
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_Frv90HNpbhjo@ep-muddy-bonus-adx6h9r8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to Neon database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Test connection immediately
(async () => {
  try {
    console.log('🔄 Testing Neon database connection...');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Neon database connected successfully!');
    console.log('🕐 Current time from Neon:', result.rows[0].current_time);
  } catch (error) {
    console.error('❌ Failed to connect to Neon database:', error.message);
  }
})();

// Ensure required tables exist (lightweight bootstrap)
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('✅ Notifications table ensured.');
  } catch (e) {
    console.warn('⚠️ Could not ensure notifications table:', e.message);
  }
})();

// Ensure optional customer columns on bookings
(async () => {
  try {
    await pool.query(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50)
    `);
  } catch (e) {
    console.warn('⚠️ Could not alter bookings table for customer columns:', e.message);
  }
})();

// Helpers
async function getUserRole(userId) {
  try {
    const r = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    return r.rows[0]?.role || null;
  } catch (_) {
    return null;
  }
}

async function requirePartnerOrAdmin(req, res, next) {
  try {
    const role = await getUserRole(req.user.id);
    if (role === 'admin' || role === 'partner') {
      return next();
    }
    return res.status(403).json({ error: 'Partner or admin role required' });
  } catch (e) {
    return res.status(500).json({ error: 'Role check failed' });
  }
}

// Routes

// Health check with database test
app.get('/api/health', async (req, res) => {
  try {
    // Force database connection
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      database: 'Connected',
      time: result.rows[0].current_time
    });
  } catch (error) {
    res.json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message
    });
  }
});


// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    const { email, password, full_name, bio } = req.body;
    
    // Check if user already exists
    console.log('Checking existing user...');
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('User already exists');
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    console.log('Creating user...');
    const result = await pool.query(
      'INSERT INTO users (email, password, full_name, bio, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, bio, avatar_url, role',
      [email, hashedPassword, full_name, bio, 'user']
    );
    
    const user = result.rows[0];
    console.log('User created:', user);
    const token = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      role: user.role || 'user' 
    }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('Registration successful');
    res.json({ token, user });
  } catch (error) {
    console.error('Registration error details:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate token with role
    const token = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      role: user.role || 'user' 
    }, JWT_SECRET, { expiresIn: '7d' });
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, full_name, bio, avatar_url, role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Profile: get current user (alias of /api/auth/me)
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, full_name, bio, avatar_url, role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get /api/me error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Profile: update name/bio/avatar
app.put('/api/me', authenticateToken, async (req, res) => {
  try {
    const { full_name, bio, avatar_url } = req.body;
    const result = await pool.query(
      'UPDATE users SET full_name = COALESCE($1, full_name), bio = COALESCE($2, bio), avatar_url = COALESCE($3, avatar_url), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, email, full_name, bio, avatar_url, role',
      [full_name ?? null, bio ?? null, avatar_url ?? null, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update /api/me error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Profile: change password (requires current password)
app.put('/api/me/password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    const r = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(current_password, r.rows[0].password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (e) {
    console.error('Change password error:', e);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Ensure password reset table exists
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
    `);
    console.log('✅ password_resets table ensured.');
  } catch (e) {
    console.warn('⚠️ Could not ensure password_resets table:', e.message);
  }
})();

// Forgot password: create reset token
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Respond success to avoid account enumeration
      return res.json({ message: 'If the email exists, a reset link was sent' });
    }
    const userId = userResult.rows[0].id;
    const token = jwt.sign({ id: userId, type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await pool.query('INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)', [userId, token, expiresAt]);
    // In real life send email. For dev, return token.
    res.json({ message: 'Reset link generated', token });
  } catch (e) {
    console.error('Forgot password error:', e);
    res.status(500).json({ error: 'Failed to start reset' });
  }
});

// Reset password using token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) return res.status(400).json({ error: 'Token and new password required' });
    // Verify token validity and not used/expired
    const pr = await pool.query('SELECT * FROM password_resets WHERE token = $1 AND used = FALSE', [token]);
    if (pr.rows.length === 0) return res.status(400).json({ error: 'Invalid or used token' });
    const rec = pr.rows[0];
    if (new Date(rec.expires_at) < new Date()) return res.status(400).json({ error: 'Token expired' });
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (_) {
      return res.status(400).json({ error: 'Invalid token' });
    }
    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashed, rec.user_id]);
    await pool.query('UPDATE password_resets SET used = TRUE WHERE id = $1', [rec.id]);
    res.json({ message: 'Password has been reset' });
  } catch (e) {
    console.error('Reset password error:', e);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Test blog posts table structure
app.get('/api/blog-posts/test', async (req, res) => {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'blog_posts'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({ 
        error: 'Table blog_posts does not exist',
        suggestion: 'Create the table first'
      });
    }
    
    // Get table structure
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'blog_posts'
      ORDER BY ordinal_position;
    `);
    
    // Try to count posts
    const countResult = await pool.query('SELECT COUNT(*) as count FROM blog_posts');
    
    res.json({
      tableExists: true,
      columns: columns.rows,
      postCount: parseInt(countResult.rows[0].count),
      message: 'Table structure looks good'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Test failed', 
      details: error.message 
    });
  }
});

// Blog posts routes
app.get('/api/blog-posts', async (req, res) => {
  try {
    console.log('📝 Fetching blog posts...');
    
    // Try simplest query first
    let result;
    try {
      result = await pool.query('SELECT * FROM blog_posts ORDER BY created_at DESC NULLS LAST');
      console.log('✅ Query successful, found', result.rows.length, 'posts');
    } catch (queryError) {
      console.error('❌ Query failed:', queryError.message);
      console.error('❌ Error details:', queryError);
      
      // Try with different column names
      try {
        result = await pool.query('SELECT * FROM blog_posts ORDER BY id DESC');
        console.log('✅ Fallback query successful');
      } catch (fallbackError) {
        console.error('❌ Fallback query also failed:', fallbackError.message);
        return res.status(500).json({ 
          error: 'Database query failed', 
          details: fallbackError.message 
        });
      }
    }
    
    // Process posts
    const posts = result.rows.map(post => {
      // Parse media_urls if it's a JSON string
      let mediaUrls = [];
      if (post.media_urls) {
        if (typeof post.media_urls === 'string') {
          try {
            mediaUrls = JSON.parse(post.media_urls);
          } catch {
            mediaUrls = [];
          }
        } else if (Array.isArray(post.media_urls)) {
          mediaUrls = post.media_urls;
        }
      }
      
      // Get user info if user_id exists
      let createdBy = post.created_by || 'Music Space';
      let userEmail = null;
      
      return {
        ...post,
        likes: post.likes || 0,
        comment_count: post.comment_count || 0,
        media_urls: mediaUrls,
        created_by: createdBy,
        user_email: userEmail
      };
    });
    
    console.log('✅ Returning', posts.length, 'posts');
    res.json(posts);
  } catch (error) {
    console.error('❌ Error fetching blog posts:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch blog posts', 
      details: error.message 
    });
  }
});

app.post('/api/blog-posts', async (req, res) => {
  try {
    const { title, content, category, published, excerpt, image_url, media_urls, user_id } = req.body;
    
    // Ensure blog_posts table has all columns
    try {
      await pool.query(`
        ALTER TABLE blog_posts 
        ADD COLUMN IF NOT EXISTS excerpt TEXT,
        ADD COLUMN IF NOT EXISTS image_url TEXT,
        ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS user_id INTEGER,
        ADD COLUMN IF NOT EXISTS created_by VARCHAR(255),
        ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0
      `);
    } catch (alterError) {
      console.log('⚠️ Some columns may already exist:', alterError.message);
    }
    
    const token = req.headers['authorization']?.split(' ')[1];
    let userId = user_id;
    let userName = null;
    
    if (token && !userId) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
        
        // Get user name for created_by
        const userResult = await pool.query('SELECT full_name FROM users WHERE id = $1', [userId]);
        userName = userResult.rows[0]?.full_name || null;
      } catch {}
    }
    
    const result = await pool.query(
      `INSERT INTO blog_posts (title, content, category, published, excerpt, image_url, media_urls, user_id, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, content, category, published || false, excerpt || null, image_url || null, JSON.stringify(media_urls || []), userId || null, userName]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Failed to create blog post', details: error.message });
  }
});

// Update blog post (owner only)
app.put('/api/blog-posts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, published, excerpt, image_url, media_urls } = req.body;
    
    // Check if post exists and user owns it
    const postResult = await pool.query('SELECT user_id, created_by FROM blog_posts WHERE id = $1', [id]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = postResult.rows[0];
    const postUserId = String(post.user_id || '');
    const currentUserId = String(req.user.id || '');
    
    // Check ownership
    if (postUserId && currentUserId && postUserId !== currentUserId) {
      // Also check by name if user_id doesn't match
      const userResult = await pool.query('SELECT full_name, email FROM users WHERE id = $1', [req.user.id]);
      const userName = userResult.rows[0]?.full_name || '';
      const userEmail = userResult.rows[0]?.email || '';
      
      if (post.created_by !== userName && post.created_by !== userEmail) {
        return res.status(403).json({ error: 'Not authorized to update this post' });
      }
    }
    
    // Update post
    const updateResult = await pool.query(
      `UPDATE blog_posts 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           category = COALESCE($3, category),
           published = COALESCE($4, published),
           excerpt = COALESCE($5, excerpt),
           image_url = COALESCE($6, image_url),
           media_urls = COALESCE($7, media_urls),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        title || null,
        content || null,
        category || null,
        published !== undefined ? published : null,
        excerpt || null,
        image_url || null,
        media_urls ? JSON.stringify(media_urls) : null,
        id
      ]
    );
    
    // Parse media_urls
    const updatedPost = updateResult.rows[0];
    if (updatedPost.media_urls) {
      if (typeof updatedPost.media_urls === 'string') {
        try {
          updatedPost.media_urls = JSON.parse(updatedPost.media_urls);
        } catch {
          updatedPost.media_urls = [];
        }
      }
    }
    
    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Failed to update blog post', details: error.message });
  }
});

// Delete blog post (owner only)
app.delete('/api/blog-posts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if post exists and user owns it
    const postResult = await pool.query('SELECT user_id, created_by FROM blog_posts WHERE id = $1', [id]);
    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = postResult.rows[0];
    const postUserId = String(post.user_id || '');
    const currentUserId = String(req.user.id || '');
    
    // Check ownership
    if (postUserId && currentUserId && postUserId !== currentUserId) {
      // Also check by name if user_id doesn't match
      const userResult = await pool.query('SELECT full_name, email FROM users WHERE id = $1', [req.user.id]);
      const userName = userResult.rows[0]?.full_name || '';
      const userEmail = userResult.rows[0]?.email || '';
      
      if (post.created_by !== userName && post.created_by !== userEmail) {
        return res.status(403).json({ error: 'Not authorized to delete this post' });
      }
    }
    
    // Delete post (cascade will delete reactions and comments)
    await pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post', details: error.message });
  }
});

// Create reactions and comments tables
(async () => {
  try {
    console.log('🔄 Creating reactions and comments tables...');
    
    // Reactions table - use UUID for post_id
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_reactions (
        id SERIAL PRIMARY KEY,
        post_id VARCHAR(255) NOT NULL,
        user_id INTEGER NOT NULL,
        reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      );
    `);
    console.log('✅ post_reactions table created/verified');
    
    // If table exists with INTEGER post_id, alter it - FORCE UPDATE
    try {
      const colCheck = await pool.query(`
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'post_reactions' AND column_name = 'post_id'
      `);
      if (colCheck.rows.length > 0 && colCheck.rows[0].data_type === 'integer') {
        console.log('⚠️ STARTUP: Altering post_reactions.post_id from INTEGER to VARCHAR...');
        try {
          await pool.query(`ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_post_id_fkey CASCADE;`);
        } catch (e) {
          console.log('⚠️ Could not drop constraint (may not exist):', e.message);
        }
        
        await pool.query(`
          ALTER TABLE post_reactions 
          ALTER COLUMN post_id TYPE VARCHAR(255) USING post_id::VARCHAR(255);
        `);
        console.log('✅ STARTUP: post_reactions.post_id updated to VARCHAR');
      } else if (colCheck.rows.length > 0) {
        console.log('✅ STARTUP: post_reactions.post_id is already VARCHAR:', colCheck.rows[0].data_type);
      }
    } catch (alterError) {
      console.error('❌ STARTUP: Could not alter post_reactions.post_id:', alterError.message);
      console.error('❌ STARTUP: Error stack:', alterError.stack);
    }
    
    // Comments table - use UUID for post_id
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id SERIAL PRIMARY KEY,
        post_id VARCHAR(255) NOT NULL,
        user_id INTEGER NOT NULL,
        parent_id INTEGER,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ post_comments table created/verified');
    
    // If table exists with INTEGER post_id, alter it - FORCE UPDATE
    try {
      const colCheck = await pool.query(`
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'post_comments' AND column_name = 'post_id'
      `);
      if (colCheck.rows.length > 0 && colCheck.rows[0].data_type === 'integer') {
        console.log('⚠️ STARTUP: Altering post_comments.post_id from INTEGER to VARCHAR...');
        try {
          await pool.query(`ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS post_comments_post_id_fkey CASCADE;`);
        } catch (e) {
          console.log('⚠️ Could not drop constraint (may not exist):', e.message);
        }
        
        await pool.query(`
          ALTER TABLE post_comments 
          ALTER COLUMN post_id TYPE VARCHAR(255) USING post_id::VARCHAR(255);
        `);
        console.log('✅ STARTUP: post_comments.post_id updated to VARCHAR');
      } else if (colCheck.rows.length > 0) {
        console.log('✅ STARTUP: post_comments.post_id is already VARCHAR:', colCheck.rows[0].data_type);
      }
    } catch (alterError) {
      console.error('❌ STARTUP: Could not alter post_comments.post_id:', alterError.message);
      console.error('❌ STARTUP: Error stack:', alterError.stack);
    }
    
    // Create indexes
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
        CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
        CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);
        CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_id);
      `);
      console.log('✅ Indexes created/verified');
    } catch (idxError) {
      console.log('⚠️ Could not create indexes:', idxError.message);
    }
    
    console.log('✅ Reactions and comments tables fully ensured.');
  } catch (e) {
    console.error('❌ Could not ensure reactions/comments tables:', e.message);
    console.error('❌ Error stack:', e.stack);
  }
})();

// Public endpoint to create tables (no auth required for development)
app.post('/api/create-tables', async (req, res) => {
  try {
    console.log('🔄 Creating reactions and comments tables via API...');
    
    // First, check current column types
    const reactionsColCheck = await pool.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'post_reactions' AND column_name = 'post_id'
    `);
    
    const commentsColCheck = await pool.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'post_comments' AND column_name = 'post_id'
    `);
    
    console.log('📊 Current post_reactions.post_id type:', reactionsColCheck.rows[0]?.data_type || 'N/A');
    console.log('📊 Current post_comments.post_id type:', commentsColCheck.rows[0]?.data_type || 'N/A');
    
    // Reactions table - use VARCHAR for post_id (UUID)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_reactions (
        id SERIAL PRIMARY KEY,
        post_id VARCHAR(255) NOT NULL,
        user_id INTEGER NOT NULL,
        reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      );
    `);
    
    // Force ALTER if post_id is INTEGER
    if (reactionsColCheck.rows.length > 0 && reactionsColCheck.rows[0].data_type === 'integer') {
      console.log('⚠️ FORCE ALTERING post_reactions.post_id from INTEGER to VARCHAR...');
      try {
        await pool.query(`ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_post_id_fkey CASCADE;`);
        await pool.query(`ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_post_id_user_id_key CASCADE;`);
      } catch (e) {
        console.log('⚠️ Could not drop constraints:', e.message);
      }
      
      await pool.query(`
        ALTER TABLE post_reactions 
        ALTER COLUMN post_id TYPE VARCHAR(255) USING post_id::VARCHAR(255);
      `);
      console.log('✅ post_reactions.post_id updated to VARCHAR');
    }
    
    // Comments table - use VARCHAR for post_id (UUID)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_comments (
        id SERIAL PRIMARY KEY,
        post_id VARCHAR(255) NOT NULL,
        user_id INTEGER NOT NULL,
        parent_id INTEGER,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Force ALTER if post_id is INTEGER
    if (commentsColCheck.rows.length > 0 && commentsColCheck.rows[0].data_type === 'integer') {
      console.log('⚠️ FORCE ALTERING post_comments.post_id from INTEGER to VARCHAR...');
      try {
        await pool.query(`ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS post_comments_post_id_fkey CASCADE;`);
      } catch (e) {
        console.log('⚠️ Could not drop constraints:', e.message);
      }
      
      await pool.query(`
        ALTER TABLE post_comments 
        ALTER COLUMN post_id TYPE VARCHAR(255) USING post_id::VARCHAR(255);
      `);
      console.log('✅ post_comments.post_id updated to VARCHAR');
    }
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);
      CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_id);
    `);
    
    // Verify tables exist and check column types AFTER ALTER
    const reactionsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'post_reactions'
      );
    `);
    
    const commentsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'post_comments'
      );
    `);
    
    // Check column types AFTER ALTER
    const reactionsCol = await pool.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'post_reactions' AND column_name = 'post_id'
    `);
    
    const commentsCol = await pool.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'post_comments' AND column_name = 'post_id'
    `);
    
    res.json({ 
      success: true, 
      message: 'Tables created/updated successfully',
      tables: {
        post_reactions: reactionsCheck.rows[0].exists,
        post_comments: commentsCheck.rows[0].exists
      },
      columnTypes: {
        post_reactions_post_id: reactionsCol.rows[0]?.data_type || 'N/A',
        post_comments_post_id: commentsCol.rows[0]?.data_type || 'N/A'
      }
    });
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    res.status(500).json({ error: 'Failed to create tables', details: error.message, stack: error.stack });
  }
});

// Get reactions for a post (optional auth)
app.get('/api/blog-posts/:id/reactions', async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers['authorization']?.split(' ')[1];
    let userId = null;
    
    // Try to get user from token if available
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch {}
    }
    
    // Check if table exists
    try {
      // Get all reactions grouped by type
      const reactionsResult = await pool.query(`
        SELECT reaction_type, COUNT(*) as count
        FROM post_reactions
        WHERE post_id = $1
        GROUP BY reaction_type
      `, [id]);
      
      // Get user's reaction if logged in
      let userReaction = null;
      if (userId) {
        try {
          const userReactionResult = await pool.query(`
            SELECT reaction_type FROM post_reactions
            WHERE post_id = $1 AND user_id = $2
          `, [id, userId]);
          userReaction = userReactionResult.rows[0]?.reaction_type || null;
        } catch {}
      }
      
      res.json({
        reactions: reactionsResult.rows,
        userReaction: userReaction
      });
    } catch (tableError) {
      // Table doesn't exist yet, return empty
      console.log('⚠️ Reactions table not found, returning empty');
      res.json({
        reactions: [],
        userReaction: null
      });
    }
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.json({
      reactions: [],
      userReaction: null
    });
  }
});

// Add/update reaction
app.post('/api/blog-posts/:id/reactions', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction_type } = req.body;
    
    // Check if table exists, create if not
    let tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'post_reactions'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️ post_reactions table does not exist, creating it...');
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS post_reactions (
            id SERIAL PRIMARY KEY,
            post_id VARCHAR(255) NOT NULL,
            user_id INTEGER NOT NULL,
            reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(post_id, user_id)
          );
        `);
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
          CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);
        `);
        console.log('✅ post_reactions table created');
      } catch (createError) {
        console.error('❌ Failed to create post_reactions table:', createError.message);
        return res.status(500).json({ error: 'Reactions table not available', details: createError.message });
      }
    } else {
      // ALWAYS check and ALTER if needed - force update
      try {
        const colCheck = await pool.query(`
          SELECT data_type FROM information_schema.columns 
          WHERE table_name = 'post_reactions' AND column_name = 'post_id'
        `);
        if (colCheck.rows.length > 0 && colCheck.rows[0].data_type === 'integer') {
          console.log('⚠️ FORCE ALTERING post_reactions.post_id from INTEGER to VARCHAR...');
          try {
            // Drop constraint first
            await pool.query(`ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_post_id_fkey CASCADE;`);
          } catch (e) {
            console.log('⚠️ Could not drop constraint (may not exist):', e.message);
          }
          
          // Alter with USING clause to convert INTEGER to VARCHAR
          await pool.query(`
            ALTER TABLE post_reactions 
            ALTER COLUMN post_id TYPE VARCHAR(255) USING post_id::VARCHAR(255);
          `);
          console.log('✅ post_reactions.post_id updated to VARCHAR');
        } else if (colCheck.rows.length > 0) {
          console.log('✅ post_reactions.post_id is already VARCHAR:', colCheck.rows[0].data_type);
        }
      } catch (alterError) {
        console.error('❌ Could not alter post_reactions.post_id:', alterError.message);
        console.error('❌ Error stack:', alterError.stack);
      }
    }
    
    if (!reaction_type) {
      // Remove reaction
      await pool.query(`
        DELETE FROM post_reactions
        WHERE post_id = $1 AND user_id = $2
      `, [id, req.user.id]);
      
      // Update likes count
      await pool.query(`
        UPDATE blog_posts 
        SET likes = GREATEST(0, COALESCE(likes, 0) - 1)
        WHERE id = $1
      `, [id]);
      
      return res.json({ success: true, reaction_type: null });
    }
    
    // Check if user already reacted
    const existing = await pool.query(`
      SELECT reaction_type FROM post_reactions
      WHERE post_id = $1 AND user_id = $2
    `, [id, req.user.id]);
    
    if (existing.rows.length > 0) {
      // Update existing reaction
      await pool.query(`
        UPDATE post_reactions
        SET reaction_type = $1
        WHERE post_id = $2 AND user_id = $3
      `, [reaction_type, id, req.user.id]);
    } else {
      // Insert new reaction
      await pool.query(`
        INSERT INTO post_reactions (post_id, user_id, reaction_type)
        VALUES ($1, $2, $3)
      `, [id, req.user.id, reaction_type]);
      
      // Update likes count
      await pool.query(`
        UPDATE blog_posts 
        SET likes = COALESCE(likes, 0) + 1
        WHERE id = $1
      `, [id]);
    }
    
    res.json({ success: true, reaction_type });
  } catch (error) {
    console.error('❌ Error adding reaction:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to add reaction', details: error.message });
  }
});

// Get comments for a post (optional auth)
app.get('/api/blog-posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      const result = await pool.query(`
        SELECT c.*, u.full_name as user_name, u.email as user_email
        FROM post_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.post_id = $1 AND c.parent_id IS NULL
        ORDER BY c.created_at DESC
      `, [id]);
      
      res.json(result.rows);
    } catch (tableError) {
      // Table doesn't exist yet, return empty
      console.log('⚠️ Comments table not found, returning empty');
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.json([]);
  }
});

// Add comment
app.post('/api/blog-posts/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parent_id } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Check if table exists, create if not
    let tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'post_comments'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('⚠️ post_comments table does not exist, creating it...');
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS post_comments (
            id SERIAL PRIMARY KEY,
            post_id VARCHAR(255) NOT NULL,
            user_id INTEGER NOT NULL,
            parent_id INTEGER,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        await pool.query(`
          CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
          CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);
          CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_id);
        `);
        console.log('✅ post_comments table created');
      } catch (createError) {
        console.error('❌ Failed to create post_comments table:', createError.message);
        return res.status(500).json({ error: 'Comments table not available', details: createError.message });
      }
    } else {
      // ALWAYS check and ALTER if needed - force update
      try {
        const colCheck = await pool.query(`
          SELECT data_type FROM information_schema.columns 
          WHERE table_name = 'post_comments' AND column_name = 'post_id'
        `);
        if (colCheck.rows.length > 0 && colCheck.rows[0].data_type === 'integer') {
          console.log('⚠️ FORCE ALTERING post_comments.post_id from INTEGER to VARCHAR...');
          try {
            // Drop constraint first
            await pool.query(`ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS post_comments_post_id_fkey CASCADE;`);
          } catch (e) {
            console.log('⚠️ Could not drop constraint (may not exist):', e.message);
          }
          
          // Alter with USING clause to convert INTEGER to VARCHAR
          await pool.query(`
            ALTER TABLE post_comments 
            ALTER COLUMN post_id TYPE VARCHAR(255) USING post_id::VARCHAR(255);
          `);
          console.log('✅ post_comments.post_id updated to VARCHAR');
        } else if (colCheck.rows.length > 0) {
          console.log('✅ post_comments.post_id is already VARCHAR:', colCheck.rows[0].data_type);
        }
      } catch (alterError) {
        console.error('❌ Could not alter post_comments.post_id:', alterError.message);
        console.error('❌ Error stack:', alterError.stack);
      }
    }
    
    const result = await pool.query(`
      INSERT INTO post_comments (post_id, user_id, content, parent_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, req.user.id, content.trim(), parent_id || null]);
    
    // Update comment count (only if it's a top-level comment)
    if (!parent_id) {
      await pool.query(`
        UPDATE blog_posts 
        SET comment_count = COALESCE(comment_count, 0) + 1
        WHERE id = $1
      `, [id]);
    }
    
    // Get comment with user info
    const commentResult = await pool.query(`
      SELECT c.*, u.full_name as user_name, u.email as user_email
      FROM post_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [result.rows[0].id]);
    
    res.json(commentResult.rows[0]);
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to add comment', details: error.message });
  }
});

// ==================== SPACES CRUD API ====================

// Get all spaces with pagination and filters
app.get('/api/spaces', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', city = '', min_price = '', max_price = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, u.full_name as owner_name, u.email as owner_email, u.avatar_url as owner_avatar
      FROM spaces s
      LEFT JOIN users u ON s.owner_id = u.id
    `;
    let countQuery = 'SELECT COUNT(*) as count FROM spaces s';
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`(s.name ILIKE $${params.length + 1} OR s.description ILIKE $${params.length + 1} OR s.address ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (status) {
      conditions.push(`s.status = $${params.length + 1}`);
      params.push(status);
    }

    if (city) {
      conditions.push(`s.city ILIKE $${params.length + 1}`);
      params.push(`%${city}%`);
    }

    if (min_price) {
      conditions.push(`s.price_per_hour >= $${params.length + 1}`);
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      conditions.push(`s.price_per_hour <= $${params.length + 1}`);
      params.push(parseFloat(max_price));
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const [spacesResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    res.json({
      spaces: spacesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching spaces:', error);
    res.status(500).json({ error: 'Failed to fetch spaces' });
  }
});

// Get single space by ID
app.get('/api/spaces/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT s.*, u.full_name as owner_name, u.email as owner_email, u.avatar_url as owner_avatar, u.bio as owner_bio
      FROM spaces s
      LEFT JOIN users u ON s.owner_id = u.id
      WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching space:', error);
    res.status(500).json({ error: 'Failed to fetch space' });
  }
});

// Create new space
app.post('/api/spaces', authenticateToken, requirePartnerOrAdmin, uploadMultipleImages, handleUploadError, async (req, res) => {
  try {
    const { name, description, address, city, capacity, price_per_hour, amenities } = req.body;
    
    // Lấy thông tin user từ token
    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Xử lý ảnh nếu có
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => getFileUrl(req, file.filename));
    }

    // Xử lý amenities
    const amenitiesArray = amenities ? (Array.isArray(amenities) ? amenities : amenities.split(',').map(a => a.trim())) : [];

    const result = await pool.query(
      `INSERT INTO spaces (name, description, address, city, capacity, price_per_hour, amenities, images, owner_id, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, description, address, city, capacity, price_per_hour, amenitiesArray, JSON.stringify(images), req.user.id, 'pending']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating space:', error);
    res.status(500).json({ error: 'Failed to create space' });
  }
});

// Update space
app.put('/api/spaces/:id', authenticateToken, requirePartnerOrAdmin, uploadMultipleImages, handleUploadError, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, address, city, capacity, price_per_hour, amenities, status } = req.body;

    // Kiểm tra quyền sở hữu
    const spaceResult = await pool.query('SELECT owner_id, images FROM spaces WHERE id = $1', [id]);
    if (spaceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found' });
    }

    if (spaceResult.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this space' });
    }

    // Xử lý ảnh mới
    let images = JSON.parse(spaceResult.rows[0].images || '[]');
    if (req.files && req.files.length > 0) {
      // Xóa ảnh cũ
      images.forEach(imageUrl => {
        const filename = imageUrl.split('/').pop();
        deleteFile(`uploads/${filename}`);
      });
      // Thêm ảnh mới
      images = req.files.map(file => getFileUrl(req, file.filename));
    }

    // Xử lý amenities
    const amenitiesArray = amenities ? (Array.isArray(amenities) ? amenities : amenities.split(',').map(a => a.trim())) : [];

    const result = await pool.query(
      `UPDATE spaces SET name = $1, description = $2, address = $3, city = $4, capacity = $5, 
       price_per_hour = $6, amenities = $7, images = $8, status = $9, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10 RETURNING *`,
      [name, description, address, city, capacity, price_per_hour, amenitiesArray, JSON.stringify(images), status, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating space:', error);
    res.status(500).json({ error: 'Failed to update space' });
  }
});

// Delete space
app.delete('/api/spaces/:id', authenticateToken, requirePartnerOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra quyền sở hữu
    const spaceResult = await pool.query('SELECT owner_id, images FROM spaces WHERE id = $1', [id]);
    if (spaceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found' });
    }

    if (spaceResult.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this space' });
    }

    // Xóa ảnh
    const images = JSON.parse(spaceResult.rows[0].images || '[]');
    images.forEach(imageUrl => {
      const filename = imageUrl.split('/').pop();
      deleteFile(`uploads/${filename}`);
    });

    await pool.query('DELETE FROM spaces WHERE id = $1', [id]);

    res.json({ message: 'Space deleted successfully' });
  } catch (error) {
    console.error('Error deleting space:', error);
    res.status(500).json({ error: 'Failed to delete space' });
  }
});

// Approve/Reject space (Admin only)
app.put('/api/spaces/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Kiểm tra quyền admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await pool.query(
      'UPDATE spaces SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found' });
    }

    const space = result.rows[0];
    // Notify owner if approved
    if (space && status === 'approved') {
      try {
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
          [space.owner_id, 'space_approved', 'Không gian đã được duyệt', `Space "${space.name}" đã được admin phê duyệt.`]
        );
      } catch (e) {
        console.warn('⚠️ Failed to insert space approval notification:', e.message);
      }
    }
    res.json(space);
  } catch (error) {
    console.error('Error updating space status:', error);
    res.status(500).json({ error: 'Failed to update space status' });
  }
});

// Get spaces by owner
app.get('/api/spaces/owner/:owner_id', async (req, res) => {
  try {
    const { owner_id } = req.params;
    const result = await pool.query(`
      SELECT s.*, u.full_name as owner_name, u.email as owner_email
      FROM spaces s
      LEFT JOIN users u ON s.owner_id = u.id
      WHERE s.owner_id = $1
      ORDER BY s.created_at DESC
    `, [owner_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching spaces by owner:', error);
    res.status(500).json({ error: 'Failed to fetch spaces by owner' });
  }
});

// ==================== EVENTS CRUD API ====================

// Get all events with pagination and filters
app.get('/api/events', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'approved', space_id = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT e.*, s.name as space_name, s.address as space_address, 
             e.latitude as event_latitude, e.longitude as event_longitude,
             u.full_name as organizer_name, u.email as organizer_email
      FROM events e
      LEFT JOIN spaces s ON e.space_id = s.id
      LEFT JOIN users u ON CAST(e.organizer_id AS TEXT) = CAST(u.id AS TEXT)
    `;
    let countQuery = 'SELECT COUNT(*) as count FROM events e';
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`(e.title ILIKE $${params.length + 1} OR e.description ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (status) {
      conditions.push(`e.status = $${params.length + 1}`);
      params.push(status);
    }

    if (space_id) {
      conditions.push(`e.space_id = $${params.length + 1}`);
      params.push(space_id);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY e.event_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const [eventsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    const mapped = eventsResult.rows.map((e) => {
      const firstImage = Array.isArray(e.cover_image) ? e.cover_image[0] : (Array.isArray(e.images) ? e.images[0] : (Array.isArray(e.gallery_images) ? e.gallery_images[0] : null));
      const rawCover = e.cover_image || firstImage || null;
      const image_url = rawCover ? (String(rawCover).startsWith('http') ? rawCover : `${req.protocol}://${req.get('host')}${rawCover}`) : null;
      return {
        ...e,
        image_url,
        date: e.event_date,
        time: e.start_time
      };
    });

    res.json({
      events: mapped,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event by ID
app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT e.*, s.name as space_name, s.address as space_address, s.images as space_images,
             u.full_name as organizer_name, u.email as organizer_email, u.avatar_url as organizer_avatar
      FROM events e
      LEFT JOIN spaces s ON e.space_id = s.id
      LEFT JOIN users u ON CAST(e.organizer_id AS TEXT) = CAST(u.id AS TEXT)
      WHERE e.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const e = result.rows[0];
    const firstImage = Array.isArray(e.cover_image) ? e.cover_image[0] : (Array.isArray(e.images) ? e.images[0] : (Array.isArray(e.gallery_images) ? e.gallery_images[0] : null));
    const rawCover = e.cover_image || firstImage || null;
    const image_url = rawCover ? (String(rawCover).startsWith('http') ? rawCover : `${req.protocol}://${req.get('host')}${rawCover}`) : null;
    const mapped = { ...e, image_url, date: e.event_date, time: e.start_time };
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create new event
app.post('/api/events', authenticateToken, requirePartnerOrAdmin, uploadMultipleImages, handleUploadError, async (req, res) => {
  try {
    const { title, description, event_date, duration_hours, max_participants, price, space_id, status } = req.body;
    
    // Lấy thông tin user từ token
    const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Xử lý ảnh nếu có
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => getFileUrl(req, file.filename));
    }

    const result = await pool.query(
      `INSERT INTO events (title, description, event_date, duration_hours, max_participants, price, space_id, organizer_id, status, images) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [title, description, event_date, duration_hours, max_participants, price, space_id, req.user.id, 'pending', JSON.stringify(images)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event
app.put('/api/events/:id', authenticateToken, requirePartnerOrAdmin, uploadMultipleImages, handleUploadError, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, duration_hours, max_participants, price, space_id, status } = req.body;

    // Kiểm tra quyền sở hữu
    const eventResult = await pool.query('SELECT organizer_id, images FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (eventResult.rows[0].organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this event' });
    }

    // Xử lý ảnh mới
    let images = JSON.parse(eventResult.rows[0].images || '[]');
    if (req.files && req.files.length > 0) {
      // Xóa ảnh cũ
      images.forEach(imageUrl => {
        const filename = imageUrl.split('/').pop();
        deleteFile(`uploads/${filename}`);
      });
      // Thêm ảnh mới
      images = req.files.map(file => getFileUrl(req, file.filename));
    }

    const result = await pool.query(
      `UPDATE events SET title = $1, description = $2, event_date = $3, duration_hours = $4, 
       max_participants = $5, price = $6, space_id = $7, status = $8, images = $9, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $10 RETURNING *`,
      [title, description, event_date, duration_hours, max_participants, price, space_id, status, JSON.stringify(images), id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
app.delete('/api/events/:id', authenticateToken, requirePartnerOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra quyền sở hữu
    const eventResult = await pool.query('SELECT organizer_id, images FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (eventResult.rows[0].organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }

    // Xóa ảnh
    const images = JSON.parse(eventResult.rows[0].images || '[]');
    images.forEach(imageUrl => {
      const filename = imageUrl.split('/').pop();
      deleteFile(`uploads/${filename}`);
    });

    await pool.query('DELETE FROM events WHERE id = $1', [id]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Approve/Reject event (Admin only)
app.put('/api/events/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Kiểm tra quyền admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await pool.query(
      'UPDATE events SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = result.rows[0];
    if (event && status === 'approved') {
      try {
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4)',
          [event.organizer_id, 'event_approved', 'Sự kiện đã được duyệt', `Event "${event.title}" đã được admin phê duyệt.`]
        );
      } catch (e) {
        console.warn('⚠️ Failed to insert event approval notification:', e.message);
      }
    }
    res.json(event);
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ error: 'Failed to update event status' });
  }
});

// Bookings routes
app.get('/api/bookings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.post('/api/bookings', async (req, res) => {
  console.log('📝 POST /api/bookings - Request received');
  console.log('📝 Request origin:', req.headers.origin);
  console.log('📝 Request headers:', JSON.stringify(req.headers, null, 2));
  const startTime = Date.now();
  
  try {
    // Accept both snake_case and camelCase from the client
    const body = req.body || {};
    console.log('📝 Booking request body:', JSON.stringify(body));
    
    const space_id = body.space_id ?? body.spaceId ?? null;
    const user_id = body.user_id ?? body.userId ?? null;
    const event_id = body.event_id ?? body.eventId ?? null;
    let booking_date = body.booking_date ?? body.bookingDate ?? null;
    let start_time = body.start_time ?? body.startTime ?? null;
    let end_time = body.end_time ?? body.endTime ?? null;
    let total_price = body.total_price ?? body.totalPrice ?? null;
    const status = body.status ?? 'pending';
    const quantity = body.quantity ?? 1;
    const customer_email = body.customer_email ?? body.email ?? null;
    const customer_name = body.customer_name ?? body.name ?? null;
    const customer_phone = body.customer_phone ?? body.phone ?? null;
    const payment_method = body.payment_method ?? body.paymentMethod ?? 'Thanh toán tại sự kiện';

    // If booking for an event, derive times from event if not provided
    let finalBookingDate = booking_date;
    let finalStartTime = start_time;
    let finalEndTime = end_time;
    let finalTotalPrice = total_price;

    if (event_id && (!finalBookingDate || !finalStartTime || !finalEndTime)) {
      console.log('📝 Fetching event details for event_id:', event_id);
      const eventResult = await pool.query('SELECT event_date, duration_hours, price, title FROM events WHERE id = $1', [event_id]);
      if (eventResult.rows.length === 0) {
        console.error('❌ Event not found:', event_id);
        return res.status(400).json({ error: 'Invalid event_id' });
      }
      const event = eventResult.rows[0];
      const eventDate = new Date(event.event_date);
      const startIso = eventDate.toISOString();
      // Build ISO date and times
      finalBookingDate = finalBookingDate || eventDate.toISOString();
      // Extract time HH:MM:SS from event_date
      const hh = String(eventDate.getHours()).padStart(2, '0');
      const mm = String(eventDate.getMinutes()).padStart(2, '0');
      finalStartTime = finalStartTime || `${hh}:${mm}:00`;
      const endDate = new Date(eventDate.getTime() + (Number(event.duration_hours || 2) * 60 * 60 * 1000));
      const eh = String(endDate.getHours()).padStart(2, '0');
      const em = String(endDate.getMinutes()).padStart(2, '0');
      finalEndTime = finalEndTime || `${eh}:${em}:00`;

      if (!finalTotalPrice && event.price != null) {
        const qty = Math.max(1, Number(quantity || 1));
        finalTotalPrice = String(Number(event.price) * qty);
      }
    }

    // Normalize provided booking_date (e.g., 'YYYY-MM-DD' to timestamp)
    if (finalBookingDate) {
      const d = new Date(finalBookingDate);
      if (!isNaN(d.getTime())) {
        finalBookingDate = d.toISOString();
      }
    }

    // As a last fallback, avoid NOT NULL violation
    if (!finalBookingDate) {
      const now = new Date();
      finalBookingDate = now.toISOString();
      if (!finalStartTime) finalStartTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:00`;
      if (!finalEndTime) finalEndTime = finalStartTime;
    }

    console.log('📝 Inserting booking into database...');
    const insertResult = await pool.query(
      `INSERT INTO bookings (
         space_id, user_id, event_id, booking_date, start_time, end_time, total_price, status, payment_status,
         customer_name, customer_email, customer_phone
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        space_id || null,
        user_id || null,
        event_id || null,
        finalBookingDate,
        finalStartTime,
        finalEndTime,
        finalTotalPrice,
        status || 'pending',
        'pending',
        customer_name || null,
        customer_email || null,
        customer_phone || null
      ]
    );

    const booking = insertResult.rows[0];
    console.log('✅ Booking inserted successfully:', booking.id);
    console.log('⏱️ Time taken:', Date.now() - startTime, 'ms');

    // IMPORTANT: Send response IMMEDIATELY after database insert
    // Don't wait for anything else
    console.log('📤 Sending response immediately...');
    res.json(booking);
    console.log('✅ Response sent successfully');

    // Send confirmation email AFTER response is sent (non-blocking)
    if (customer_email) {
      console.log('📧 Scheduling email to be sent...');
      // Use setImmediate to ensure email doesn't block
      setImmediate(async () => {
        try {
          console.log('📧 Email sending started for:', customer_email);
          const siteName = process.env.SITE_NAME || 'Music Space';
          const payText = payment_method ? `Phương thức thanh toán: ${payment_method}` : 'Phương thức thanh toán: Thanh toán tại sự kiện';
          const subject = `Xác nhận đặt vé #${booking.id}`;
          const body = `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 16px;">
              <h2 style="color:#1E88E5; margin:0 0 12px;">${siteName} - Xác nhận đặt vé</h2>
              <p>Xin chào <strong>${customer_name || ''}</strong>,</p>
              <p>Bạn đã đặt vé thành công. Mã đặt vé: <strong>#${booking.id}</strong></p>
              <div style="background:#f7f7f7; padding:12px 16px; border-radius:8px; margin:16px 0;">
                <p><strong>Ngày:</strong> ${new Date(booking.booking_date).toLocaleString('vi-VN')}</p>
                <p><strong>Giờ:</strong> ${booking.start_time} - ${booking.end_time}</p>
                <p><strong>Tổng tiền:</strong> ${booking.total_price || '0'}</p>
                <p>${payText}</p>
              </div>
              <p>Nếu có bất kỳ thắc mắc nào, vui lòng phản hồi email này.</p>
              <p style="color:#666;">Trân trọng,<br/>${siteName}</p>
            </div>
          `;

          // Direct SMTP sending (better for Render)
          let nodemailer;
          try {
            nodemailer = (await import('nodemailer')).default;
            console.log('📧 Nodemailer loaded successfully');
          } catch (e) {
            console.error('❌ Failed to load nodemailer:', e);
            return;
          }
          
          if (!nodemailer) {
            console.log('⚠️ Nodemailer not available');
            return;
          }
          
          let transporter;
          if (process.env.SMTP_HOST) {
            console.log('📧 Creating SMTP transporter with:', {
              host: process.env.SMTP_HOST,
              port: process.env.SMTP_PORT,
              user: process.env.SMTP_USER,
              hasPass: !!process.env.SMTP_PASS
            });
            
            transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT || 587),
              secure: Boolean(process.env.SMTP_SECURE === 'true'),
              auth: process.env.SMTP_USER ? { 
                user: process.env.SMTP_USER, 
                pass: process.env.SMTP_PASS 
              } : undefined,
              // Add timeout and connection timeout to prevent hanging
              connectionTimeout: 10000,
              greetingTimeout: 10000,
              socketTimeout: 10000,
              // Disable verification on Render (might be blocked)
              tls: {
                rejectUnauthorized: false
              }
            });
            
            // Skip verification on Render (might be blocked by firewall)
            console.log('📧 Skipping SMTP verification (Render might block)');
          } else {
            console.log('⚠️ No SMTP config, skipping email');
            return;
          }
          
          console.log('📧 Sending email to:', customer_email);
          const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@musicspace.dev',
            to: customer_email,
            subject,
            html: body
          });
          
          console.log('✅ Email sent successfully:', {
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected
          });
          
          if (nodemailer.getTestMessageUrl && info) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
              console.log('✉️ Booking email preview URL:', previewUrl);
            }
          }
          console.log('✅ Booking confirmation email sent to:', customer_email);
        } catch (e) {
          console.error('❌ Failed to send booking confirmation email:', e);
          console.error('❌ Email error details:', {
            message: e.message,
            stack: e.stack,
            code: e.code,
            response: e.response,
            responseCode: e.responseCode,
            command: e.command
          });
          // Don't throw - email failure shouldn't affect booking
        }
      });
    }
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create booking', details: error.message });
  }
});

// Simple email integration endpoint for frontend calls
app.post('/api/integrations/email', async (req, res) => {
  console.log('=== EMAIL API CALLED ===');
  console.log('📧 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { to, subject, body, from_name } = req.body || {};
    
    if (!to) {
      return res.status(400).json({ error: 'Email recipient (to) is required' });
    }
    
    let nodemailer;
    try {
      nodemailer = (await import('nodemailer')).default;
      console.log('📧 Nodemailer loaded');
    } catch(e) {
      console.error('❌ Không tìm thấy nodemailer:', e);
      return res.status(500).json({ error: 'Nodemailer not installed' });
    }
    
    let transporter;
    if (process.env.SMTP_HOST) {
      console.log('📧 Using SMTP config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER
      });
      
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Boolean(process.env.SMTP_SECURE === 'true'),
        auth: process.env.SMTP_USER ? { 
          user: process.env.SMTP_USER, 
          pass: process.env.SMTP_PASS 
        } : undefined,
        // Add timeouts to prevent hanging
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        // Disable TLS verification on Render (might be blocked)
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // Skip verification on Render - might be blocked
      console.log('📧 Skipping SMTP verification (might be blocked on Render)');
    } else {
      console.log('⚠️ No SMTP config, using test account');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
    }
    
    console.log('📧 Sending email to:', to);
    const info = await transporter.sendMail({
      from: from_name ? `${from_name} <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@musicspace.dev'}>` : (process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@musicspace.dev'),
      to,
      subject,
      html: body
    });
    
    console.log('✅ Email sent:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    });
    
    const preview = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
    if (preview) {
      console.log('✉️ Email preview URL:', preview);
    }
    
    res.json({ success: true, preview, messageId: info.messageId });
  } catch (error) {
    console.error('❌ EMAIL ERROR (API):', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    res.status(500).json({ error: 'Failed to send email', details: String(error) });
  }
});

// Newsletter routes
app.get('/api/newsletters', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM newsletter_subscriptions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching newsletters:', error);
    res.status(500).json({ error: 'Failed to fetch newsletters' });
  }
});

app.post('/api/newsletters', async (req, res) => {
  try {
    const { email, name } = req.body;
    const result = await pool.query(
      'INSERT INTO newsletter_subscriptions (email, name) VALUES ($1, $2) RETURNING *',
      [email, name]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating newsletter subscription:', error);
    res.status(500).json({ error: 'Failed to create newsletter subscription' });
  }
});

// Contact messages routes
app.post('/api/contact-messages', async (req, res) => {
  try {
    const { name, email, subject, message, phone, type } = req.body;
    console.log('📧 Received contact message:', { name, email, subject, phone, type, message: message?.substring(0, 50) });
    
    // Ensure table exists with all fields
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'contact_messages'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('❌ Table contact_messages does not exist! Creating it...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS contact_messages (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50),
            subject VARCHAR(500),
            message TEXT NOT NULL,
            type VARCHAR(50),
            status VARCHAR(50) DEFAULT 'new',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('✅ Table contact_messages created');
      } else {
        // Add missing columns if they don't exist
        try {
          await pool.query(`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`);
          await pool.query(`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS type VARCHAR(50);`);
          await pool.query(`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new';`);
        } catch (alterError) {
          console.log('⚠️ Some columns may already exist:', alterError.message);
        }
      }
    } catch (tableError) {
      console.error('⚠️ Error checking table:', tableError.message);
    }
    
    const result = await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message, phone, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, subject || '', message, phone || null, type || null]
    );
    
    console.log('✅ Contact message saved successfully, ID:', result.rows[0].id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error creating contact message:', error);
    console.error('❌ Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to create contact message', details: error.message });
  }
});

// Test endpoint to create sample contact message
app.post('/api/admin/test-contact-message', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message, phone, type) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      ['Test User', 'test@example.com', 'Test Subject', 'This is a test contact message', '0123456789', 'general']
    );
    res.json({ message: 'Test contact message created', data: result.rows[0] });
  } catch (error) {
    console.error('Error creating test message:', error);
    res.status(500).json({ error: 'Failed to create test message', details: error.message });
  }
});

// ==================== ADMIN API ENDPOINTS ====================

// Admin Dashboard Statistics
app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get all statistics in parallel
    const [
      usersResult,
      spacesResult,
      eventsResult,
      bookingsResult,
      newslettersResult,
      contactMessagesResult,
      blogPostsResult
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM spaces'),
      pool.query('SELECT COUNT(*) as count FROM events'),
      pool.query('SELECT COUNT(*) as count FROM bookings'),
      pool.query('SELECT COUNT(*) as count FROM newsletter_subscriptions'),
      pool.query('SELECT COUNT(*) as count FROM contact_messages'),
      pool.query('SELECT COUNT(*) as count FROM blog_posts')
    ]);

    // Get recent activity
    const recentUsers = await pool.query(`
      SELECT id, email, full_name, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    const recentSpaces = await pool.query(`
      SELECT id, name, address, created_at 
      FROM spaces 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    const recentBookings = await pool.query(`
      SELECT b.id, b.start_time, b.end_time, b.total_price, b.status, b.created_at,
             COALESCE(b.customer_name, u.full_name) as user_name,
             COALESCE(b.customer_email, u.email) as user_email,
             s.name as space_name,
             e.title as event_title,
             COALESCE(s.name, e.title, 'N/A') as booking_name,
             b.user_id,
             b.customer_name,
             u.full_name as user_full_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN spaces s ON b.space_id = s.id
      LEFT JOIN events e ON b.event_id = e.id
      ORDER BY b.created_at DESC 
      LIMIT 5
    `);

    console.log('📊 Recent bookings count:', recentBookings.rows.length);
    recentBookings.rows.forEach((booking, idx) => {
      console.log(`📊 Booking ${idx + 1}:`, {
        id: booking.id,
        user_name: booking.user_name,
        customer_name: booking.customer_name,
        user_full_name: booking.user_full_name,
        user_id: booking.user_id,
        space_name: booking.space_name
      });
    });

    res.json({
      stats: {
        totalUsers: parseInt(usersResult.rows[0].count),
        totalSpaces: parseInt(spacesResult.rows[0].count),
        totalEvents: parseInt(eventsResult.rows[0].count),
        totalBookings: parseInt(bookingsResult.rows[0].count),
        totalNewsletters: parseInt(newslettersResult.rows[0].count),
        totalContactMessages: parseInt(contactMessagesResult.rows[0].count),
        totalBlogPosts: parseInt(blogPostsResult.rows[0].count)
      },
      recentActivity: {
        users: recentUsers.rows,
        spaces: recentSpaces.rows,
        bookings: recentBookings.rows
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch admin statistics' });
  }
});

// Admin Users Management
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, email, full_name, role, avatar_url, bio, created_at FROM users';
    let countQuery = 'SELECT COUNT(*) as count FROM users';
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`(full_name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (role) {
      conditions.push(`role = $${params.length + 1}`);
      params.push(role);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const [usersResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    res.json({
      users: usersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role
app.put('/api/admin/users/:id/role', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { role } = req.body;
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, full_name, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user
app.delete('/api/admin/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user (cascade will handle related records)
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Admin Spaces Management
app.get('/api/admin/spaces', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*, u.full_name as owner_name, u.email as owner_email
      FROM spaces s
      LEFT JOIN users u ON s.owner_id = u.id
    `;
    let countQuery = 'SELECT COUNT(*) as count FROM spaces s';
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push(`(s.name ILIKE $${params.length + 1} OR s.address ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (status) {
      conditions.push(`s.status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const [spacesResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    res.json({
      spaces: spacesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (error) {
    console.error('Admin spaces error:', error);
    res.status(500).json({ error: 'Failed to fetch spaces' });
  }
});

// Admin Bookings Management
app.get('/api/admin/bookings', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 10, status = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT b.*,
             COALESCE(b.customer_name, u.full_name) as user_name,
             COALESCE(b.customer_email, u.email) as user_email,
             s.name as space_name,
             e.title as event_title,
             COALESCE(s.name, e.title, 'N/A') as booking_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN spaces s ON b.space_id = s.id
      LEFT JOIN events e ON b.event_id = e.id
    `;
    let countQuery = 'SELECT COUNT(*) as count FROM bookings b';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`b.status = $${params.length + 1}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const [bookingsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    res.json({
      bookings: bookingsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (error) {
    console.error('Admin bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Update booking status
app.put('/api/admin/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status } = req.body;
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});

// Admin Contact Messages
app.get('/api/admin/contact-messages', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin - check token first, then DB
    let userRole = req.user?.role;
    
    if (!userRole && req.user?.id) {
      // Load role from database if not in token
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
      if (userResult.rows.length > 0) {
        userRole = userResult.rows[0].role;
      }
    }
    
    if (userRole !== 'admin') {
      console.log('❌ Access denied for contact messages. User role:', userRole, 'User ID:', req.user?.id);
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    console.log('🔍 Fetching contact messages, page:', page, 'limit:', limit);

    // Check if table exists first
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'contact_messages'
        );
      `);
      
      if (!tableCheck.rows[0].exists) {
        console.log('❌ Table contact_messages does not exist! Creating it...');
        await pool.query(`
          CREATE TABLE IF NOT EXISTS contact_messages (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            subject VARCHAR(500),
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('✅ Table contact_messages created');
      }
    } catch (tableError) {
      console.error('⚠️ Error checking table:', tableError.message);
    }

    const [messagesResult, countResult] = await Promise.all([
      pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) as count FROM contact_messages')
    ]);

    console.log('✅ Found', messagesResult.rows.length, 'contact messages');
    console.log('📊 Total count:', countResult.rows[0].count);

    res.json({
      messages: messagesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (error) {
    console.error('Admin contact messages error:', error);
    res.status(500).json({ error: 'Failed to fetch contact messages' });
  }
});

// Admin Newsletter Subscribers
app.get('/api/admin/newsletters', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [subscribersResult, countResult] = await Promise.all([
      pool.query('SELECT * FROM newsletter_subscriptions ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) as count FROM newsletter_subscriptions')
    ]);

    res.json({
      subscribers: subscribersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (error) {
    console.error('Admin newsletters error:', error);
    res.status(500).json({ error: 'Failed to fetch newsletter subscribers' });
  }
});

// Test admin spaces endpoint
app.get('/api/admin/spaces-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM spaces LIMIT 5');
    res.json({ 
      message: 'Test successful', 
      spaces: result.rows,
      count: result.rows.length 
    });
  } catch (error) {
    console.error('Test spaces error:', error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

// Generate admin token for development
app.post('/api/generate-admin-token', (req, res) => {
  try {
    const adminPayload = {
      id: 1,
      email: 'admin@musicspace.edu.vn',
      role: 'admin',
      full_name: 'Admin User'
    };
    
    const token = jwt.sign(adminPayload, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: adminPayload });
  } catch (error) {
    console.error('Error generating admin token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// ==================== ARTIST API ENDPOINTS ====================

// Debug endpoint to check event_registrations table structure
app.get('/api/debug/event-registrations', async (req, res) => {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'event_registrations'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      return res.json({ 
        exists: false,
        message: 'Table event_registrations does not exist' 
      });
    }
    
    // Get all columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'event_registrations'
      ORDER BY ordinal_position;
    `);
    
    // Get PRIMARY KEY constraints
    const pkConstraints = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'event_registrations' AND constraint_type = 'PRIMARY KEY';
    `);
    
    // Get UNIQUE constraints
    const uniqueConstraints = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'event_registrations' AND constraint_type = 'UNIQUE';
    `);
    
    // Get sample data
    const sampleData = await pool.query(`
      SELECT * FROM event_registrations LIMIT 5;
    `);
    
    res.json({
      exists: true,
      columns: columns.rows,
      primaryKeys: pkConstraints.rows,
      uniqueConstraints: uniqueConstraints.rows,
      sampleData: sampleData.rows,
      rowCount: sampleData.rowCount
    });
  } catch (error) {
    console.error('Error checking event_registrations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Auto-fix event_registrations table endpoint (supports both GET and POST)
app.get('/api/debug/fix-event-registrations', async (req, res) => {
  try {
    console.log('🔧 Starting event_registrations table fix (GET)...');
    
    // Drop table if exists
    await pool.query('DROP TABLE IF EXISTS event_registrations CASCADE;');
    console.log('✅ Dropped old table');
    
    // Recreate with correct structure
    await pool.query(`
      CREATE TABLE event_registrations (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(255) NOT NULL,
        artist_id INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, artist_id)
      );
    `);
    console.log('✅ Created new table');
    
    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_event_registrations_artist ON event_registrations(artist_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);');
    console.log('✅ Created indexes');
    
    // Verify
    const verify = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'event_registrations'
      ORDER BY ordinal_position;
    `);
    
    res.json({
      success: true,
      message: 'Table event_registrations fixed successfully! Refresh the page and check Artist Dashboard.',
      columns: verify.rows
    });
  } catch (error) {
    console.error('❌ Error fixing event_registrations:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/debug/fix-event-registrations', async (req, res) => {
  try {
    console.log('🔧 Starting event_registrations table fix (POST)...');
    
    // Drop table if exists
    await pool.query('DROP TABLE IF EXISTS event_registrations CASCADE;');
    console.log('✅ Dropped old table');
    
    // Recreate with correct structure
    await pool.query(`
      CREATE TABLE event_registrations (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(255) NOT NULL,
        artist_id INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, artist_id)
      );
    `);
    console.log('✅ Created new table');
    
    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_event_registrations_artist ON event_registrations(artist_id);');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);');
    console.log('✅ Created indexes');
    
    // Verify
    const verify = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'event_registrations'
      ORDER BY ordinal_position;
    `);
    
    res.json({
      success: true,
      message: 'Table event_registrations fixed successfully!',
      columns: verify.rows
    });
  } catch (error) {
    console.error('❌ Error fixing event_registrations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create tables for artist features
(async () => {
  try {
    // Event registrations table (artist đăng ký biểu diễn event)
    // Use VARCHAR for event_id to support both UUID and INTEGER
    // Ensure table has id column
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(255) NOT NULL,
        artist_id INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, artist_id)
      );
    `);
    
    // Ensure id column exists (in case table was created differently)
    // But don't add if PRIMARY KEY already exists (to avoid "multiple primary keys" error)
    try {
      const idCheck = await pool.query(`
        SELECT column_name, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'event_registrations' AND column_name = 'id'
      `);
      if (idCheck.rows.length === 0) {
        // Check if table has any PRIMARY KEY constraint
        const pkCheck = await pool.query(`
          SELECT constraint_name FROM information_schema.table_constraints 
          WHERE table_name = 'event_registrations' AND constraint_type = 'PRIMARY KEY'
        `);
        
        if (pkCheck.rows.length === 0) {
          console.log('⚠️ STARTUP: Adding id column to event_registrations...');
          await pool.query(`ALTER TABLE event_registrations ADD COLUMN id SERIAL PRIMARY KEY;`);
          console.log('✅ STARTUP: id column added to event_registrations');
        } else {
          console.log('⚠️ STARTUP: event_registrations already has PRIMARY KEY, skipping id column');
        }
      } else {
        console.log('✅ STARTUP: event_registrations.id column already exists');
      }
    } catch (e) {
      console.log('⚠️ Could not check/add id column:', e.message);
    }
    
    // Check and add artist_id column if missing (might have user_id instead)
    try {
      const colCheck = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'event_registrations' AND column_name IN ('artist_id', 'user_id')
      `);
      
      const hasArtistId = colCheck.rows.some(r => r.column_name === 'artist_id');
      const hasUserId = colCheck.rows.some(r => r.column_name === 'user_id');
      
      if (!hasArtistId && hasUserId) {
        // Rename user_id to artist_id
        console.log('⚠️ STARTUP: Renaming event_registrations.user_id to artist_id...');
        try {
          // Drop old constraint first
          await pool.query(`ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_event_id_user_id_key CASCADE;`);
        } catch (e) {
          console.log('⚠️ Could not drop old constraint:', e.message);
        }
        
        await pool.query(`ALTER TABLE event_registrations RENAME COLUMN user_id TO artist_id;`);
        
        // Recreate unique constraint with new column name
        try {
          await pool.query(`ALTER TABLE event_registrations ADD CONSTRAINT event_registrations_event_id_artist_id_key UNIQUE(event_id, artist_id);`);
        } catch (e) {
          console.log('⚠️ Could not recreate constraint (may already exist):', e.message);
        }
        
        console.log('✅ STARTUP: event_registrations.user_id renamed to artist_id');
      } else if (!hasArtistId) {
        // Add artist_id column
        console.log('⚠️ STARTUP: Adding artist_id column to event_registrations...');
        await pool.query(`ALTER TABLE event_registrations ADD COLUMN artist_id INTEGER;`);
        console.log('✅ STARTUP: artist_id column added');
      }
    } catch (alterError) {
      console.error('❌ STARTUP: Could not alter event_registrations for artist_id:', alterError.message);
    }
    
    // If table exists with INTEGER event_id, alter it
    try {
      const colCheck = await pool.query(`
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'event_registrations' AND column_name = 'event_id'
      `);
      if (colCheck.rows.length > 0 && colCheck.rows[0].data_type === 'integer') {
        console.log('⚠️ STARTUP: Altering event_registrations.event_id from INTEGER to VARCHAR...');
        try {
          await pool.query(`ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_event_id_artist_id_key CASCADE;`);
          await pool.query(`ALTER TABLE event_registrations DROP CONSTRAINT IF EXISTS event_registrations_event_id_user_id_key CASCADE;`);
        } catch (e) {
          console.log('⚠️ Could not drop constraint:', e.message);
        }
        
        await pool.query(`
          ALTER TABLE event_registrations 
          ALTER COLUMN event_id TYPE VARCHAR(255) USING event_id::VARCHAR(255);
        `);
        console.log('✅ STARTUP: event_registrations.event_id updated to VARCHAR');
      }
    } catch (alterError) {
      console.error('❌ STARTUP: Could not alter event_registrations.event_id:', alterError.message);
    }
    
    // Messages table (chat giữa artist-partner/admin)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        event_id INTEGER,
        content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    
    // Create indexes (handle errors gracefully)
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);`);
    } catch (e) {
      console.log('⚠️ Could not create index on event_id:', e.message);
    }
    
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_event_registrations_artist ON event_registrations(artist_id);`);
    } catch (e) {
      console.log('⚠️ Could not create index on artist_id:', e.message);
    }
    
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_event ON messages(event_id);`);
    } catch (e) {
      console.log('⚠️ Could not create message indexes:', e.message);
    }
    
    console.log('✅ Artist tables (event_registrations, messages) ensured.');
  } catch (e) {
    console.error('❌ Could not ensure artist tables:', e.message);
  }
})();

// Get upcoming events for artist
app.get('/api/artist/events', authenticateToken, async (req, res) => {
  try {
    // Check if user is artist
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'artist') {
      return res.status(403).json({ error: 'Artist access required' });
    }
    
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get upcoming approved events - handle NULL event_date
    // Check if event_registrations table exists first
    let tableExists = false;
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'event_registrations'
        );
      `);
      tableExists = tableCheck.rows[0].exists;
    } catch (e) {
      console.log('⚠️ Could not check event_registrations table:', e.message);
    }
    
    // Build query with optional registration join
    let registrationJoin = '';
    let registrationSelect = '';
    let colCheckResult = null;
    
    if (tableExists) {
      // Check if artist_id column exists
      let artistIdExists = false;
      let registrationIdExists = false;
      try {
        colCheckResult = await pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'event_registrations' AND column_name IN ('artist_id', 'user_id', 'id')
        `);
        artistIdExists = colCheckResult.rows.some(r => r.column_name === 'artist_id' || r.column_name === 'user_id');
        registrationIdExists = colCheckResult.rows.some(r => r.column_name === 'id');
      } catch (e) {
        console.log('⚠️ Could not check columns:', e.message);
      }
      
      if (artistIdExists && colCheckResult) {
        const artistCol = colCheckResult.rows.some(r => r.column_name === 'artist_id') ? 'artist_id' : 'user_id';
        registrationJoin = `LEFT JOIN event_registrations er ON CAST(e.id AS TEXT) = CAST(er.event_id AS TEXT) AND er.${artistCol} = CAST($1 AS INTEGER)`;
        
        // Only select er.id if it exists
        if (registrationIdExists) {
          registrationSelect = `er.status as registration_status, er.id as registration_id,`;
        } else {
          registrationSelect = `er.status as registration_status, NULL::INTEGER as registration_id,`;
        }
      } else {
        registrationSelect = `NULL::VARCHAR as registration_status, NULL::INTEGER as registration_id,`;
      }
    } else {
      registrationSelect = `NULL::VARCHAR as registration_status, NULL::INTEGER as registration_id,`;
    }
    
    console.log('🔍 Debug - Fetching artist events:', {
      userId: req.user.id,
      userIdType: typeof req.user.id,
      tableExists,
      registrationJoin,
      registrationSelect
    });
    
    const result = await pool.query(`
      SELECT e.*, 
             s.name as space_name, 
             s.address as space_address,
             u.full_name as organizer_name,
             u.email as organizer_email,
             ${registrationSelect}
             COALESCE(e.cover_image, e.images::text, NULL) as cover_image
      FROM events e
      LEFT JOIN spaces s ON CAST(e.space_id AS TEXT) = CAST(s.id AS TEXT)
      LEFT JOIN users u ON CAST(e.organizer_id AS TEXT) = CAST(u.id AS TEXT)
      ${registrationJoin}
      WHERE e.status = 'approved' 
        AND (e.event_date IS NULL OR e.event_date >= CURRENT_DATE)
      ORDER BY COALESCE(e.event_date, '2099-12-31'::date) ASC
      LIMIT $2 OFFSET $3
    `, [req.user.id, parseInt(limit), offset]);
    
    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM events e
      WHERE e.status = 'approved' 
        AND (e.event_date IS NULL OR e.event_date >= CURRENT_DATE)
    `);
    
    res.json({
      events: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching artist events:', error);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

// Register for event (artist đăng ký biểu diễn)
app.post('/api/artist/events/:eventId/register', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { 
      full_name, 
      email, 
      phone, 
      bio, 
      instruments, 
      experience_years, 
      portfolio_url, 
      message 
    } = req.body;
    
    // Check if user is artist
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'artist') {
      return res.status(403).json({ error: 'Artist access required' });
    }
    
    // Check if event exists and is approved
    const eventResult = await pool.query('SELECT id, organizer_id, status FROM events WHERE id = $1', [eventId]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const event = eventResult.rows[0];
    if (event.status !== 'approved') {
      return res.status(400).json({ error: 'Event is not approved' });
    }
    
    // Check if already registered - cast event_id to VARCHAR
    const existingReg = await pool.query(
      'SELECT id FROM event_registrations WHERE CAST(event_id AS TEXT) = CAST($1 AS TEXT) AND artist_id = $2',
      [eventId, req.user.id]
    );
    
    if (existingReg.rows.length > 0) {
      return res.status(400).json({ error: 'Already registered for this event' });
    }
    
    // Ensure columns exist in event_registrations table
    try {
      await pool.query(`
        ALTER TABLE event_registrations 
        ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS bio TEXT,
        ADD COLUMN IF NOT EXISTS instruments TEXT[],
        ADD COLUMN IF NOT EXISTS experience_years INTEGER,
        ADD COLUMN IF NOT EXISTS portfolio_url TEXT;
      `);
    } catch (alterError) {
      console.log('⚠️ Could not alter event_registrations columns:', alterError.message);
    }
    
    // Create registration - cast event_id to VARCHAR
    const regResult = await pool.query(`
      INSERT INTO event_registrations (
        event_id, 
        artist_id, 
        status, 
        message,
        full_name,
        email,
        phone,
        bio,
        instruments,
        experience_years,
        portfolio_url
      )
      VALUES (
        CAST($1 AS TEXT), 
        $2, 
        'pending', 
        $3,
        $4,
        $5,
        $6,
        $7,
        $8::TEXT[],
        $9::INTEGER,
        $10
      )
      RETURNING *
    `, [
      eventId, 
      req.user.id, 
      message || null,
      full_name || null,
      email || null,
      phone || null,
      bio || null,
      Array.isArray(instruments) ? instruments : [],
      experience_years ? parseInt(experience_years) : null,
      portfolio_url || null
    ]);
    
    // Send notification to organizer
    try {
      await pool.query(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, 'event_registration', 'Có artist đăng ký biểu diễn', 
          'Artist ${full_name || userResult.rows[0].email} đã đăng ký biểu diễn cho event của bạn')
      `, [event.organizer_id]);
    } catch (e) {
      console.log('⚠️ Could not create notification:', e.message);
    }
    
    res.json({ success: true, registration: regResult.rows[0] });
  } catch (error) {
    console.error('Error registering for event:', error);
    res.status(500).json({ error: 'Failed to register for event', details: error.message });
  }
});

// Get my registrations
app.get('/api/artist/registrations', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'artist') {
      return res.status(403).json({ error: 'Artist access required' });
    }
    
    const result = await pool.query(`
      SELECT er.*, 
             e.title as event_title,
             e.event_date,
             e.start_time,
             e.description as event_description,
             s.name as space_name,
             u.full_name as organizer_name,
             u.email as organizer_email
      FROM event_registrations er
      JOIN events e ON CAST(e.id AS TEXT) = CAST(er.event_id AS TEXT)
      LEFT JOIN spaces s ON e.space_id = s.id
      LEFT JOIN users u ON CAST(e.organizer_id AS TEXT) = CAST(u.id AS TEXT)
      WHERE er.artist_id = $1
      ORDER BY er.created_at DESC
    `, [req.user.id]);
    
    res.json({ registrations: result.rows });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Get messages (chat)
app.get('/api/artist/messages', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'artist') {
      return res.status(403).json({ error: 'Artist access required' });
    }
    
    const { conversation_with } = req.query; // partner/admin ID
    
    let query = `
      SELECT m.*,
             sender.full_name as sender_name,
             sender.email as sender_email,
             sender.role as sender_role,
             receiver.full_name as receiver_name,
             receiver.email as receiver_email,
             receiver.role as receiver_role
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE (m.sender_id = $1 OR m.receiver_id = $1)
    `;
    
    const params = [req.user.id];
    
    if (conversation_with) {
      query += ` AND (m.sender_id = $2 OR m.receiver_id = $2)`;
      params.push(parseInt(conversation_with));
    }
    
    query += ` ORDER BY m.created_at ASC`;
    
    const result = await pool.query(query, params);
    
    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message
app.post('/api/artist/messages', authenticateToken, async (req, res) => {
  try {
    const { receiver_id, event_id, content } = req.body;
    
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'artist') {
      return res.status(403).json({ error: 'Artist access required' });
    }
    
    // Check receiver is partner or admin
    const receiverResult = await pool.query('SELECT role FROM users WHERE id = $1', [receiver_id]);
    if (receiverResult.rows.length === 0 || !['partner', 'admin'].includes(receiverResult.rows[0].role)) {
      return res.status(400).json({ error: 'Can only message partners or admins' });
    }
    
    const result = await pool.query(`
      INSERT INTO messages (sender_id, receiver_id, event_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [req.user.id, receiver_id, event_id || null, content]);
    
    // Send notification to receiver
    try {
      await pool.query(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, 'new_message', 'Tin nhắn mới từ Artist', $2)
      `, [receiver_id, `Bạn có tin nhắn mới từ artist ${userResult.rows[0].email || 'Artist'}`]);
    } catch (e) {
      console.log('⚠️ Could not create notification:', e.message);
    }
    
    res.json({ success: true, message: result.rows[0] });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

// Get conversation partners (list of partners/admins artist can chat with)
app.get('/api/artist/conversations', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0 || userResult.rows[0].role !== 'artist') {
      return res.status(403).json({ error: 'Artist access required' });
    }
    
    // Get unique conversation partners (partners/admins)
    const result = await pool.query(`
      SELECT DISTINCT 
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.avatar_url,
        (SELECT COUNT(*) FROM messages m 
         WHERE (m.receiver_id = $1 AND m.sender_id = u.id AND m.read = FALSE)) as unread_count,
        (SELECT content FROM messages m 
         WHERE (m.sender_id = u.id OR m.receiver_id = u.id) 
         ORDER BY m.created_at DESC LIMIT 1) as last_message
      FROM users u
      LEFT JOIN messages m ON (m.sender_id = u.id OR m.receiver_id = u.id) 
        AND (m.sender_id = $1 OR m.receiver_id = $1)
      WHERE u.role IN ('partner', 'admin')
        AND u.id != $1
      ORDER BY unread_count DESC, last_message DESC NULLS LAST
    `, [req.user.id]);
    
    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Mark messages as read
app.put('/api/artist/messages/read', authenticateToken, async (req, res) => {
  try {
    const { conversation_with } = req.body;
    
    await pool.query(`
      UPDATE messages 
      SET read = TRUE 
      WHERE receiver_id = $1 AND sender_id = $2 AND read = FALSE
    `, [req.user.id, conversation_with]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// ==================== PARTNER/ADMIN CHAT API ====================

// Get messages for partner/admin
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (!['partner', 'admin'].includes(userResult.rows[0]?.role)) {
      return res.status(403).json({ error: 'Partner or admin access required' });
    }
    
    const { conversation_with } = req.query; // artist ID
    
    let query = `
      SELECT m.*,
             sender.full_name as sender_name,
             sender.email as sender_email,
             sender.role as sender_role,
             receiver.full_name as receiver_name,
             receiver.email as receiver_email,
             receiver.role as receiver_role
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE (m.sender_id = $1 OR m.receiver_id = $1)
    `;
    
    const params = [req.user.id];
    
    if (conversation_with) {
      query += ` AND (m.sender_id = $2 OR m.receiver_id = $2)`;
      params.push(parseInt(conversation_with));
    }
    
    query += ` ORDER BY m.created_at ASC`;
    
    const result = await pool.query(query, params);
    
    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message (partner/admin)
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { receiver_id, event_id, content } = req.body;
    
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (!['partner', 'admin'].includes(userResult.rows[0]?.role)) {
      return res.status(403).json({ error: 'Partner or admin access required' });
    }
    
    // Check receiver is artist
    const receiverResult = await pool.query('SELECT role FROM users WHERE id = $1', [receiver_id]);
    if (receiverResult.rows.length === 0 || receiverResult.rows[0].role !== 'artist') {
      return res.status(400).json({ error: 'Can only message artists' });
    }
    
    const result = await pool.query(`
      INSERT INTO messages (sender_id, receiver_id, event_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [req.user.id, receiver_id, event_id || null, content]);
    
    // Send notification to receiver
    try {
      const senderRole = userResult.rows[0].role === 'admin' ? 'admin' : 'partner';
      await pool.query(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, 'new_message', 'Tin nhắn mới', $2)
      `, [receiver_id, `Bạn có tin nhắn mới từ ${senderRole}`]);
    } catch (e) {
      console.log('⚠️ Could not create notification:', e.message);
    }
    
    res.json({ success: true, message: result.rows[0] });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversations for partner/admin (list of artists they can chat with)
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (!['partner', 'admin'].includes(userResult.rows[0]?.role)) {
      return res.status(403).json({ error: 'Partner or admin access required' });
    }
    
    // Get unique conversation partners (artists)
    const result = await pool.query(`
      SELECT DISTINCT 
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.avatar_url,
        (SELECT COUNT(*) FROM messages m 
         WHERE (m.receiver_id = $1 AND m.sender_id = u.id AND m.read = FALSE)) as unread_count,
        (SELECT content FROM messages m 
         WHERE (m.sender_id = u.id OR m.receiver_id = u.id) 
         ORDER BY m.created_at DESC LIMIT 1) as last_message
      FROM users u
      LEFT JOIN messages m ON (m.sender_id = u.id OR m.receiver_id = u.id) 
        AND (m.sender_id = $1 OR m.receiver_id = $1)
      WHERE u.role = 'artist'
        AND u.id != $1
      ORDER BY unread_count DESC, last_message DESC NULLS LAST
    `, [req.user.id]);
    
    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Mark messages as read (partner/admin)
app.put('/api/messages/read', authenticateToken, async (req, res) => {
  try {
    const { conversation_with } = req.body;
    
    await pool.query(`
      UPDATE messages 
      SET read = TRUE 
      WHERE receiver_id = $1 AND sender_id = $2 AND read = FALSE
    `, [req.user.id, conversation_with]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get event registrations for partner/admin (xem artists đã đăng ký event của mình)
app.get('/api/admin/event-registrations', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (!['partner', 'admin'].includes(userResult.rows[0]?.role)) {
      return res.status(403).json({ error: 'Partner or admin access required' });
    }
    
    const { event_id } = req.query;
    
    let query = `
      SELECT er.*,
             u.id as artist_user_id,
             u.full_name as artist_name,
             u.email as artist_email,
             u.avatar_url as artist_avatar,
             e.title as event_title,
             e.event_date,
             e.organizer_id
      FROM event_registrations er
      JOIN events e ON CAST(e.id AS TEXT) = CAST(er.event_id AS TEXT)
      LEFT JOIN users u ON er.artist_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    // If partner, only show their events
    if (userResult.rows[0].role === 'partner') {
      query += ` AND e.organizer_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }
    
    // Filter by event_id if provided
    if (event_id) {
      query += ` AND CAST(e.id AS TEXT) = CAST($${paramCount} AS TEXT)`;
      params.push(event_id);
      paramCount++;
    }
    
    query += ` ORDER BY er.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.json({ registrations: result.rows });
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    res.status(500).json({ error: 'Failed to fetch event registrations', details: error.message });
  }
});

// Approve event registration
app.put('/api/admin/event-registrations/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (!['partner', 'admin'].includes(userResult.rows[0]?.role)) {
      return res.status(403).json({ error: 'Partner or admin access required' });
    }
    
    // Get registration info
    const regResult = await pool.query(`
      SELECT er.*, e.title as event_title, e.organizer_id
      FROM event_registrations er
      JOIN events e ON CAST(e.id AS TEXT) = CAST(er.event_id AS TEXT)
      WHERE er.id = $1
    `, [id]);
    
    if (regResult.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    const registration = regResult.rows[0];
    
    // Check if partner owns this event
    if (userResult.rows[0].role === 'partner' && registration.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only approve registrations for your own events' });
    }
    
    // Update status
    await pool.query(
      'UPDATE event_registrations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['approved', id]
    );
    
    // Send notification to artist
    try {
      await pool.query(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, 'event_registration_approved', 'Đăng ký được duyệt', $2)
      `, [registration.artist_id, `Đăng ký của bạn cho event "${registration.event_title}" đã được duyệt!`]);
    } catch (e) {
      console.log('⚠️ Could not create notification:', e.message);
    }
    
    res.json({ success: true, message: 'Registration approved successfully' });
  } catch (error) {
    console.error('Error approving registration:', error);
    res.status(500).json({ error: 'Failed to approve registration', details: error.message });
  }
});

// Reject event registration
app.put('/api/admin/event-registrations/:id/reject', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (!['partner', 'admin'].includes(userResult.rows[0]?.role)) {
      return res.status(403).json({ error: 'Partner or admin access required' });
    }
    
    // Get registration info
    const regResult = await pool.query(`
      SELECT er.*, e.title as event_title, e.organizer_id
      FROM event_registrations er
      JOIN events e ON CAST(e.id AS TEXT) = CAST(er.event_id AS TEXT)
      WHERE er.id = $1
    `, [id]);
    
    if (regResult.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    const registration = regResult.rows[0];
    
    // Check if partner owns this event
    if (userResult.rows[0].role === 'partner' && registration.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only reject registrations for your own events' });
    }
    
    // Update status
    await pool.query(
      'UPDATE event_registrations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['rejected', id]
    );
    
    // Send notification to artist
    try {
      await pool.query(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES ($1, 'event_registration_rejected', 'Đăng ký bị từ chối', $2)
      `, [registration.artist_id, `Đăng ký của bạn cho event "${registration.event_title}" đã bị từ chối.`]);
    } catch (e) {
      console.log('⚠️ Could not create notification:', e.message);
    }
    
    res.json({ success: true, message: 'Registration rejected successfully' });
  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.status(500).json({ error: 'Failed to reject registration', details: error.message });
  }
});


// Admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Notifications API
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
      [req.user.id]
    );
    res.json(r.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
