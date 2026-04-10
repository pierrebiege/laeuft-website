-- Pending emails waiting for Telegram approval
CREATE TABLE pending_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  email_number INTEGER NOT NULL CHECK (email_number IN (1, 2, 3)),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  telegram_message_id BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'sent', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_pending_emails_status ON pending_emails(status);
CREATE INDEX idx_pending_emails_prospect ON pending_emails(prospect_id);
