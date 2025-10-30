import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_Frv90HNpbhjo@ep-muddy-bonus-adx6h9r8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateSchema() {
  try {
    console.log('🔄 Updating database schema...');

    // Thêm cột images vào bảng events nếu chưa có
    await pool.query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS images TEXT[]
    `);

    // Thêm cột city vào bảng spaces nếu chưa có
    await pool.query(`
      ALTER TABLE spaces 
      ADD COLUMN IF NOT EXISTS city VARCHAR(100)
    `);

    // Thêm cột amenities vào bảng spaces nếu chưa có
    await pool.query(`
      ALTER TABLE spaces 
      ADD COLUMN IF NOT EXISTS amenities TEXT[]
    `);

    // Thêm cột owner_id vào bảng spaces nếu chưa có
    await pool.query(`
      ALTER TABLE spaces 
      ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id)
    `);

    // Thêm cột status vào bảng spaces nếu chưa có
    await pool.query(`
      ALTER TABLE spaces 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'
    `);

    // Thêm cột verified vào bảng spaces nếu chưa có
    await pool.query(`
      ALTER TABLE spaces 
      ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE
    `);

    // Thêm cột updated_at vào bảng spaces nếu chưa có
    await pool.query(`
      ALTER TABLE spaces 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    // Thêm cột updated_at vào bảng events nếu chưa có
    await pool.query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    // Tạo bảng blog_posts nếu chưa có
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(100),
        published BOOLEAN DEFAULT FALSE,
        author_id INTEGER REFERENCES users(id),
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo indexes cho blog_posts nếu chưa có
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id)
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category)
      `);
    } catch (indexError) {
      console.log('⚠️ Some indexes may already exist, continuing...');
    }

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_spaces_owner ON spaces(owner_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_spaces_city ON spaces(city)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id)
    `);

    console.log('✅ Database schema updated successfully!');
    
    // Kiểm tra kết quả
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'events' AND column_name = 'images'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Events table has images column');
    }

    const spacesResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'spaces' AND column_name IN ('city', 'amenities', 'owner_id', 'status')
    `);
    
    console.log('✅ Spaces table columns:', spacesResult.rows.map(r => r.column_name));

  } catch (error) {
    console.error('❌ Error updating schema:', error);
  } finally {
    await pool.end();
  }
}

updateSchema();
