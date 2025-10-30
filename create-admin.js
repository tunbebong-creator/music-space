import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_Frv90HNpbhjo@ep-muddy-bonus-adx6h9r8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createAdminUser() {
  try {
    console.log('🔄 Creating admin user...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('🔐 Password hashed:', hashedPassword.substring(0, 20) + '...');
    
    // Create users table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        full_name VARCHAR(255),
        bio TEXT,
        avatar_url TEXT,
        role VARCHAR(50) DEFAULT 'user',
        space_owner_verified BOOLEAN DEFAULT FALSE,
        artist_verified BOOLEAN DEFAULT FALSE,
        provider VARCHAR(50) DEFAULT 'email',
        provider_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create spaces table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS spaces (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        address TEXT,
        city VARCHAR(100),
        capacity INTEGER,
        price_per_hour DECIMAL(10,2),
        amenities TEXT[],
        images TEXT[],
        owner_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create events table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_date TIMESTAMP NOT NULL,
        duration_hours INTEGER DEFAULT 2,
        max_participants INTEGER,
        price DECIMAL(10,2),
        space_id INTEGER REFERENCES spaces(id),
        organizer_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert admin user with hashed password
    await pool.query(`
      INSERT INTO users (email, password, full_name, role, provider) 
      VALUES ($1, $2, 'Admin User', 'admin', 'email')
      ON CONFLICT (email) DO UPDATE SET 
        password = EXCLUDED.password,
        role = EXCLUDED.role
    `, ['admin@musicspace.edu.vn', hashedPassword]);
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@musicspace.edu.vn');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();
