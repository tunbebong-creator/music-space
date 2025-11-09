import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Neon Database connection
const hardcodedConnectionString = 'postgresql://neondb_owner:npg_Frv90HNpbhjo@ep-muddy-bonus-adx6h9r8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || hardcodedConnectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper function to get random number between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function to get random element from array
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function createPastEventBookings() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database');

    // Get 3 past events (oldest first)
    console.log('\n📅 Fetching past events...');
    const eventsResult = await pool.query(`
      SELECT id, title, event_date, start_time, end_time, price, max_participants, space_id
      FROM events
      WHERE event_date < NOW()
      ORDER BY event_date ASC
      LIMIT 3
    `);

    if (eventsResult.rows.length === 0) {
      console.log('❌ No past events found');
      return;
    }

    const pastEvents = eventsResult.rows;
    console.log(`✅ Found ${pastEvents.length} past events:`);
    pastEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.title} (ID: ${event.id}) - ${new Date(event.event_date).toLocaleDateString('vi-VN')}`);
    });

    // Get all customer users (role = 'user' is the default customer role)
    console.log('\n👥 Fetching customer users...');
    const usersResult = await pool.query(`
      SELECT id, email, full_name, role
      FROM users
      WHERE role = 'user'
      ORDER BY id
    `);

    if (usersResult.rows.length === 0) {
      console.log('❌ No customer users found');
      return;
    }

    const customerUsers = usersResult.rows;
    console.log(`✅ Found ${customerUsers.length} customer users`);

    if (customerUsers.length === 0) {
      console.log('❌ No customer users available for bookings');
      return;
    }

    // Create bookings for each event
    let totalBookingsCreated = 0;

    for (let i = 0; i < pastEvents.length; i++) {
      const event = pastEvents[i];
      let bookingCount;

      if (i === 0) {
        // Oldest event: 11-16 bookings
        bookingCount = getRandomInt(11, 16);
      } else {
        // Events 2-3: 13-24 bookings each
        bookingCount = getRandomInt(13, 24);
      }

      console.log(`\n📝 Creating ${bookingCount} bookings for event: ${event.title} (ID: ${event.id})`);

      // Shuffle users to randomize selection
      const shuffledUsers = shuffleArray(customerUsers);
      
      // Select random users (can repeat if needed)
      const selectedUsers = [];
      for (let j = 0; j < bookingCount; j++) {
        selectedUsers.push(getRandomElement(shuffledUsers));
      }

      // Create bookings
      const bookingsCreated = [];
      for (let j = 0; j < bookingCount; j++) {
        const user = selectedUsers[j];
        
        // Determine status based on how far in the past the event is
        const eventDate = new Date(event.event_date);
        const daysAgo = Math.floor((Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let status = 'confirmed';
        let paymentStatus = 'paid';
        
        // If event was more than 7 days ago, mark as completed
        if (daysAgo > 7) {
          status = 'completed';
        }

        // Random payment status (mostly paid for past events)
        const paymentRand = Math.random();
        if (paymentRand < 0.9) {
          paymentStatus = 'paid';
        } else if (paymentRand < 0.95) {
          paymentStatus = 'pending';
        } else {
          paymentStatus = 'cancelled';
          status = 'cancelled';
        }

        // Use event's start_time and end_time, or defaults
        const startTime = event.start_time || '18:00:00';
        const endTime = event.end_time || '20:00:00';
        
        // Calculate total price (use event price or default)
        const totalPrice = event.price || 0;

        try {
          const insertResult = await pool.query(`
            INSERT INTO bookings (
              user_id, event_id, space_id, booking_date, start_time, end_time, 
              total_price, status, payment_status,
              customer_name, customer_email, customer_phone
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
          `, [
            user.id,
            event.id,
            event.space_id,
            event.event_date, // booking_date = event_date
            startTime,
            endTime,
            totalPrice,
            status,
            paymentStatus,
            user.full_name || `Customer ${user.id}`,
            user.email,
            null // customer_phone
          ]);

          bookingsCreated.push(insertResult.rows[0].id);
        } catch (error) {
          console.error(`   ❌ Failed to create booking for user ${user.id}:`, error.message);
        }
      }

      totalBookingsCreated += bookingsCreated.length;
      console.log(`   ✅ Created ${bookingsCreated.length} bookings for event ${event.id}`);
    }

    console.log(`\n✅ Total bookings created: ${totalBookingsCreated}`);

    // Verify bookings
    console.log('\n🔍 Verifying bookings...');
    const verifyResult = await pool.query(`
      SELECT 
        e.id as event_id,
        e.title,
        COUNT(b.id) as booking_count
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id
      WHERE e.id IN (${pastEvents.map(e => e.id).join(',')})
      GROUP BY e.id, e.title
      ORDER BY e.event_date ASC
    `);

    console.log('\n📊 Booking summary:');
    verifyResult.rows.forEach(row => {
      console.log(`   Event "${row.title}" (ID: ${row.event_id}): ${row.booking_count} bookings`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
    console.log('\n✅ Database connection closed');
  }
}

// Run the script
createPastEventBookings();

