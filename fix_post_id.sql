-- Script để FIX post_id từ INTEGER sang VARCHAR
-- Chạy script này trong Neon SQL Editor

-- Fix post_reactions
ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_post_id_fkey CASCADE;
ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_post_id_user_id_key CASCADE;
ALTER TABLE post_reactions ALTER COLUMN post_id TYPE VARCHAR(255) USING post_id::VARCHAR(255);

-- Fix post_comments
ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS post_comments_post_id_fkey CASCADE;
ALTER TABLE post_comments ALTER COLUMN post_id TYPE VARCHAR(255) USING post_id::VARCHAR(255);

-- Kiểm tra kết quả
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('post_reactions', 'post_comments') 
  AND column_name = 'post_id';

