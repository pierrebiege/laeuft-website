-- Add intro text to plans and weekly summaries
ALTER TABLE training_plans ADD COLUMN IF NOT EXISTS intro_text TEXT;
ALTER TABLE training_weeks ADD COLUMN IF NOT EXISTS summary TEXT;
