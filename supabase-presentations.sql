-- Customer Presentations
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS presentations (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_logo_url TEXT,
  title TEXT,
  share_token TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed')),
  created_by TEXT,
  view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS presentations_slug_idx ON presentations(slug);

-- YFood Seed
INSERT INTO presentations (slug, customer_name, title, share_token, status, created_by, blocks)
VALUES (
  'yfood-2026',
  'YFood',
  'Events 2026 – Pierre Biege',
  'yf' || substr(md5(random()::text), 1, 16),
  'draft',
  'anes',
  '[
    {"type":"cover","title":"Events 2026","subtitle":"Pierre Biege – Schweizer Ultraläufer","image":"/presentations/yfood/cover.jpg"},
    {"type":"bio","heading":"Wer bin ich?","text":"Ultraläufer aus der Schweiz. Hybrid Athlete. Content Creator mit @pierrebiege. Gründer der IT-Firma läuft.ch. Ich teile meinen Weg zu den härtesten Backyard Ultras der Welt – ehrlich, ungefiltert, jeden Schritt.","image":"/presentations/yfood/bio.jpg","stats":[{"label":"Instagram","value":"15k+"},{"label":"YouTube","value":"1k+"},{"label":"Races 2026","value":"4"}]},
    {"type":"content-overview","heading":"Jeder Schritt zählt","channels":[{"icon":"youtube","name":"YouTube","reach":"2x pro Woche – Long-Form Doku"},{"icon":"instagram","name":"Instagram","reach":"Reels, Stories, Posts – täglich"},{"icon":"camera","name":"Bilder","reach":"Pro Race professionelles Shooting"},{"icon":"users","name":"Community","reach":"Engagierte Schweizer Lauf-Szene"}]},
    {"type":"race","name":"Wittikon Backyard Ultra","date":"14. Mai 2026","location":"Wittikon, Schweiz","description":"Der Auftakt der Saison. Backyard Format: jede Stunde 6.7km – bis nur einer übrig bleibt.","image":"/presentations/yfood/wittikon.jpg"},
    {"type":"race","name":"99 Lap Race","date":"25.–26. Juli 2026","location":"Schweiz","description":"99 Runden, 99 Stunden. Mental und physisch an die absolute Grenze.","image":"/presentations/yfood/99laps.jpg"},
    {"type":"race","name":"Last Soul Ultra","date":"14. August 2026","location":"International","description":"Das härteste Rennen der Welt. Redemption nach 2025. Das Saison-Highlight.","image":"/presentations/yfood/lastsoul.jpg"},
    {"type":"goal","heading":"Unser Ziel","text":"Eine ehrliche, ungefilterte Doku-Reise durch die Saison 2026. Authentisches Storytelling, das Marke und Athlet verbindet – mit echter Reichweite in der Schweizer Lauf-Community."},
    {"type":"team","heading":"Production Team","members":[{"name":"Pierre Biege","role":"Athlet & Creator"},{"name":"Performance Media","role":"Externe Doku-Produktion"},{"name":"Anes","role":"Management & Partnerships"}]},
    {"type":"offer","heading":"Was wir YFood bieten","bullets":["Logo-Integration in allen 4 Race-Dokus auf YouTube","Dedicated Reel pro Race auf Instagram","Product Placement im Race-Day Content","Co-Branded Posts vor jedem Race","Nennung in jeder Beschreibung & Outro"]},
    {"type":"contact","name":"Anes","email":"anes@laeuft.ch","phone":"+41 XX XXX XX XX"}
  ]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
