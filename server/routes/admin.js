import express from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Neon Database connection
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_Frv90HNpbhjo@ep-muddy-bonus-adx6h9r8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Admin middleware - check if user is admin
const requireAdmin = (req, res, next) => {
  // Accept variant casing, null, undefined
  if (req.user && String(req.user.role).toLowerCase() === 'admin') {
    return next();
  }
  console.warn('ACCESS DENIED (requireAdmin): req.user =', req.user);
  return res.status(403).json({ error: 'Admin access required' });
};

// Middleware cho phép cả admin và partner
const requireAdminOrPartner = async (req, res, next) => {
  console.log('🔍 requireAdminOrPartner - req.user:', req.user);
  
  if (!req.user || !req.user.id) {
    console.warn('⚠️ No req.user or req.user.id');
    return res.status(403).json({ error: 'Authentication required' });
  }
  
  // Luôn kiểm tra role từ database để đảm bảo chính xác (role có thể thay đổi)
  try {
    console.log('🔍 Loading role from database for user ID:', req.user.id);
    const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length > 0) {
      const role = String(result.rows[0].role).toLowerCase();
      console.log('🔍 Role from database:', role);
      if (['admin', 'partner'].includes(role)) {
        // Cập nhật req.user.role để dùng cho các middleware sau
        req.user.role = result.rows[0].role;
        console.log('✅ Access granted - role:', role);
        return next();
      } else {
        console.warn('⚠️ User role is not admin or partner:', role);
      }
    } else {
      console.warn('⚠️ User not found in database:', req.user.id);
    }
  } catch (error) {
    console.error('❌ Error loading user role:', error);
    return res.status(500).json({ error: 'Failed to verify user role' });
  }
  
  console.error('❌ Access denied - Admin or partner access required');
  return res.status(403).json({ error: 'Admin or partner access required' });
};

// Helper function to parse images field from database
const parseEventImages = (e) => {
  let gallery_images = [];
  
  // Try to get gallery_images from various sources
  if (e.gallery_images) {
    if (Array.isArray(e.gallery_images)) {
      gallery_images = e.gallery_images;
    } else if (typeof e.gallery_images === 'string') {
      try {
        gallery_images = JSON.parse(e.gallery_images);
        if (!Array.isArray(gallery_images)) gallery_images = [];
      } catch {
        gallery_images = [];
      }
    }
  }
  
  // If gallery_images is empty, try to parse from images field
  if (gallery_images.length === 0 && e.images) {
    if (Array.isArray(e.images)) {
      gallery_images = e.images;
    } else if (typeof e.images === 'string') {
      try {
        gallery_images = JSON.parse(e.images);
        if (!Array.isArray(gallery_images)) gallery_images = [];
      } catch {
        gallery_images = [];
      }
    }
  }
  
  return gallery_images;
};

