// Script to generate fake user data for the last 30 days
import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const hardcodedConnectionString = 'postgresql://neondb_owner:npg_Frv90HNpbhjo@ep-muddy-bonus-adx6h9r8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || hardcodedConnectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Vietnamese first names
const firstNames = [
  'An', 'Bình', 'Chi', 'Dũng', 'Hoa', 'Hùng', 'Lan', 'Minh', 'Nam', 'Nga',
  'Phong', 'Quang', 'Thảo', 'Tuấn', 'Vy', 'Yến', 'Đức', 'Hương', 'Khang', 'Linh',
  'Mai', 'Ngọc', 'Phương', 'Sơn', 'Trang', 'Vinh', 'Anh', 'Bảo', 'Cường', 'Dương',
  'Giang', 'Hạnh', 'Kiên', 'Long', 'My', 'Như', 'Oanh', 'Phúc', 'Quỳnh', 'Sang'
];

// Vietnamese last names
const lastNames = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đào', 'Tạ', 'Chu'
];

// Email domains
const emailDomains = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'email.com',
  'icloud.com', 'protonmail.com', 'zoho.com'
];

// Providers
const providers = ['email', 'google', 'facebook'];

// Roles (mostly 'user', some 'space_owner' and 'artist')
const roles = ['user', 'user', 'user', 'user', 'user', 'space_owner', 'artist'];

// Bio templates
const bioTemplates = [
  'Yêu thích âm nhạc và không gian nghệ thuật',
  'Nghệ sĩ độc lập, đam mê biểu diễn',
  'Chủ không gian sáng tạo, muốn chia sẻ với cộng đồng',
  'Người yêu nhạc, thường xuyên tham gia các sự kiện',
  'Sinh viên nghệ thuật, đang tìm kiếm cơ hội biểu diễn',
  null, null, null // 50% chance of no bio
];

