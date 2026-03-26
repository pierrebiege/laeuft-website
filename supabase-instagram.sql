-- Instagram Insights Dashboard Schema
-- Run this in Supabase SQL Editor

-- Daily account-level metrics
create table instagram_metrics (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  followers_count integer not null,
  follows_count integer,
  media_count integer,
  impressions integer,
  reach integer,
  profile_views integer,
  website_clicks integer,
  accounts_engaged integer,
  engagement_rate numeric(5,4),
  created_at timestamptz default now()
);
create index idx_ig_metrics_date on instagram_metrics(date desc);

-- Per-media metrics
create table instagram_posts (
  id uuid primary key default gen_random_uuid(),
  ig_media_id text not null unique,
  media_type text not null,
  media_url text,
  thumbnail_url text,
  permalink text,
  caption text,
  timestamp timestamptz not null,
  like_count integer default 0,
  comments_count integer default 0,
  saves_count integer default 0,
  shares_count integer default 0,
  reach integer default 0,
  impressions integer default 0,
  plays integer,
  engagement_rate numeric(5,4),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_ig_posts_timestamp on instagram_posts(timestamp desc);

-- Daily demographic snapshots
create table instagram_audience (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  metric_type text not null,
  dimension_key text not null,
  value integer not null,
  created_at timestamptz default now(),
  unique(date, metric_type, dimension_key)
);
create index idx_ig_audience_date on instagram_audience(date desc, metric_type);

-- Dashboard configuration (singleton)
create table dashboard_config (
  id uuid primary key default gen_random_uuid(),
  account_name text default '@einrichtiggutertag',
  account_bio text,
  profile_image_url text,
  hero_headline text,
  hero_subtext text,
  contact_cta_text text,
  contact_email text,
  partner_logos jsonb default '[]',
  custom_css jsonb,
  updated_at timestamptz default now()
);

-- Insert default config
insert into dashboard_config (account_name, account_bio, hero_headline, hero_subtext, contact_cta_text, contact_email, partner_logos)
values (
  '@einrichtiggutertag',
  'Ultrarunner & Content Creator aus der Schweiz. Berge, Trails & echte Geschichten.',
  'Pierre Biege',
  'Ultrarunner · Content Creator · 18k Community',
  'Interesse an einer Zusammenarbeit?',
  'pierre@laeuft.ch',
  '[{"name":"SPONSER","url":"https://sponser.ch","image_url":"/dashboard/logos/sponser.svg"},{"name":"feels.like","url":"https://feelslike.ch","image_url":"/dashboard/logos/feelslike.svg"},{"name":"DRYLL","url":"https://dryll.ch","image_url":"/dashboard/logos/dryll.svg"},{"name":"Scott Sports","url":"https://scott-sports.com","image_url":"/dashboard/logos/scott.svg"}]'
);

-- Access tokens for sponsors
create table dashboard_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  label text not null,
  is_active boolean default true,
  expires_at timestamptz,
  views_count integer default 0,
  last_viewed_at timestamptz,
  created_at timestamptz default now()
);
create index idx_dashboard_tokens_token on dashboard_tokens(token);

-- RLS Policies
alter table instagram_metrics enable row level security;
alter table instagram_posts enable row level security;
alter table instagram_audience enable row level security;
alter table dashboard_config enable row level security;
alter table dashboard_tokens enable row level security;

-- Public read for metrics, posts, audience, config (accessed via API routes with service role)
-- No anon access needed since we use supabaseAdmin in API routes
