-- Calendar Events (Time Blocking)
CREATE TABLE calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  event_type TEXT NOT NULL DEFAULT 'work',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  mandate_id UUID REFERENCES mandates(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  recurrence_rule TEXT,
  recurrence_end DATE,
  created_by TEXT NOT NULL DEFAULT 'Pierre',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_range ON calendar_events (start_at, end_at);

-- RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON calendar_events FOR ALL TO anon USING (true) WITH CHECK (true);
