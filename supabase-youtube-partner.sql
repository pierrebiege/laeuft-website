-- Add partner reference to youtube_videos
-- Run this in Supabase SQL Editor

ALTER TABLE youtube_videos
ADD COLUMN partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;

CREATE INDEX idx_youtube_videos_partner ON youtube_videos(partner_id);