// Create new event (admin)
router.post('/events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Debug - Creating event with data:', req.body);
    
    const {
      title, description, category, tags, event_date, start_time, end_time,
      duration_hours, max_participants, min_participants, price, currency,
      early_bird_price, early_bird_until, venue_name, venue_address, venue_city,
      latitude, longitude, google_maps_url, event_type, age_restriction, language, difficulty_level,
      organizer_name, organizer_email, organizer_phone, organizer_bio,
      requirements, what_to_bring, video_url, audio_preview, cover_image,
      gallery_images, space_id, organizer_id, drink_option, drink_price
    } = req.body;

    // Simple INSERT with only basic columns that exist in original schema
    const query = `
      INSERT INTO events (
        title, description, event_date, duration_hours, max_participants, 
        price, space_id, organizer_id, status, approved, images
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING *
    `;

    // Ensure gallery_images is properly formatted
    let imagesValue = [];
    if (gallery_images) {
      imagesValue = Array.isArray(gallery_images) ? gallery_images : (typeof gallery_images === 'string' ? JSON.parse(gallery_images) : []);
    }
    
    const values = [
      title || 'Untitled Event',
      description || '',
      event_date || new Date().toISOString(),
      duration_hours || 2,
      max_participants || 50,
      price || 0,
      space_id || null,
      organizer_id || 1,
      'pending',
      false,
      JSON.stringify(imagesValue) // Store as JSON string
    ];

    console.log('🔍 Debug - Executing query with values:', values);
    const result = await pool.query(query, values);
    const eventId = result.rows[0].id;
    
    // Update with additional fields if they exist
    const updateQuery = `
      UPDATE events SET 
        category = $1,
        tags = $2,
        start_time = $3,
        end_time = $4,
        min_participants = $5,
        currency = $6,
        early_bird_price = $7,
        early_bird_until = $8,
        venue_name = $9,
        venue_address = $10,
        venue_city = $11,
        latitude = $12,
        longitude = $13,
        google_maps_url = $14,
        event_type = $15,
        age_restriction = $16,
        language = $17,
        difficulty_level = $18,
        organizer_name = $19,
        organizer_email = $20,
        organizer_phone = $21,
        organizer_bio = $22,
        requirements = $23,
        what_to_bring = $24,
        video_url = $25,
        audio_preview = $26,
        cover_image = $27,
        gallery_images = $28
      WHERE id = $29
    `;
    
    const updateValues = [
      category || 'workshop',
      tags || [],
      start_time || null,
      end_time || null,
      min_participants || 1,
      currency || 'VND',
      early_bird_price || null,
      early_bird_until || null,
      venue_name || null,
      venue_address || null,
      venue_city || null,
      latitude || null,
      longitude || null,
      google_maps_url || null,
      event_type || 'public',
      age_restriction || 'all',
      language || 'vi',
      difficulty_level || 'beginner',
      organizer_name || null,
      organizer_email || null,
      organizer_phone || null,
      organizer_bio || null,
      requirements || null,
      what_to_bring || null,
      video_url || null,
      audio_preview || null,
      cover_image || null,
      gallery_images || [],
      eventId
    ];
    
    try {
      await pool.query(updateQuery, updateValues);
      console.log('✅ Debug - Event updated with additional fields');
    } catch (updateError) {
      console.log('⚠️ Debug - Some additional fields could not be updated:', updateError.message);
    }
    
    // Get final event data
    const finalResult = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    const e = finalResult.rows[0];
    const parsedGalleryImages = parseEventImages(e);
    let parsedCoverImage = e.cover_image;
    if (!parsedCoverImage && parsedGalleryImages.length > 0) {
      parsedCoverImage = parsedGalleryImages[0];
    }
    
    const formattedEvent = {
      ...e,
      cover_image: parsedCoverImage || null,
      gallery_images: parsedGalleryImages
    };
    
    console.log('✅ Debug - Event created successfully:', formattedEvent);
    res.status(201).json(formattedEvent);
  } catch (error) {
    console.error('❌ Error creating event:', error);
    console.error('❌ Error details:', error.message);
    res.status(500).json({ error: 'Failed to create event: ' + error.message });
  }
});

