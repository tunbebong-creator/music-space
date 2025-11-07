-- Create page_views table to track website visits
CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  page_path VARCHAR(500) NOT NULL,
  page_title VARCHAR(500),
  user_id INTEGER REFERENCES users(id),
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer VARCHAR(500),
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);

-- Create view for daily stats
CREATE OR REPLACE VIEW page_views_daily_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_views,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT ip_address) as unique_visitors,
  COUNT(DISTINCT user_id) as unique_users
FROM page_views
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Create view for page stats
CREATE OR REPLACE VIEW page_views_page_stats AS
SELECT 
  page_path,
  COUNT(*) as total_views,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT ip_address) as unique_visitors,
  MAX(created_at) as last_visited
FROM page_views
GROUP BY page_path
ORDER BY total_views DESC;

