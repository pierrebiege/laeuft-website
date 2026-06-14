-- =====================================================================
-- Abdichten der training_*-Tabellen (NACH Deploy der Server-Routen!)
-- Alle Reads laufen jetzt über die Service-Role (/api/training/by-token,
-- /api/athlete/*, /api/training/*, Crons) → anon braucht keinen Zugriff mehr.
-- Angewendet via Management API auf "Läuft Backend" (lsawtepdcsjegbxflmyc).
-- =====================================================================

alter table public.training_plans       enable row level security;
alter table public.training_plans       force  row level security;
alter table public.training_weeks        enable row level security;
alter table public.training_weeks        force  row level security;
alter table public.training_sessions     enable row level security;
alter table public.training_sessions     force  row level security;
alter table public.training_completions  enable row level security;
alter table public.training_completions  force  row level security;
alter table public.exercises             enable row level security;
alter table public.exercises             force  row level security;
alter table public.session_exercises     enable row level security;
alter table public.session_exercises     force  row level security;

revoke all on public.training_plans      from anon, authenticated;
revoke all on public.training_weeks       from anon, authenticated;
revoke all on public.training_sessions    from anon, authenticated;
revoke all on public.training_completions from anon, authenticated;
revoke all on public.exercises            from anon, authenticated;
revoke all on public.session_exercises    from anon, authenticated;
