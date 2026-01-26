-- Mandate Schema Update v2: Cancellation & Pause Features
-- Run this in Supabase SQL Editor AFTER the initial mandates schema

-- Add cancellation and pause fields to mandates table
ALTER TABLE mandates
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_effective_date DATE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pause_end_date DATE,
ADD COLUMN IF NOT EXISTS pause_reason TEXT;

-- Update status check to include 'cancelling' (in notice period)
ALTER TABLE mandates DROP CONSTRAINT IF EXISTS mandates_status_check;
ALTER TABLE mandates ADD CONSTRAINT mandates_status_check
  CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'active', 'paused', 'cancelling', 'cancelled', 'ended'));
