-- Update events table to include more detailed fields
ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'workshop';
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_name VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_address TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_city VARCHAR(100);
ALTER TABLE events ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE events ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE events ADD COLUMN IF NOT EXISTS min_participants INTEGER DEFAULT 1;
ALTER TABLE events ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'VND';
ALTER TABLE events ADD COLUMN IF NOT EXISTS early_bird_price DECIMAL(10,2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS early_bird_until DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery_images TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS audio_preview TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'public';
ALTER TABLE events ADD COLUMN IF NOT EXISTS age_restriction VARCHAR(50) DEFAULT 'all';
ALTER TABLE events ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'vi';
ALTER TABLE events ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(50) DEFAULT 'beginner';
ALTER TABLE events ADD COLUMN IF NOT EXISTS equipment_provided TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS equipment_needed TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS amenities TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_name VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_email VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_phone VARCHAR(20);
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_bio TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS requirements TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS what_to_bring TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS refund_policy TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS facebook_event TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS instagram_post TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS hashtags TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS promoted BOOLEAN DEFAULT FALSE;

-- Create event_registrations table for LOVE module
CREATE TABLE IF NOT EXISTS event_registrations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    event_id INTEGER REFERENCES events(id),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'registered',
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_amount DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id)
);

-- Create space_follows table for LOVE module
CREATE TABLE IF NOT EXISTS space_follows (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    space_id INTEGER REFERENCES spaces(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, space_id)
);

-- Create reviews table for LOVE module
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    target_type VARCHAR(50) NOT NULL, -- 'space' or 'event'
    target_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    emotion VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table for LOVE module
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reports table for LOVE module
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER REFERENCES users(id),
    target_type VARCHAR(50) NOT NULL, -- 'space', 'event', 'user'
    target_id INTEGER NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_space_follows_user ON space_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_space_follows_space ON space_follows(space_id);
CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);











