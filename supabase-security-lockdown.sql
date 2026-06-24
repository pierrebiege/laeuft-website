DO $$
DECLARE
  sensitive text[] := ARRAY[
    'clients','invoices','invoice_items',
    'mandates','mandate_invoices','mandate_options','mandate_pricing_phases',
    'mandate_section_items','mandate_sections','mandate_systems',
    'expenses','income','categories','import_batches',
    'partners','partner_history','partner_attachments',
    'calendar_events','todos',
    'offers','offer_items',
    'prospects','presentations','pending_emails',
    'content_gedanken','content_reels','youtube_videos',
    'instagram_manual_insights','instagram_story_archive'
  ];
  t text;
  pol RECORD;
BEGIN
  -- 1) Drop every existing policy on these tables (the "allow all" + token-SELECT ones).
  FOR pol IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = ANY(sensitive)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;

  -- 2) Enable + force RLS and revoke all anon/authenticated grants.
  --    service_role bypasses RLS and keeps its own grants, so the admin proxy
  --    and all server routes are unaffected.
  FOREACH t IN ARRAY sensitive
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM authenticated', t);
  END LOOP;
END $$;