// Avatar URLs (using placeholder services)
const avatarUrls = [
  'https://i.pravatar.cc/150?img=1',
  'https://i.pravatar.cc/150?img=2',
  'https://i.pravatar.cc/150?img=3',
  'https://i.pravatar.cc/150?img=4',
  'https://i.pravatar.cc/150?img=5',
  null, null, null // 50% chance of no avatar
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateVietnameseName() {
  const lastName = getRandomElement(lastNames);
  const firstName = getRandomElement(firstNames);
  return `${lastName} ${firstName}`;
}

function generateEmail(fullName, index) {
  const nameParts = fullName.toLowerCase().replace(/đ/g, 'd').split(' ');
  const baseEmail = nameParts.join('.') + index;
  const domain = getRandomElement(emailDomains);
  return `${baseEmail}@${domain}`;
}

function generateRandomDate(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  const date = new Date(randomTime);
  // Random time within the day
  date.setHours(getRandomInt(0, 23), getRandomInt(0, 59), getRandomInt(0, 59));
  return date;
}

async function buffUsers() {
  try {
    console.log('🔄 Starting to buff users...');

    // Check existing users to avoid email conflicts
    const existingUsersResult = await pool.query('SELECT email FROM users');
    const existingEmails = new Set(existingUsersResult.rows.map(row => row.email.toLowerCase()));
    console.log(`📋 Found ${existingEmails.size} existing users`);

    // Calculate date range (30 days ago to now)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Generate users: 2-5 users per day on average, total ~60-100 users
    const totalUsers = getRandomInt(60, 100);
    const usersPerDay = Math.ceil(totalUsers / 30);
    
    console.log(`📊 Will generate approximately ${totalUsers} users over 30 days`);
    console.log(`   Average: ${usersPerDay} users per day`);

    const usersToInsert = [];
    let emailIndex = 1;

    // Generate users distributed across 30 days
    for (let day = 0; day < 30; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);
      
      // Random number of users for this day (0-8, but weighted towards 2-4)
      const usersToday = Math.min(
        getRandomInt(0, 8),
        Math.max(1, Math.floor(Math.random() * 5) + Math.floor(Math.random() * 3))
      );

      for (let i = 0; i < usersToday; i++) {
        const fullName = generateVietnameseName();
        let email = generateEmail(fullName, emailIndex++);
        
        // Ensure unique email
        let attempts = 0;
        while (existingEmails.has(email.toLowerCase()) && attempts < 100) {
          email = generateEmail(fullName, emailIndex++);
          attempts++;
        }
        existingEmails.add(email.toLowerCase());

        const provider = getRandomElement(providers);
        const role = getRandomElement(roles);
        const bio = getRandomElement(bioTemplates);
        const avatarUrl = getRandomElement(avatarUrls);
        const createdAt = generateRandomDate(date, new Date(date.getTime() + 24 * 60 * 60 * 1000));

        // Hash password for email provider (50% chance)
        let password = null;
        if (provider === 'email' && Math.random() > 0.5) {
          password = await bcrypt.hash('password123', 10);
        }

        usersToInsert.push({
          email,
          password,
          full_name: fullName,
          bio,
          avatar_url: avatarUrl,
          role,
          space_owner_verified: role === 'space_owner' && Math.random() > 0.7,
          artist_verified: role === 'artist' && Math.random() > 0.6,
          provider,
          provider_id: provider !== 'email' ? `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
          created_at: createdAt,
          updated_at: createdAt
        });
      }
    }

    console.log(`\n📝 Generated ${usersToInsert.length} users to insert`);

    // Insert users in batches
    const batchSize = 20;
    let inserted = 0;

    for (let i = 0; i < usersToInsert.length; i += batchSize) {
      const batch = usersToInsert.slice(i, i + batchSize);
      
      const insertQuery = `
        INSERT INTO users (email, password, full_name, bio, avatar_url, role, space_owner_verified, artist_verified, provider, provider_id, created_at, updated_at)
        VALUES ${batch.map((_, idx) => 
          `($${idx * 12 + 1}, $${idx * 12 + 2}, $${idx * 12 + 3}, $${idx * 12 + 4}, $${idx * 12 + 5}, $${idx * 12 + 6}, $${idx * 12 + 7}, $${idx * 12 + 8}, $${idx * 12 + 9}, $${idx * 12 + 10}, $${idx * 12 + 11}, $${idx * 12 + 12})`
        ).join(', ')}
      `;

      const insertParams = batch.flatMap(user => [
        user.email,
        user.password,
        user.full_name,
        user.bio,
        user.avatar_url,
        user.role,
        user.space_owner_verified,
        user.artist_verified,
        user.provider,
        user.provider_id,
        user.created_at,
        user.updated_at
      ]);

      try {
        await pool.query(insertQuery, insertParams);
        inserted += batch.length;
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} users (Total: ${inserted}/${usersToInsert.length})`);
      } catch (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        // Try inserting one by one to identify problematic records
        for (const user of batch) {
          try {
            await pool.query(
              `INSERT INTO users (email, password, full_name, bio, avatar_url, role, space_owner_verified, artist_verified, provider, provider_id, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [user.email, user.password, user.full_name, user.bio, user.avatar_url, user.role, user.space_owner_verified, user.artist_verified, user.provider, user.provider_id, user.created_at, user.updated_at]
            );
            inserted++;
          } catch (err) {
            console.error(`  ❌ Failed to insert user ${user.email}:`, err.message);
          }
        }
      }
    }

    // Verify the data
    const verifyResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
        COUNT(CASE WHEN role = 'space_owner' THEN 1 END) as space_owners,
        COUNT(CASE WHEN role = 'artist' THEN 1 END) as artists
      FROM users
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [startDate, endDate]);

    console.log('\n📊 Summary of inserted users by date:');
    console.log('Date       | Total | Users | Owners | Artists');
    console.log('-----------------------------------------------');
    verifyResult.rows.forEach(row => {
      const dateStr = row.date.toISOString().split('T')[0];
      console.log(`${dateStr} | ${row.total_users.toString().padStart(5)} | ${row.regular_users.toString().padStart(5)} | ${row.space_owners.toString().padStart(6)} | ${row.artists.toString().padStart(7)}`);
    });

    const totalResult = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
        COUNT(CASE WHEN role = 'space_owner' THEN 1 END) as space_owners,
        COUNT(CASE WHEN role = 'artist' THEN 1 END) as artists,
        COUNT(CASE WHEN provider = 'email' THEN 1 END) as email_users,
        COUNT(CASE WHEN provider = 'google' THEN 1 END) as google_users,
        COUNT(CASE WHEN provider = 'facebook' THEN 1 END) as facebook_users
      FROM users
      WHERE created_at >= $1 AND created_at <= $2
    `, [startDate, endDate]);

    console.log('\n📈 Total (30 days):');
    console.log(`  Total Users: ${totalResult.rows[0].total_users}`);
    console.log(`  Regular Users: ${totalResult.rows[0].regular_users}`);
    console.log(`  Space Owners: ${totalResult.rows[0].space_owners}`);
    console.log(`  Artists: ${totalResult.rows[0].artists}`);
    console.log(`\n  By Provider:`);
    console.log(`    Email: ${totalResult.rows[0].email_users}`);
    console.log(`    Google: ${totalResult.rows[0].google_users}`);
    console.log(`    Facebook: ${totalResult.rows[0].facebook_users}`);

    console.log('\n✅ Users buffed successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error buffing users:', error);
    await pool.end();
    process.exit(1);
  }
}

buffUsers();


