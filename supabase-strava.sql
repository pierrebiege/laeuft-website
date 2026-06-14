-- =====================================================================
-- STRAVA-Integration (Phase 3) — additiv, von Geburt an sicher.
-- Tokens AES-256-GCM-verschlüsselt (Key in Vercel-Env STRAVA_TOKEN_KEY,
-- getrennt von der DB); Tabellen nur über Service-Role erreichbar.
-- =====================================================================

create table if not exists public.strava_connections (
  athlete_id         uuid primary key references public.athletes(id) on delete cascade,
  strava_athlete_id  bigint unique not null,
  access_token_enc   text not null,
  refresh_token_enc  text not null,
  expires_at         timestamptz not null,
  scope              text,
  last_sync_at       timestamptz,
  created_at         timestamptz not null default now()
);

create table if not exists public.strava_activities (
  id                   uuid primary key default gen_random_uuid(),
  athlete_id           uuid not null references public.athletes(id) on delete cascade,
  strava_activity_id   bigint unique not null,
  sport_type           text,
  name                 text,
  start_date           timestamptz,
  start_date_local     timestamptz,
  local_date           date,             -- aus start_date_local (Matching-Schlüssel)
  distance_m           numeric,
  moving_time_s        integer,
  elapsed_time_s       integer,
  average_pace_s       integer,          -- Sekunden/km, abgeleitet aus distance/moving_time
  average_heartrate    numeric,          -- Gesundheitsdaten: nur mit Einwilligung beim Connect
  total_elevation_gain numeric,
  created_at           timestamptz not null default now()
);
create index if not exists idx_strava_activities_athlete_date on public.strava_activities (athlete_id, local_date);

create table if not exists public.session_activity_matches (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.training_sessions(id) on delete cascade,
  activity_id      uuid not null references public.strava_activities(id) on delete cascade,
  athlete_id       uuid not null references public.athletes(id) on delete cascade,
  source           text not null default 'auto',  -- auto | athlete | coach
  confidence       text,                           -- hoch | mittel | niedrig
  distance_delta_m numeric,
  pace_in_range    boolean,
  created_at       timestamptz not null default now(),
  unique (session_id),
  unique (activity_id)
);
create index if not exists idx_sam_athlete on public.session_activity_matches (athlete_id);

-- Security by default: nur Service-Role.
alter table public.strava_connections        enable row level security;
alter table public.strava_connections        force  row level security;
alter table public.strava_activities          enable row level security;
alter table public.strava_activities          force  row level security;
alter table public.session_activity_matches   enable row level security;
alter table public.session_activity_matches   force  row level security;
revoke all on public.strava_connections       from anon, authenticated;
revoke all on public.strava_activities         from anon, authenticated;
revoke all on public.session_activity_matches  from anon, authenticated;
