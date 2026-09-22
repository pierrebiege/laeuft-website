-- 50 KM BRIG — Anmeldungen, 04.10.2026.
-- Angelegt am 17.09.2026 auf dem Projekt lsawtepdcsjegbxflmyc.
-- Geschrieben ausschliesslich vom Service-Role-Key in
-- src/app/api/brig-ultra/anmeldung/route.ts. RLS ist an und es gibt bewusst
-- KEINE Policy: anon und authenticated kommen damit nicht an die Adressen.

create table if not exists public.brig_ultra_anmeldungen (
  id            uuid primary key default gen_random_uuid(),
  erstellt_am   timestamptz not null default now(),
  name          text not null,   -- zusammengesetzt, fuer Anrede und Betreff
  vorname       text,
  nachname      text,
  email         text not null,
  telefon       text,            -- WhatsApp-Nummer, freiwillig
  shirt         text,            -- T-Shirt-Groesse; das Studio verschenkt Shirts
  umfang        text,
  anzahl        int  not null default 1,
  notiz         text,
  quelle        text,
  ip_hash       text,          -- gehashte IP, damit Missbrauch nachvollziehbar bleibt
  storniert_am  timestamptz
);

-- Wer sich zweimal anmeldet, korrigiert seine erste Anmeldung: die Bedingung
-- macht aus dem zweiten Absenden ein Update statt einer Dublette. Bewusst
-- eine Constraint auf der Spalte und kein Index auf lower(email) — PostgREST
-- kann ON CONFLICT nur gegen eine echte Constraint auflösen. Die Route
-- schreibt die Adresse deshalb immer klein.
alter table public.brig_ultra_anmeldungen
  add constraint brig_ultra_anmeldungen_email_key unique (email);

alter table public.brig_ultra_anmeldungen enable row level security;

-- Die Liste zum Abarbeiten:
--   select name, email, umfang, anzahl, notiz, erstellt_am
--   from brig_ultra_anmeldungen where storniert_am is null order by erstellt_am;

-- 22.09.2026: Alter. Wer am Anlasstag unter 18 ist, meldet sich nur mit
-- Einverständnis eines Elternteils an; dessen Name, Telefon und E-Mail stehen
-- hier, der Zeitpunkt des Häkchens in eltern_einwilligung_am. Die Anmeldungen
-- vor diesem Datum haben volljaehrig = null (nie gefragt).
alter table public.brig_ultra_anmeldungen
  add column if not exists einwilligung_am        timestamptz,
  add column if not exists volljaehrig            boolean,
  add column if not exists alter_jahre            int,
  add column if not exists eltern_name            text,
  add column if not exists eltern_telefon         text,
  add column if not exists eltern_email           text,
  add column if not exists eltern_einwilligung_am timestamptz;
