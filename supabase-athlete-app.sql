-- =====================================================================
-- ATHLETE APP — Phase 0 Fundament (additiv, non-breaking)
-- Trainingsapp von Pierre: echte Athleten-Identität + Strava-Vorbereitung
-- Angewendet via Supabase Management API auf "Läuft Backend" (lsawtepdcsjegbxflmyc)
-- =====================================================================

-- 1) Strukturierte Lauf-Zielfelder (Voraussetzung für geplant-vs-gelaufen).
--    Heute steckt "6.7 km, Pace 7:40–8:10" im Freitext → ohne Zahlen kein
--    maschineller Abgleich. Pace in Sekunden/km.
alter table public.training_sessions
  add column if not exists target_distance_m  integer,   -- Ziel-Distanz in Metern
  add column if not exists target_duration_s  integer,   -- Ziel-Zeit in Sekunden
  add column if not exists target_pace_min_s  integer,   -- schnelle Pace-Grenze (Sek/km)
  add column if not exists target_pace_max_s  integer;   -- langsame Pace-Grenze (Sek/km)

-- 2) Athleten-Identität (App-Login), getrennt vom CRM (clients bleibt Coach-Sicht).
create table if not exists public.athletes (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  name        text,
  created_at  timestamptz not null default now()
);
create unique index if not exists idx_athletes_email_lower on public.athletes (lower(email));

-- 3) Athleten-Sessions (Magic-Link-Login, Pattern wie admin_sessions).
create table if not exists public.athlete_sessions (
  token       text primary key,
  athlete_id  uuid not null references public.athletes(id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_athlete_sessions_athlete on public.athlete_sessions (athlete_id);

-- 4) Einmalige, kurzlebige Login-Tokens (Magic-Link in der E-Mail).
create table if not exists public.athlete_login_tokens (
  token        text primary key,
  athlete_id   uuid not null references public.athletes(id) on delete cascade,
  expires_at   timestamptz not null,
  consumed_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- 5) Brücke CRM ↔ App-Identität.
alter table public.clients
  add column if not exists athlete_id uuid references public.athletes(id);

-- 6) Security by default: RLS an + kein anon/authenticated-Zugriff.
--    Zugriff ausschliesslich über die Service-Role (server-seitige Routen).
alter table public.athletes             enable row level security;
alter table public.athletes             force  row level security;
alter table public.athlete_sessions     enable row level security;
alter table public.athlete_sessions     force  row level security;
alter table public.athlete_login_tokens enable row level security;
alter table public.athlete_login_tokens force  row level security;

revoke all on public.athletes             from anon, authenticated;
revoke all on public.athlete_sessions     from anon, authenticated;
revoke all on public.athlete_login_tokens from anon, authenticated;
