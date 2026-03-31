-- Manual Instagram insights data (entered from Instagram app screenshots)
CREATE TABLE IF NOT EXISTS instagram_manual_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period INTEGER NOT NULL CHECK (period IN (7, 14, 30)),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('aufrufe', 'interaktionen')),
  total_value INTEGER NOT NULL,
  follower_pct NUMERIC(5,1),
  non_follower_pct NUMERIC(5,1),
  stories_pct NUMERIC(5,1),
  reels_pct NUMERIC(5,1),
  posts_pct NUMERIC(5,1),
  erreichte_konten INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period, metric_type)
);