// Get all events (admin & partner)
router.get('/events', authenticateToken, requireAdminOrPartner, async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = `
      SELECT e.*, s.name as space_name, u.full_name as organizer_name
      FROM events e
      LEFT JOIN spaces s ON e.space_id = s.id
      LEFT JOIN users u ON e.organizer_id = u.id
    `;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(e.title ILIKE $${paramCount} OR e.description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }
    if (status) {
      conditions.push(`e.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }
    // Nếu là partner thì chỉ xem event mình tạo
    if (req.user && String(req.user.role).toLowerCase() === 'partner') {
      conditions.push(`e.organizer_id = $${paramCount}`);
      params.push(req.user.id);
      paramCount++;
    }
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    query += ` ORDER BY e.created_at DESC`;
    const result = await pool.query(query, params);
    
    // Parse images for each event
    const mapped = result.rows.map((e) => {
      const gallery_images = parseEventImages(e);
      let cover_image = e.cover_image;
      if (!cover_image && gallery_images.length > 0) {
        cover_image = gallery_images[0];
      }
      return {
        ...e,
        cover_image: cover_image || null,
        gallery_images: gallery_images
      };
    });
    
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get single event (admin)
router.get('/events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const e = result.rows[0];
    const gallery_images = parseEventImages(e);
    let cover_image = e.cover_image;
    if (!cover_image && gallery_images.length > 0) {
      cover_image = gallery_images[0];
    }
    
    res.json({
      ...e,
      cover_image: cover_image || null,
      gallery_images: gallery_images
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Update event (admin)
router.put('/events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Debug - Updating event ID:', id, 'with data:', req.body);
    
    const {
      title, description, category, tags, event_date, start_time, end_time,
      duration_hours, max_participants, min_participants, price, currency,
      early_bird_price, early_bird_until, venue_name, venue_address, venue_city,
      latitude, longitude, google_maps_url, event_type, age_restriction, language, difficulty_level,
      organizer_name, organizer_email, organizer_phone, organizer_bio,
      requirements, what_to_bring, video_url, audio_preview, cover_image,
      gallery_images, space_id, organizer_id, drink_option, drink_price
    } = req.body;

    // Ensure gallery_images is properly formatted for images field
    let imagesValue = [];
    if (gallery_images) {
      imagesValue = Array.isArray(gallery_images) ? gallery_images : (typeof gallery_images === 'string' ? JSON.parse(gallery_images) : []);
    }
    
    // Update basic fields first, including images
    const basicResult = await pool.query(
      `UPDATE events 
       SET title = $1, description = $2, event_date = $3, duration_hours = $4, 
           max_participants = $5, price = $6, space_id = $7, organizer_id = $8,
           images = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [title, description, event_date, duration_hours, max_participants, price, space_id, organizer_id, JSON.stringify(imagesValue), id]
    );

    if (basicResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Update additional fields if they exist
    const updateQuery = `
      UPDATE events SET 
        category = $1,
        tags = $2,
        start_time = $3,
        end_time = $4,
        min_participants = $5,
        currency = $6,
        early_bird_price = $7,
        early_bird_until = $8,
        venue_name = $9,
        venue_address = $10,
        venue_city = $11,
        latitude = $12,
        longitude = $13,
        google_maps_url = $14,
        event_type = $15,
        age_restriction = $16,
        language = $17,
        difficulty_level = $18,
        organizer_name = $19,
        organizer_email = $20,
        organizer_phone = $21,
        organizer_bio = $22,
        requirements = $23,
        what_to_bring = $24,
        video_url = $25,
        audio_preview = $26,
        cover_image = $27,
        gallery_images = $28
      WHERE id = $29
    `;
    
    const updateValues = [
      category || null,
      tags || null,
      start_time || null,
      end_time || null,
      min_participants || null,
      currency || null,
      early_bird_price || null,
      early_bird_until || null,
      venue_name || null,
      venue_address || null,
      venue_city || null,
      latitude || null,
      longitude || null,
      google_maps_url || null,
      event_type || null,
      age_restriction || null,
      language || null,
      difficulty_level || null,
      organizer_name || null,
      organizer_email || null,
      organizer_phone || null,
      organizer_bio || null,
      requirements || null,
      what_to_bring || null,
      video_url || null,
      audio_preview || null,
      cover_image || null,
      gallery_images || null,
      id
    ];
    
    try {
      await pool.query(updateQuery, updateValues);
      console.log('✅ Debug - Event updated with additional fields');
    } catch (updateError) {
      console.log('⚠️ Debug - Some additional fields could not be updated:', updateError.message);
    }
    
    // Get final event data
    const finalResult = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    const e = finalResult.rows[0];
    const parsedGalleryImages = parseEventImages(e);
    let parsedCoverImage = e.cover_image;
    if (!parsedCoverImage && parsedGalleryImages.length > 0) {
      parsedCoverImage = parsedGalleryImages[0];
    }
    
    const formattedEvent = {
      ...e,
      cover_image: parsedCoverImage || null,
      gallery_images: parsedGalleryImages
    };
    
    console.log('✅ Debug - Event updated successfully:', formattedEvent);
    res.json(formattedEvent);
  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event: ' + error.message });
  }
});

