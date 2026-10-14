-- Kalender 2027 — Bildabstimmung (laeuft.ch/kalender), 14.10.2026.
-- Projekt lsawtepdcsjegbxflmyc. Geschrieben nur vom Service-Role-Key in
-- src/app/api/kalender/stimme/route.ts. RLS an, bewusst KEINE Policy:
-- anon und authenticated kommen nicht an die Adressen.
create table if not exists public.kalender_abstimmung (
  id           uuid primary key default gen_random_uuid(),
  erstellt_am  timestamptz not null default now(),
  name         text not null,
  email        text,
  strasse      text not null,
  plz          text not null,
  ort          text not null,
  land         text not null default 'Schweiz',
  bilder       text[] not null,
  adresse_key  text not null unique  -- eine Stimme pro Adresse
);
alter table public.kalender_abstimmung enable row level security;
-- Auswertung:
--   select b, count(*) from kalender_abstimmung, unnest(bilder) b group by b order by 2 desc;
-- Versandliste:
--   select name, strasse, plz, ort, land, email from kalender_abstimmung order by erstellt_am;

-- 14.10.2026: Frage «mit Zahlen und Wochentagen oder ohne».
alter table public.kalender_abstimmung add column if not exists daten text check (daten in ('mit','ohne'));
--   select daten, count(*) from kalender_abstimmung group by daten;

-- 14.10.2026: öffentliche Abstimmung via Instagram (E-Mail + Land, Rabattcode statt Gratiskalender).
alter table public.kalender_abstimmung alter column strasse drop not null, alter column plz drop not null, alter column ort drop not null;
alter table public.kalender_abstimmung add column if not exists vorname text, add column if not exists quelle text not null default 'freunde';
--   select land, count(*) from kalender_abstimmung where quelle='instagram' group by land;
--   Newsletter-Liste: select email, vorname, land from kalender_abstimmung where quelle='instagram';
