-- Mandates Schema for Läuft.
-- Run this in Supabase SQL Editor

-- Mandates table (main recurring contract)
CREATE TABLE IF NOT EXISTS mandates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subtitle TEXT,
    introduction TEXT,

    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'active', 'paused', 'cancelled', 'ended')),

    -- Dates
    valid_until DATE,
    start_date DATE,
    end_date DATE,

    -- Accepted option (filled when customer accepts)
    accepted_option_id UUID,
    accepted_at TIMESTAMPTZ,
    signature_data TEXT, -- Base64 signature image if needed

    -- Token for public access
    unique_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),

    -- Billing settings
    billing_day INTEGER DEFAULT 1, -- Day of month to generate invoice
    next_invoice_date DATE,
    last_invoice_date DATE,
    invoices_generated INTEGER DEFAULT 0,

    -- Conditions
    cancellation_period TEXT DEFAULT '3 Monate',
    pause_fee DECIMAL(10,2) DEFAULT 1000,
    billing_cycle TEXT DEFAULT 'monthly', -- monthly, quarterly, yearly

    -- Metadata
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mandate pricing phases (e.g., Feb-Apr: 4500, from May: 3500)
CREATE TABLE IF NOT EXISTS mandate_pricing_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandate_id UUID REFERENCES mandates(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- "Februar – April 2026"
    amount DECIMAL(10,2) NOT NULL,
    description TEXT, -- "Projekte abschliessen + laufende Betreuung"
    start_date DATE,
    end_date DATE, -- NULL means ongoing
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mandate sections (Projekte, Was drin ist, Wie es läuft, etc.)
CREATE TABLE IF NOT EXISTS mandate_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandate_id UUID REFERENCES mandates(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- "Projekte bis Ende April"
    title TEXT,
    description TEXT,
    section_type TEXT DEFAULT 'list' CHECK (section_type IN ('list', 'terms', 'text', 'comparison')),
    page_number INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mandate section items (list items within sections)
CREATE TABLE IF NOT EXISTS mandate_section_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES mandate_sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    detail TEXT, -- Right side text like "inkl." or "48h"
    description TEXT, -- For terms: additional description
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mandate options (the 3 choices at the end)
CREATE TABLE IF NOT EXISTS mandate_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandate_id UUID REFERENCES mandates(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- "Mandat ab Februar 2026"
    description TEXT, -- "Nahtloser Übergang. Feb–Apr: 4'500.–/Mt, ab Mai: 3'500.–/Mt"
    monthly_amount DECIMAL(10,2), -- Amount to invoice if this option is selected
    start_date DATE, -- When this option would start
    is_rejection BOOLEAN DEFAULT false, -- True for "Kein Mandat" option
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Systems covered by mandate
CREATE TABLE IF NOT EXISTS mandate_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandate_id UUID REFERENCES mandates(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- "parkourone.com + 10 Länderseiten"
    technology TEXT, -- "WordPress"
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mandate invoices tracking (links mandates to generated invoices)
CREATE TABLE IF NOT EXISTS mandate_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandate_id UUID REFERENCES mandates(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mandates_client ON mandates(client_id);
CREATE INDEX IF NOT EXISTS idx_mandates_status ON mandates(status);
CREATE INDEX IF NOT EXISTS idx_mandates_token ON mandates(unique_token);
CREATE INDEX IF NOT EXISTS idx_mandate_pricing_mandate ON mandate_pricing_phases(mandate_id);
CREATE INDEX IF NOT EXISTS idx_mandate_sections_mandate ON mandate_sections(mandate_id);
CREATE INDEX IF NOT EXISTS idx_mandate_items_section ON mandate_section_items(section_id);
CREATE INDEX IF NOT EXISTS idx_mandate_options_mandate ON mandate_options(mandate_id);
CREATE INDEX IF NOT EXISTS idx_mandate_invoices_mandate ON mandate_invoices(mandate_id);

-- Update trigger for mandates
CREATE OR REPLACE FUNCTION update_mandate_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS mandate_updated ON mandates;
CREATE TRIGGER mandate_updated
    BEFORE UPDATE ON mandates
    FOR EACH ROW
    EXECUTE FUNCTION update_mandate_timestamp();

-- RLS Policies (enable as needed)
-- ALTER TABLE mandates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mandate_pricing_phases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mandate_sections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mandate_section_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mandate_options ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mandate_systems ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mandate_invoices ENABLE ROW LEVEL SECURITY;