// Delete event (admin)
router.delete('/events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Approve event (admin)
router.put('/events/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Debug - Approving event ID:', id);
    
    const result = await pool.query(
      'UPDATE events SET status = $1, approved = $2 WHERE id = $3 RETURNING *',
      ['approved', true, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    console.log('✅ Debug - Event approved successfully:', result.rows[0]);
    res.json({ message: 'Event approved successfully', event: result.rows[0] });
  } catch (error) {
    console.error('❌ Error approving event:', error);
    res.status(500).json({ error: 'Failed to approve event: ' + error.message });
  }
});

// Reject event (admin)
router.put('/events/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Debug - Rejecting event ID:', id);
    
    const result = await pool.query(
      'UPDATE events SET status = $1, approved = $2 WHERE id = $3 RETURNING *',
      ['rejected', false, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    console.log('✅ Debug - Event rejected successfully:', result.rows[0]);
    res.json({ message: 'Event rejected successfully', event: result.rows[0] });
  } catch (error) {
    console.error('❌ Error rejecting event:', error);
    res.status(500).json({ error: 'Failed to reject event: ' + error.message });
  }
});

// Get all spaces (admin & partner)
router.get('/spaces', authenticateToken, requireAdminOrPartner, async (req, res) => {
  console.log('🔍 GET /api/admin/spaces - Route handler called');
  console.log('🔍 req.user:', req.user);
  console.log('🔍 req.user.id:', req.user?.id);
  console.log('🔍 req.user.role:', req.user?.role);
  try {
    const { search, status } = req.query;
    let query = `
      SELECT s.*, u.full_name as owner_name, u.email as owner_email
      FROM spaces s
      LEFT JOIN users u ON s.owner_id = u.id
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(s.name ILIKE $${paramCount} OR s.description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (status) {
      conditions.push(`s.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    // Nếu là partner thì chỉ xem space mình tạo
    if (req.user && String(req.user.role).toLowerCase() === 'partner') {
      conditions.push(`s.owner_id = $${paramCount}`);
      params.push(req.user.id);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY s.created_at DESC`;

    const result = await pool.query(query, params);
    
    // Return format compatible with Admin page (expects { spaces: [...] })
    // But also support direct array for partner pages
    const responseFormat = req.query.format === 'array' 
      ? result.rows 
      : { spaces: result.rows };
    
    res.json(responseFormat);
  } catch (error) {
    console.error('Error fetching spaces:', error);
    res.status(500).json({ error: 'Failed to fetch spaces' });
  }
});

// Get single space (admin)
router.get('/spaces/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM spaces WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching space:', error);
    res.status(500).json({ error: 'Failed to fetch space' });
  }
});

// Create space (admin)
router.post('/spaces', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      city,
      capacity,
      price_per_hour,
      amenities,
      images,
      owner_id,
      google_maps_url
    } = req.body;

    const result = await pool.query(
      `INSERT INTO spaces (name, description, address, city, capacity, price_per_hour, amenities, images, owner_id, status, verified, google_maps_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved', true, $10)
       RETURNING *`,
      [name, description, address, city, capacity, price_per_hour, amenities, images, owner_id, google_maps_url || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating space:', error);
    res.status(500).json({ error: 'Failed to create space' });
  }
});

// Update space (admin)
router.put('/spaces/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Debug - Updating space ID:', id);
    console.log('🔍 Debug - Request body:', req.body);
    
    const {
      name,
      description,
      address,
      city,
      capacity,
      price_per_hour,
      amenities,
      images,
      owner_id,
      status,
      verified,
      google_maps_url
    } = req.body;

    // Get current space to preserve status if not provided
    const currentSpace = await pool.query('SELECT status, verified FROM spaces WHERE id = $1', [id]);
    if (currentSpace.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found' });
    }

    // Preserve status and verified if not provided in request
    const finalStatus = status !== undefined && status !== null ? status : currentSpace.rows[0].status;
    const finalVerified = verified !== undefined && verified !== null ? verified : currentSpace.rows[0].verified;

    // Process amenities - ensure it's an array
    let amenitiesArray = [];
    if (amenities) {
      if (Array.isArray(amenities)) {
        amenitiesArray = amenities;
      } else if (typeof amenities === 'string') {
        amenitiesArray = amenities.split(',').map(a => a.trim()).filter(a => a);
      }
    }

    // Process images - ensure it's an array
    let imagesArray = [];
    if (images) {
      if (Array.isArray(images)) {
        imagesArray = images;
      } else if (typeof images === 'string') {
        try {
          imagesArray = JSON.parse(images);
        } catch {
          imagesArray = [images];
        }
      }
    }

    console.log('🔍 Debug - Processed data:', {
      amenitiesArray,
      imagesArray,
      google_maps_url
    });

    const result = await pool.query(
      `UPDATE spaces 
       SET name = $1, description = $2, address = $3, city = $4, capacity = $5,
           price_per_hour = $6, amenities = $7, images = $8, owner_id = $9,
           status = $10, verified = $11, google_maps_url = $12, updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [name, description, address, city, capacity, price_per_hour, amenitiesArray, imagesArray, owner_id, finalStatus, finalVerified, google_maps_url || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating space:', error);
    res.status(500).json({ error: 'Failed to update space' });
  }
});

// Get page views statistics (admin)
router.get('/analytics/page-views', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30, page_path } = req.query;
    
    const daysInt = parseInt(days) || 30;
    
    // Get daily stats
    let dailyStatsQuery, dailyStatsParams;
    if (page_path) {
      dailyStatsQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_views,
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(DISTINCT ip_address) as unique_visitors,
          COUNT(DISTINCT user_id) as unique_users
        FROM page_views
        WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * $1
        AND page_path = $2
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      dailyStatsParams = [daysInt, page_path];
    } else {
      dailyStatsQuery = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_views,
          COUNT(DISTINCT session_id) as unique_sessions,
          COUNT(DISTINCT ip_address) as unique_visitors,
          COUNT(DISTINCT user_id) as unique_users
        FROM page_views
        WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * $1
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;
      dailyStatsParams = [daysInt];
    }
    
    const dailyStats = await pool.query(dailyStatsQuery, dailyStatsParams);
    
    // Get page stats
    const pageStatsQuery = `
      SELECT 
        page_path,
        COUNT(*) as total_views,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT ip_address) as unique_visitors,
        MAX(created_at) as last_visited
      FROM page_views
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * $1
      GROUP BY page_path
      ORDER BY total_views DESC
      LIMIT 50
    `;
    
    const pageStats = await pool.query(pageStatsQuery, [daysInt]);
    
    // Get overall stats
    const overallStatsQuery = `
      SELECT 
        COUNT(*) as total_views,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT ip_address) as total_visitors,
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM page_views
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * $1
    `;
    
    const overallStats = await pool.query(overallStatsQuery, [daysInt]);
    
    // Get today's stats
    const todayStatsQuery = `
      SELECT 
        COUNT(*) as views_today,
        COUNT(DISTINCT session_id) as sessions_today,
        COUNT(DISTINCT ip_address) as visitors_today
      FROM page_views
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    
    const todayStats = await pool.query(todayStatsQuery);
    
    res.json({
      daily: dailyStats.rows,
      pages: pageStats.rows,
      overall: overallStats.rows[0],
      today: todayStats.rows[0]
    });
  } catch (error) {
    console.error('Error fetching page views stats:', error);
    res.status(500).json({ error: 'Failed to fetch page views statistics' });
  }
});

// Delete space (admin)
router.delete('/spaces/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM spaces WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found' });
    }

    res.json({ message: 'Space deleted successfully' });
  } catch (error) {
    console.error('Error deleting space:', error);
    res.status(500).json({ error: 'Failed to delete space' });
  }
});

export default router;
