-- Doku «Wem gehört Parkour?» — Beiträge der Szene (laeuft.ch/parkour), 23.10.2026.
-- Projekt lsawtepdcsjegbxflmyc. Rein additiv: neue Tabelle + neuer privater Bucket.
-- Geschrieben nur vom Service-Role-Key in src/app/api/parkour/beitrag/**.
-- Gelesen nur im Admin (/admin/parkour) über /api/admin/db (Service-Role, Admin-Session).
-- RLS an und bewusst KEINE Policy: anon und authenticated kommen nicht heran.

create table if not exists public.parkour_beitraege (
  id                uuid primary key default gen_random_uuid(),
  erstellt_am       timestamptz not null default now(),
  art               text not null check (art in ('video', 'material', 'hinweis')),
  sprache           text not null default 'de' check (sprache in ('de', 'fr')),
  name              text not null,
  kontakt           text not null,          -- E-Mail oder Instagram
  gruppe_ort        text,
  jahre             text,
  wer_zu_sehen      text,
  beschreibung      text,
  link              text,                   -- WeTransfer, Drive, YouTube …
  offline_material  boolean not null default false,  -- liegt auf Festplatte/Kassette
  hinweis           text,
  antworten         jsonb not null default '{}'::jsonb,  -- offene Fragen (wettkampf, wer_gebracht, zukunft)
  dateien           jsonb not null default '[]'::jsonb,  -- [{pfad, name, groesse, typ, angekommen}]
  status            text not null default 'eingegangen'
                    check (status in ('hochladen', 'eingegangen', 'unvollstaendig')),
  einverstaendnis_am timestamptz not null,
  schluessel_hash   text,                   -- sha256 des Abschluss-Schlüssels (Upload fertig melden)
  ip_hash           text,                   -- für die Ratenbegrenzung, keine Klar-IP
  erledigt          boolean not null default false,
  notiz_intern      text
);

create index if not exists parkour_beitraege_erstellt_idx on public.parkour_beitraege (erstellt_am desc);
create index if not exists parkour_beitraege_ip_idx on public.parkour_beitraege (ip_hash, erstellt_am);

alter table public.parkour_beitraege enable row level security;

-- Privater Bucket für Videos, Fotos, PDFs. Grösse pro Datei = globale
-- Projektgrenze (Settings → Storage, Stand 23.10.2026: 50 MB).
-- Hochgeladen wird nur über signierte Upload-URLs aus der API-Route,
-- gelesen nur über signierte Download-URLs im Admin. Keine Storage-Policy.
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('parkour-doku', 'parkour-doku', false, array['video/*', 'image/*', 'application/pdf'])
on conflict (id) do nothing;

-- Übersicht:
--   select erstellt_am, art, name, kontakt, gruppe_ort, jahre, status, jsonb_array_length(dateien) as dateien
--   from parkour_beitraege order by erstellt_am desc;
