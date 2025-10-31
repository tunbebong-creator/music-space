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
  // Kiểm tra role từ token trước
  if (req.user && req.user.role) {
    const role = String(req.user.role).toLowerCase();
    if (['admin', 'partner'].includes(role)) {
      return next();
    }
  }
  
  // Nếu token không có role, load từ database
  if (req.user && req.user.id) {
    try {
      const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
      if (result.rows.length > 0) {
        const role = String(result.rows[0].role).toLowerCase();
        if (['admin', 'partner'].includes(role)) {
          // Cập nhật req.user.role để dùng cho các middleware sau
          req.user.role = result.rows[0].role;
          return next();
        }
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  }
  
  return res.status(403).json({ error: 'Admin or partner access required' });
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
      gallery_images || []
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
    console.log('✅ Debug - Event created successfully:', finalResult.rows[0]);
    res.status(201).json(finalResult.rows[0]);
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
    res.json(result.rows);
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
    res.json(result.rows[0]);
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

    // Update basic fields first
    const basicResult = await pool.query(
      `UPDATE events 
       SET title = $1, description = $2, event_date = $3, duration_hours = $4, 
           max_participants = $5, price = $6, space_id = $7, organizer_id = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [title, description, event_date, duration_hours, max_participants, price, space_id, organizer_id, id]
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
    console.log('✅ Debug - Event updated successfully:', finalResult.rows[0]);
    res.json(finalResult.rows[0]);
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

// Get all spaces (admin)
router.get('/spaces', authenticateToken, requireAdmin, async (req, res) => {
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

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY s.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
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
      owner_id
    } = req.body;

    const result = await pool.query(
      `INSERT INTO spaces (name, description, address, city, capacity, price_per_hour, amenities, images, owner_id, status, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved', true)
       RETURNING *`,
      [name, description, address, city, capacity, price_per_hour, amenities, images, owner_id]
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
      verified
    } = req.body;

    // Get current space to preserve status if not provided
    const currentSpace = await pool.query('SELECT status, verified FROM spaces WHERE id = $1', [id]);
    if (currentSpace.rows.length === 0) {
      return res.status(404).json({ error: 'Space not found' });
    }

    // Preserve status and verified if not provided in request
    const finalStatus = status !== undefined && status !== null ? status : currentSpace.rows[0].status;
    const finalVerified = verified !== undefined && verified !== null ? verified : currentSpace.rows[0].verified;

    const result = await pool.query(
      `UPDATE spaces 
       SET name = $1, description = $2, address = $3, city = $4, capacity = $5,
           price_per_hour = $6, amenities = $7, images = $8, owner_id = $9,
           status = $10, verified = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [name, description, address, city, capacity, price_per_hour, amenities, images, owner_id, finalStatus, finalVerified, id]
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
