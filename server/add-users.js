import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_Frv90HNpbhjo@ep-muddy-bonus-adx6h9r8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

// Tên người Việt Nam thật
const vietnameseNames = [
  // 7 Artists
  'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Cường', 'Phạm Thị Dung', 'Hoàng Văn Đức', 'Vũ Thị Hoa', 'Đỗ Văn Hùng',
  // 83 Users
  'Nguyễn Thị Lan', 'Trần Văn Mạnh', 'Lê Thị Mai', 'Phạm Văn Nam', 'Hoàng Thị Oanh', 'Vũ Văn Phong', 'Đỗ Thị Quỳnh',
  'Nguyễn Văn Sơn', 'Trần Thị Tâm', 'Lê Văn Thành', 'Phạm Thị Uyên', 'Hoàng Văn Vinh', 'Vũ Thị Xuân', 'Đỗ Văn Yên',
  'Nguyễn Thị Ánh', 'Trần Văn Bảo', 'Lê Thị Chi', 'Phạm Văn Dũng', 'Hoàng Thị Em', 'Vũ Văn Giang', 'Đỗ Thị Hà',
  'Nguyễn Văn Hiếu', 'Trần Thị I', 'Lê Văn Khoa', 'Phạm Thị Linh', 'Hoàng Văn Minh', 'Vũ Thị Nga', 'Đỗ Văn Oanh',
  'Nguyễn Thị Phương', 'Trần Văn Quân', 'Lê Thị Rùa', 'Phạm Văn Sơn', 'Hoàng Thị Thu', 'Vũ Văn Tuấn', 'Đỗ Thị Vân',
  'Nguyễn Văn Xoan', 'Trần Thị Yến', 'Lê Văn Anh', 'Phạm Thị Bích', 'Hoàng Văn Cường', 'Vũ Thị Dung', 'Đỗ Văn Đức',
  'Nguyễn Thị Hoa', 'Trần Văn Hùng', 'Lê Thị Lan', 'Phạm Văn Mạnh', 'Hoàng Thị Mai', 'Vũ Văn Nam', 'Đỗ Thị Oanh',
  'Nguyễn Văn Phong', 'Trần Thị Quỳnh', 'Lê Văn Sơn', 'Phạm Thị Tâm', 'Hoàng Văn Thành', 'Vũ Thị Uyên', 'Đỗ Văn Vinh',
  'Nguyễn Thị Xuân', 'Trần Văn Yên', 'Lê Thị Ánh', 'Phạm Văn Bảo', 'Hoàng Thị Chi', 'Vũ Văn Dũng', 'Đỗ Thị Em',
  'Nguyễn Văn Giang', 'Trần Thị Hà', 'Lê Văn Hiếu', 'Phạm Thị I', 'Hoàng Văn Khoa', 'Vũ Thị Linh', 'Đỗ Văn Minh',
  'Nguyễn Thị Nga', 'Trần Văn Oanh', 'Lê Thị Phương', 'Phạm Văn Quân', 'Hoàng Thị Rùa', 'Vũ Văn Sơn', 'Đỗ Thị Thu',
  'Nguyễn Văn Tuấn', 'Trần Thị Vân', 'Lê Văn Xoan', 'Phạm Thị Yến', 'Hoàng Văn An', 'Vũ Thị Bích', 'Đỗ Văn Cường',
  'Nguyễn Thị Dung', 'Trần Văn Đức', 'Lê Thị Hoa', 'Phạm Văn Hùng', 'Hoàng Thị Lan', 'Vũ Văn Mạnh', 'Đỗ Thị Mai',
  'Nguyễn Văn Nam', 'Trần Thị Oanh', 'Lê Văn Phong', 'Phạm Thị Quỳnh', 'Hoàng Văn Sơn', 'Vũ Thị Tâm', 'Đỗ Văn Thành',
  'Nguyễn Thị Uyên', 'Trần Văn Vinh', 'Lê Thị Xuân', 'Phạm Văn Yên', 'Hoàng Thị Ánh', 'Vũ Văn Bảo', 'Đỗ Thị Chi',
  'Nguyễn Văn Dũng', 'Trần Thị Em', 'Lê Văn Giang', 'Phạm Thị Hà', 'Hoàng Văn Hiếu', 'Vũ Thị I', 'Đỗ Văn Khoa',
  'Nguyễn Thị Linh', 'Trần Văn Minh', 'Lê Thị Nga', 'Phạm Văn Oanh', 'Hoàng Thị Phương', 'Vũ Văn Quân', 'Đỗ Thị Rùa',
  'Nguyễn Văn Sơn', 'Trần Thị Thu', 'Lê Văn Tuấn', 'Phạm Thị Vân', 'Hoàng Văn Xoan', 'Vũ Thị Yến', 'Đỗ Văn An',
  'Nguyễn Thị Bích', 'Trần Văn Cường', 'Lê Thị Dung'
];

// Generate email từ tên
const generateEmail = (name, index) => {
  const normalizedName = name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, '');
  const parts = normalizedName.split(' ');
  const lastPart = parts[parts.length - 1];
  const firstPart = parts[0];
  return `${firstPart}${lastPart}${index}@gmail.com`;
};

async function addUsers() {
  try {
    console.log('🚀 Starting to add 90 users to database...');
    
    // 7 Artists
    const artists = [];
    for (let i = 0; i < 7; i++) {
      const name = vietnameseNames[i];
      const email = generateEmail(name, i + 1);
      artists.push({ name, email, role: 'artist' });
    }
    
    // 83 Regular Users
    const users = [];
    for (let i = 7; i < 90; i++) {
      const name = vietnameseNames[i];
      const email = generateEmail(name, i + 1);
      users.push({ name, email, role: 'user' });
    }
    
    console.log(`📝 Adding ${artists.length} artists...`);
    for (const artist of artists) {
      try {
        await pool.query(
          `INSERT INTO users (email, full_name, role, provider, artist_verified) 
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (email) DO NOTHING`,
          [artist.email, artist.name, artist.role, 'email', true]
        );
        console.log(`✅ Added artist: ${artist.name} (${artist.email})`);
      } catch (error) {
        console.error(`❌ Error adding artist ${artist.name}:`, error.message);
      }
    }
    
    console.log(`📝 Adding ${users.length} regular users...`);
    for (const user of users) {
      try {
        await pool.query(
          `INSERT INTO users (email, full_name, role, provider) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) DO NOTHING`,
          [user.email, user.name, user.role, 'email']
        );
        console.log(`✅ Added user: ${user.name} (${user.email})`);
      } catch (error) {
        console.error(`❌ Error adding user ${user.name}:`, error.message);
      }
    }
    
    console.log('✅ Successfully added all users!');
    
    // Verify counts
    const artistCount = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['artist']);
    const userCount = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', ['user']);
    console.log(`📊 Total artists: ${artistCount.rows[0].count}`);
    console.log(`📊 Total users: ${userCount.rows[0].count}`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

addUsers();

