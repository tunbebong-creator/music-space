-- Script để tạo bảng post_reactions và post_comments trong Neon Database
-- Chạy script này trong Neon SQL Editor nếu bảng chưa tồn tại

-- Tạo bảng post_reactions (post_id dùng VARCHAR để hỗ trợ UUID)
CREATE TABLE IF NOT EXISTS post_reactions (
  id SERIAL PRIMARY KEY,
  post_id VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

-- Nếu bảng đã tồn tại với INTEGER post_id, đổi sang VARCHAR
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'post_reactions' 
    AND column_name = 'post_id' 
    AND data_type = 'integer'
  ) THEN
    ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_post_id_fkey;
    ALTER TABLE post_reactions ALTER COLUMN post_id TYPE VARCHAR(255);
  END IF;
END $$;

-- Tạo indexes cho post_reactions
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);

-- Tạo bảng post_comments (post_id dùng VARCHAR để hỗ trợ UUID)
CREATE TABLE IF NOT EXISTS post_comments (
  id SERIAL PRIMARY KEY,
  post_id VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL,
  parent_id INTEGER,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nếu bảng đã tồn tại với INTEGER post_id, đổi sang VARCHAR
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'post_comments' 
    AND column_name = 'post_id' 
    AND data_type = 'integer'
  ) THEN
    ALTER TABLE post_comments DROP CONSTRAINT IF EXISTS post_comments_post_id_fkey;
    ALTER TABLE post_comments ALTER COLUMN post_id TYPE VARCHAR(255);
  END IF;
END $$;

-- Tạo indexes cho post_comments
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_id);

-- Kiểm tra bảng đã được tạo
SELECT 'post_reactions' as table_name, COUNT(*) as row_count FROM post_reactions
UNION ALL
SELECT 'post_comments' as table_name, COUNT(*) as row_count FROM post_comments;

-- Kiểm tra kiểu dữ liệu của post_id
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('post_reactions', 'post_comments') 
  AND column_name = 'post_id';

