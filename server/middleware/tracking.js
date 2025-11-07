// Middleware to track page views
export const trackPageView = async (req, res, next) => {
  // Skip tracking for API routes, static files, and admin routes
  if (
    req.path.startsWith('/api/') ||
    req.path.startsWith('/uploads/') ||
    req.path.startsWith('/_') ||
    req.path === '/favicon.ico'
  ) {
    return next();
  }

  try {
    const pool = req.app.locals.pool || global.pool;
    if (!pool) {
      return next();
    }

    const pagePath = req.path;
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || req.headers['referrer'] || '';
    const userId = req.user?.id || null;
    
    // Generate or get session ID from header or create new one
    let sessionId = req.headers['x-session-id'] || 
                    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Insert page view asynchronously (don't block the request)
    pool.query(
      `INSERT INTO page_views (page_path, user_id, ip_address, user_agent, referrer, session_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [pagePath, userId, ipAddress, userAgent, referrer, sessionId]
    ).catch(err => {
      console.error('Error tracking page view:', err);
    });

  } catch (error) {
    console.error('Error in trackPageView middleware:', error);
  }

  next();
};

// API endpoint to track page views from frontend
export const trackPageViewAPI = async (req, res) => {
  try {
    const pool = req.app.locals.pool || global.pool;
    if (!pool) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const { page_path, page_title } = req.body;
    if (!page_path) {
      return res.status(400).json({ error: 'page_path is required' });
    }

    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || req.headers['referrer'] || '';
    const userId = req.user?.id || null;
    
    // Generate or get session ID from header or create new one
    let sessionId = req.headers['x-session-id'] || 
                    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await pool.query(
      `INSERT INTO page_views (page_path, page_title, user_id, ip_address, user_agent, referrer, session_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
      [page_path, page_title || null, userId, ipAddress, userAgent, referrer, sessionId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking page view:', error);
    res.status(500).json({ error: 'Failed to track page view' });
  }
};

