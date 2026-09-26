-- Graatzug Backyard Ultra Simplon — Lotterie-Anmeldungen, 19.06.2027.
-- Angelegt am 26.09.2026 auf dem Projekt lsawtepdcsjegbxflmyc.
-- Geschrieben nur vom Service-Role-Key in src/app/api/graatzug/lotterie/route.ts.
-- RLS an, bewusst KEINE Policy: anon und authenticated kommen nicht an die Daten.

create table if not exists public.graatzug_lotterie (
  id                uuid primary key default gen_random_uuid(),
  erstellt_am       timestamptz not null default now(),
  aktualisiert_am   timestamptz not null default now(),
  vorname           text not null,
  nachname          text not null,
  email             text not null,
  telefon           text not null,
  geburtsjahr       int  not null,
  geschlecht        text not null,       -- weiblich / männlich / divers
  wohnort           text not null,
  land              text not null,
  anzahl_backyards  text not null,       -- 0 / 1 / 2-3 / 4-6 / 7+
  bestleistung      int  not null,       -- längstes Backyard in Runden (0 = noch keins)
  bestleistung_wo   text,                -- Name des Rennens
  zielrunden        int  not null,       -- wie viele Runden am Graatzug
  motivation        text,
  volljaehrig       boolean not null,
  einwilligung_am   timestamptz not null,
  kaution_ok_am     timestamptz not null,
  status            text not null default 'angemeldet',  -- angemeldet / gezogen / warteliste / zurueckgezogen
  ip_hash           text,
  quelle            text
);
alter table public.graatzug_lotterie add constraint graatzug_lotterie_email_key unique (email);
alter table public.graatzug_lotterie enable row level security;

-- Liste für die Auslosung:
--   select vorname, nachname, geschlecht, land, anzahl_backyards, bestleistung, zielrunden, erstellt_am
--   from graatzug_lotterie where status = 'angemeldet' order by erstellt_am;
