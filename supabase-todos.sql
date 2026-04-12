-- Todos / Aufgaben
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  -- Verknüpfungen
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  mandate_id UUID REFERENCES mandates(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  -- Meta
  created_by TEXT NOT NULL DEFAULT 'Pierre',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_todos_due ON todos(due_date) WHERE NOT completed;
CREATE INDEX idx_todos_completed ON todos(completed);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON todos FOR ALL TO anon USING (true) WITH CHECK (true);
