-- Add Telegram research message tracking to prospects
ALTER TABLE prospects
  ADD COLUMN IF NOT EXISTS research_msg_id BIGINT,
  ADD COLUMN IF NOT EXISTS research_chat_id TEXT;

CREATE INDEX IF NOT EXISTS idx_prospects_research_msg ON prospects(research_msg_id);
