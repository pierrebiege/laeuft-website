-- =============================================
-- Buchhaltung: Ausgaben & Kategorien
-- =============================================

-- Kategorien für Einnahmen und Ausgaben
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT DEFAULT '#6b7280', -- Tailwind gray-500
  icon TEXT DEFAULT 'receipt',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Standard-Kategorien einfügen
INSERT INTO categories (name, type, color, icon, sort_order) VALUES
  -- Einnahmen
  ('Dienstleistungen', 'income', '#10b981', 'briefcase', 1),
  ('Shopify Verkäufe', 'income', '#8b5cf6', 'shopping-cart', 2),
  ('Sonstige Einnahmen', 'income', '#6b7280', 'plus-circle', 3),
  -- Ausgaben
  ('Material & Waren', 'expense', '#ef4444', 'package', 10),
  ('Software & Tools', 'expense', '#3b82f6', 'monitor', 11),
  ('Hosting & Server', 'expense', '#06b6d4', 'server', 12),
  ('Büro & Ausstattung', 'expense', '#f59e0b', 'home', 13),
  ('Reisen & Fahrtkosten', 'expense', '#ec4899', 'car', 14),
  ('Marketing & Werbung', 'expense', '#8b5cf6', 'megaphone', 15),
  ('Versicherungen', 'expense', '#64748b', 'shield', 16),
  ('Telefon & Internet', 'expense', '#14b8a6', 'phone', 17),
  ('Weiterbildung', 'expense', '#f97316', 'book-open', 18),
  ('Sonstige Ausgaben', 'expense', '#6b7280', 'minus-circle', 99);

-- Ausgaben-Tabelle
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Basis-Infos
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Kategorisierung
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Beleg/Dokument
  receipt_url TEXT,           -- Pfad zum hochgeladenen PDF/Bild
  receipt_filename TEXT,      -- Original-Dateiname

  -- OCR-Daten (für spätere Verbesserung)
  ocr_raw_text TEXT,          -- Roher OCR-Text
  ocr_confidence DECIMAL(3,2), -- Konfidenz 0.00-1.00

  -- Lieferant (optional, für wiederkehrende)
  vendor_name TEXT,
  vendor_id UUID,             -- Für spätere Lieferanten-Tabelle

  -- Zusätzliche Infos
  is_recurring BOOLEAN DEFAULT false,
  payment_method TEXT,        -- 'bank', 'cash', 'credit_card'
  reference_number TEXT,      -- Rechnungsnummer des Lieferanten

  -- Import-Tracking
  import_source TEXT,         -- 'manual', 'csv_bank', 'csv_shopify', 'ocr'
  import_batch_id UUID,       -- Für gruppierte Imports

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Einnahmen-Tabelle (zusätzlich zu Rechnungen)
-- Für Shopify-Imports und sonstige Einnahmen die nicht über Rechnungen laufen
CREATE TABLE income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Basis-Infos
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Kategorisierung
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Verknüpfung mit bestehenden Rechnungen (optional)
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

  -- Für Shopify etc.
  external_id TEXT,           -- Shopify Order ID etc.
  external_source TEXT,       -- 'shopify', 'manual', 'other'

  -- Kunde (optional)
  customer_name TEXT,
  customer_email TEXT,

  -- Import-Tracking
  import_source TEXT,         -- 'manual', 'csv_shopify', 'invoice_sync'
  import_batch_id UUID,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Import-Batches für Tracking
CREATE TABLE import_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  type TEXT NOT NULL,         -- 'shopify', 'bank_raiffeisen', 'manual'
  filename TEXT,
  records_total INTEGER DEFAULT 0,
  records_imported INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indizes für Performance
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_income_date ON income(date);
CREATE INDEX idx_income_category ON income(category_id);
CREATE INDEX idx_income_invoice ON income(invoice_id);

-- RLS Policies (falls du Row Level Security nutzt)
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE income ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- View für Buchhaltungs-Übersicht
CREATE OR REPLACE VIEW accounting_summary AS
SELECT
  DATE_TRUNC('month', date) as month,
  'expense' as type,
  SUM(amount) as total,
  COUNT(*) as count
FROM expenses
GROUP BY DATE_TRUNC('month', date)
UNION ALL
SELECT
  DATE_TRUNC('month', date) as month,
  'income' as type,
  SUM(amount) as total,
  COUNT(*) as count
FROM income
GROUP BY DATE_TRUNC('month', date)
UNION ALL
SELECT
  DATE_TRUNC('month', issue_date) as month,
  'invoice' as type,
  SUM(total_amount) as total,
  COUNT(*) as count
FROM invoices
WHERE status = 'paid'
GROUP BY DATE_TRUNC('month', issue_date)
ORDER BY month DESC, type;
