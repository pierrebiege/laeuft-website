CREATE TABLE training_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'active', 'archived')),
  start_date DATE NOT NULL,
  unique_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_weeks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES training_plans(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  label TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID REFERENCES training_weeks(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  session_type TEXT NOT NULL CHECK (session_type IN ('lauf', 'kraft', 'mobility', 'ruhe')),
  session_subtype TEXT NOT NULL,
  title TEXT NOT NULL,
  duration_minutes INTEGER,
  description TEXT,
  intensity INTEGER CHECK (intensity BETWEEN 1 AND 10),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  plan_token TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  feedback TEXT,
  UNIQUE(session_id, plan_token)
);

CREATE INDEX idx_training_plans_client ON training_plans(client_id);
CREATE INDEX idx_training_plans_token ON training_plans(unique_token);
CREATE INDEX idx_training_weeks_plan ON training_weeks(plan_id);
CREATE INDEX idx_training_sessions_week ON training_sessions(week_id);
CREATE INDEX idx_training_completions_session ON training_completions(session_id);
CREATE INDEX idx_training_completions_token ON training_completions(plan_token);

CREATE TRIGGER trigger_training_plans_updated_at
  BEFORE UPDATE ON training_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_content_reels_updated_at();
