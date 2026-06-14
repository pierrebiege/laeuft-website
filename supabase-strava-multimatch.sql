-- =====================================================================
-- Mehrfach-Zuordnung: eine Einheit kann durch MEHRERE Strava-Läufe erfüllt
-- werden (zusammengezählt) — z.B. 3 Läufe = 1 Longrun, oder Backyard-Loops.
-- Aggregat-Werte direkt am Match (keine teure Join-Rechnung beim Anzeigen).
-- =====================================================================

alter table public.session_activity_matches
  add column if not exists activity_ids        uuid[],
  add column if not exists total_distance_m     numeric,
  add column if not exists total_moving_time_s  integer,
  add column if not exists total_pace_s         integer,
  add column if not exists activity_count       integer;

-- Bestehende (Auto-)Matches auf das neue Schema heben.
update public.session_activity_matches m
set activity_ids        = array[m.activity_id],
    total_distance_m     = a.distance_m,
    total_moving_time_s  = a.moving_time_s,
    total_pace_s         = a.average_pace_s,
    activity_count       = 1
from public.strava_activities a
where a.id = m.activity_id and m.activity_ids is null;

-- Kombinieren/Neuzuordnen erlauben: Einzel-Unique auf activity_id weg,
-- activity_id nullable (bei Kombi = erster Lauf als Repräsentant). Doppelnutzung
-- verhindert die App über activity_ids.
alter table public.session_activity_matches drop constraint if exists session_activity_matches_activity_id_key;
alter table public.session_activity_matches alter column activity_id drop not null;
