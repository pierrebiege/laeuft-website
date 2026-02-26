CREATE TABLE prospects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'neu'
    CHECK (status IN ('neu','kontaktiert','follow_up_1','follow_up_2','geantwortet','kein_interesse','kunde')),
  notes TEXT,
  email_1_sent_at TIMESTAMPTZ,
  email_2_sent_at TIMESTAMPTZ,
  email_3_sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  converted_client_id UUID REFERENCES clients(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
