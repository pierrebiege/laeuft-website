-- Add production type to youtube_videos
-- Run this in Supabase SQL Editor

ALTER TABLE youtube_videos
ADD COLUMN production TEXT NOT NULL DEFAULT 'inhouse' CHECK (production IN ('inhouse', 'extern')),
ADD COLUMN producer TEXT;

-- Update the Wittiker Race Vlog to extern/Performance Media (2-Teiler Doku)
-- You may need to adjust the ID based on your data
UPDATE youtube_videos
SET production = 'extern', producer = 'Performance Media'
WHERE title LIKE 'Wittiker Backyard Ultra – Das komplette Rennen%';
