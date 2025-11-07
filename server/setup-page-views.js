// Script to create page_views table for tracking website visits
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_Frv90HNpbhjo@ep-muddy-bonus-adx6h9r8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupPageViews() {
  try {
    console.log('🔄 Creating page_views table...');
    
    const sqlFile = path.join(__dirname, 'create-page-views-table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ page_views table created successfully!');
    console.log('✅ Views created successfully!');
    
    // Test insert
    const testResult = await pool.query('SELECT COUNT(*) FROM page_views');
    console.log('✅ Current page_views count:', testResult.rows[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up page_views:', error);
    process.exit(1);
  }
}

setupPageViews();

