// Script to generate fake page view data for the last 30 days
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const hardcodedConnectionString = 'postgresql://neondb_owner:npg_Frv90HNpbhjo@ep-muddy-bonus-adx6h9r8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || hardcodedConnectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Common page paths
const pagePaths = [
  '/',
  '/events',
  '/spaces',
  '/we',
  '/love',
  '/about',
  '/contact',
  '/admin',
  '/login',
  '/register'
];

// Common user agents
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Android 13; Mobile; rv:121.0) Gecko/121.0 Firefox/121.0'
];

// Generate random IP address
function generateRandomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

// Generate random session ID
function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate random date within a day
function randomTimeInDay(date) {
  const start = new Date(date);
  start.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  return start;
}

async function buffPageViews() {
  try {
    console.log('🔄 Starting to buff page views...');

    // Delete old data from last 30 days to avoid duplicates
    console.log('🗑️  Deleting old page views data from last 30 days...');
    const deleteResult = await pool.query(`
      DELETE FROM page_views
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);
    console.log(`✅ Deleted ${deleteResult.rowCount} old records`);

    // Get events to know which days have events
    const eventsResult = await pool.query(`
      SELECT DISTINCT DATE(event_date) as event_date
      FROM events
      WHERE event_date IS NOT NULL
        AND event_date >= CURRENT_DATE - INTERVAL '30 days'
        AND event_date <= CURRENT_DATE
      ORDER BY event_date
    `);

    const eventDates = new Set(
      eventsResult.rows.map(row => {
        const date = new Date(row.event_date);
        return date.toISOString().split('T')[0];
      })
    );

    console.log(`📅 Found ${eventDates.size} days with events:`);
    Array.from(eventDates).forEach(date => console.log(`  - ${date}`));

    // Generate data for last 30 days
    const today = new Date();
    const insertPromises = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Determine view count: 100-120 for event days, 28-80 for non-event days
      const hasEvent = eventDates.has(dateStr);
      const minViews = hasEvent ? 100 : 28;
      const maxViews = hasEvent ? 120 : 80;
      const viewCount = Math.floor(Math.random() * (maxViews - minViews + 1)) + minViews;

      // Generate sessions (about 1 session per 5-8 views)
      const sessionCount = Math.floor(viewCount / (5 + Math.random() * 3));
      const sessions = [];
      for (let s = 0; s < sessionCount; s++) {
        sessions.push({
          sessionId: generateSessionId(),
          ip: generateRandomIP(),
          userAgent: userAgents[Math.floor(Math.random() * userAgents.length)]
        });
      }

      // Generate page views for this day
      const viewsForDay = [];
      for (let v = 0; v < viewCount; v++) {
        const session = sessions[Math.floor(Math.random() * sessions.length)];
        const pagePath = pagePaths[Math.floor(Math.random() * pagePaths.length)];
        const timestamp = randomTimeInDay(date);

        viewsForDay.push({
          page_path: pagePath,
          page_title: pagePath === '/' ? 'Home' : pagePath.charAt(1).toUpperCase() + pagePath.slice(2),
          user_id: null, // Most views are anonymous
          ip_address: session.ip,
          user_agent: session.userAgent,
          referrer: Math.random() > 0.7 ? 'https://www.google.com' : '',
          session_id: session.sessionId,
          created_at: timestamp
        });
      }

      // Insert all views for this day
      const insertQuery = `
        INSERT INTO page_views (page_path, page_title, user_id, ip_address, user_agent, referrer, session_id, created_at)
        VALUES ${viewsForDay.map((_, idx) => 
          `($${idx * 8 + 1}, $${idx * 8 + 2}, $${idx * 8 + 3}, $${idx * 8 + 4}, $${idx * 8 + 5}, $${idx * 8 + 6}, $${idx * 8 + 7}, $${idx * 8 + 8})`
        ).join(', ')}
      `;

      const insertParams = viewsForDay.flatMap(view => [
        view.page_path,
        view.page_title,
        view.user_id,
        view.ip_address,
        view.user_agent,
        view.referrer,
        view.session_id,
        view.created_at
      ]);

      insertPromises.push(
        pool.query(insertQuery, insertParams)
          .then(() => {
            console.log(`✅ ${dateStr}: Inserted ${viewCount} views (${hasEvent ? 'EVENT DAY' : 'normal'})`);
          })
          .catch(err => {
            console.error(`❌ Error inserting ${dateStr}:`, err.message);
          })
      );
    }

    // Wait for all inserts to complete
    await Promise.all(insertPromises);

    // Verify the data
    const verifyResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_views,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT ip_address) as unique_visitors
      FROM page_views
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    console.log('\n📊 Summary of inserted data:');
    console.log('Date       | Views | Sessions | Visitors');
    console.log('-------------------------------------------');
    verifyResult.rows.forEach(row => {
      console.log(`${row.date.toISOString().split('T')[0]} | ${row.total_views.toString().padStart(5)} | ${row.unique_sessions.toString().padStart(8)} | ${row.unique_visitors.toString().padStart(8)}`);
    });

    const totalResult = await pool.query(`
      SELECT 
        COUNT(*) as total_views,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(DISTINCT ip_address) as total_visitors
      FROM page_views
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);

    console.log('\n📈 Total (30 days):');
    console.log(`  Total Views: ${totalResult.rows[0].total_views}`);
    console.log(`  Total Sessions: ${totalResult.rows[0].total_sessions}`);
    console.log(`  Total Visitors: ${totalResult.rows[0].total_visitors}`);

    console.log('\n✅ Page views buffed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error buffing page views:', error);
    process.exit(1);
  }
}

buffPageViews();

