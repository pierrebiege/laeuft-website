-- =============================================
-- LÄUFT. Offerten-System - Datenbank Schema
-- =============================================
-- Dieses SQL in Supabase ausführen:
-- 1. Gehe zu supabase.com → Dein Projekt
-- 2. SQL Editor (links)
-- 3. New Query
-- 4. Dieses SQL einfügen und "Run" klicken
-- =============================================

-- Kunden
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services (Templates)
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offerten
CREATE TABLE offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  valid_until DATE,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  unique_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Offerten-Positionen
CREATE TABLE offer_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes für Performance
CREATE INDEX idx_offers_client ON offers(client_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_token ON offers(unique_token);
CREATE INDEX idx_offer_items_offer ON offer_items(offer_id);

-- Row Level Security aktivieren
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_items ENABLE ROW LEVEL SECURITY;

-- Policies: Für jetzt alles erlauben (später mit Auth einschränken)
CREATE POLICY "Allow all for clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all for services" ON services FOR ALL USING (true);
CREATE POLICY "Allow all for offers" ON offers FOR ALL USING (true);
CREATE POLICY "Allow all for offer_items" ON offer_items FOR ALL USING (true);

-- =============================================
-- Test-Daten (optional)
-- =============================================

-- Beispiel-Services einfügen
INSERT INTO services (name, description, default_amount, is_recurring, features) VALUES
(
  'Partner',
  'Laufende IT-Betreuung',
  3500,
  true,
  '["Systeme am Laufen halten", "Bestehende Seiten pflegen", "Kleine Anpassungen & neue Features", "48h Reaktionszeit, 24h Notfall", "Monatlicher Check-in", "Beratung & Meetings"]'::jsonb
),
(
  'Projekt-Start',
  'Einmalige Projektphase mit höherem Aufwand',
  4500,
  false,
  '["Projekte abschliessen", "Laufende Betreuung", "Intensive Begleitung"]'::jsonb
);

-- Beispiel-Kunde
INSERT INTO clients (name, company, email) VALUES
('Roger Widmer', 'ParkourONE GmbH', 'roger@parkourone.com');
