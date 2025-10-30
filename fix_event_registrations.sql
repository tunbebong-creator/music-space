-- Fix event_registrations table structure
-- Run this in Neon Console SQL Editor

-- Step 1: Check current structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'event_registrations'
ORDER BY ordinal_position;

-- Step 2: Check PRIMARY KEY constraints
SELECT 
    constraint_name, 
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'event_registrations' 
  AND constraint_type IN ('PRIMARY KEY', 'UNIQUE');

-- Step 3: Drop table if exists and recreate with correct structure
DROP TABLE IF EXISTS event_registrations CASCADE;

CREATE TABLE event_registrations (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL,
    artist_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, artist_id)
);

-- Step 4: Create indexes for better performance
CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_artist ON event_registrations(artist_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);

-- Step 5: Verify structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'event_registrations'
ORDER BY ordinal_position;

SELECT 
    constraint_name, 
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'event_registrations' 
  AND constraint_type IN ('PRIMARY KEY', 'UNIQUE');

