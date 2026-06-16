-- =====================================================================
-- STRAVA-Aufbewahrung: 7-Tage-Regel sauber umsetzen.
-- Strava erlaubt KEINE Strava-Rohdaten >7 Tage im Cache. Lösung:
--   1) Wochen-Aggregate (abgeleitet, OHNE HF) dauerhaft einfrieren.
--   2) Roh-Aktivitäten nach 7 Tagen löschen (Cron).
--   3) Match-Zeilen (Trainings-Log "geplant vs gelaufen") überleben das
--      Löschen der Rohdaten -> FK von CASCADE auf SET NULL.
-- Tabellen nur über Service-Role erreichbar (wie strava_*).
-- =====================================================================

-- 1) Dauerhafte, abgeleitete Wochen-Auswertung (KEINE Rohdaten, KEINE HF).
create table if not exists public.athlete_insights (
  id                   uuid primary key default gen_random_uuid(),
  athlete_id           uuid not null references public.athletes(id) on delete cascade,
  week_start           date not null,            -- Montag der Woche
  week_end             date not null,            -- Sonntag der Woche
  run_count            integer not null default 0,
  total_distance_m     numeric not null default 0,
  total_moving_time_s  integer not null default 0,
  total_elevation_m    numeric not null default 0,
  avg_pace_s           integer,                  -- distanzgewichtet, Sek/km
  longest_run_m        numeric,
  created_at           timestamptz not null default now(),
  unique (athlete_id, week_start)
);
create index if not exists idx_athlete_insights_athlete on public.athlete_insights (athlete_id, week_start);

alter table public.athlete_insights enable row level security;
alter table public.athlete_insights force  row level security;
revoke all on public.athlete_insights from anon, authenticated;

-- 2) Match-Zeile soll das Löschen der Roh-Aktivität überleben (Aggregate
--    stecken bereits in der Match-Zeile -> SET NULL statt CASCADE).
alter table public.session_activity_matches
  drop constraint if exists session_activity_matches_activity_id_fkey;
alter table public.session_activity_matches
  add  constraint session_activity_matches_activity_id_fkey
       foreign key (activity_id) references public.strava_activities(id) on delete set null;
