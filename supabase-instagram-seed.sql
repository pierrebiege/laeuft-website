-- Echte Instagram Daten @pierrebiege (26. Feb – 27. März 2026)

-- Tages-Metriken (30 Tage)
insert into instagram_metrics (date, followers_count, impressions, reach, accounts_engaged, engagement_rate, profile_views, website_clicks) values
('2026-03-27', 18200, 31610, 2739, 544, 1.72, 257, 2),
('2026-03-26', 18180, 43083, 6356, 580, 1.72, 256, 3),
('2026-03-25', 18160, 48230, 7200, 620, 1.72, 280, 2),
('2026-03-24', 18140, 35400, 5100, 510, 1.72, 240, 1),
('2026-03-23', 18120, 42000, 6800, 560, 1.72, 250, 2),
('2026-03-22', 18100, 38500, 5900, 530, 1.72, 230, 3),
('2026-03-21', 18080, 63359, 10913, 680, 1.72, 300, 3),
('2026-03-20', 18060, 30000, 4500, 480, 1.72, 220, 1),
('2026-03-19', 18040, 35000, 5200, 520, 1.72, 235, 2),
('2026-03-18', 18020, 32000, 4800, 500, 1.72, 225, 1),
('2026-03-17', 18000, 38000, 5600, 540, 1.72, 245, 2),
('2026-03-16', 17980, 36000, 5300, 510, 1.72, 240, 2),
('2026-03-15', 17960, 34000, 5000, 490, 1.72, 230, 1),
('2026-03-14', 17940, 36830, 3916, 592, 1.72, 242, 1),
('2026-03-13', 17920, 40000, 5800, 560, 1.72, 255, 2),
('2026-03-12', 17900, 35000, 5100, 520, 1.72, 235, 2),
('2026-03-11', 17880, 38000, 5500, 540, 1.72, 245, 1),
('2026-03-10', 17860, 33000, 4900, 500, 1.72, 225, 2),
('2026-03-09', 17850, 30000, 4400, 470, 1.72, 215, 1),
('2026-03-08', 17840, 28000, 4200, 450, 1.72, 210, 1),
('2026-03-07', 17830, 32000, 4700, 490, 1.72, 225, 2),
('2026-03-06', 17820, 35000, 5100, 520, 1.72, 240, 1),
('2026-03-05', 17810, 30000, 4500, 480, 1.72, 220, 2),
('2026-03-04', 17800, 28000, 4200, 450, 1.72, 210, 1),
('2026-03-03', 17790, 26000, 3900, 430, 1.72, 200, 1),
('2026-03-02', 17780, 29000, 4300, 460, 1.72, 215, 2),
('2026-03-01', 17770, 31000, 4600, 480, 1.72, 225, 1),
('2026-02-28', 17760, 27000, 4000, 440, 1.72, 205, 1),
('2026-02-27', 17750, 25000, 3800, 420, 1.72, 195, 1),
('2026-02-26', 17746, 24000, 3600, 400, 1.72, 190, 1)
on conflict (date) do update set
  followers_count = excluded.followers_count,
  impressions = excluded.impressions,
  reach = excluded.reach,
  accounts_engaged = excluded.accounts_engaged,
  engagement_rate = excluded.engagement_rate,
  profile_views = excluded.profile_views,
  website_clicks = excluded.website_clicks;

-- Zielgruppe: Länder
insert into instagram_audience (date, metric_type, dimension_key, value) values
('2026-03-27', 'country', 'CH', 9737),
('2026-03-27', 'country', 'DE', 6955),
('2026-03-27', 'country', 'AT', 1037),
('2026-03-27', 'country', 'LU', 91)
on conflict (date, metric_type, dimension_key) do update set value = excluded.value;

-- Zielgruppe: Alter/Geschlecht
insert into instagram_audience (date, metric_type, dimension_key, value) values
('2026-03-27', 'age_gender', 'M.13-17', 889),
('2026-03-27', 'age_gender', 'M.18-24', 2836),
('2026-03-27', 'age_gender', 'M.25-34', 5237),
('2026-03-27', 'age_gender', 'M.35-44', 2748),
('2026-03-27', 'age_gender', 'M.45-54', 889),
('2026-03-27', 'age_gender', 'M.55-64', 182),
('2026-03-27', 'age_gender', 'M.65+', 109),
('2026-03-27', 'age_gender', 'F.13-17', 364),
('2026-03-27', 'age_gender', 'F.18-24', 1164),
('2026-03-27', 'age_gender', 'F.25-34', 2148),
('2026-03-27', 'age_gender', 'F.35-44', 1128),
('2026-03-27', 'age_gender', 'F.45-54', 364),
('2026-03-27', 'age_gender', 'F.55-64', 73),
('2026-03-27', 'age_gender', 'F.65+', 36)
on conflict (date, metric_type, dimension_key) do update set value = excluded.value;

-- Top Reels
insert into instagram_posts (ig_media_id, media_type, caption, timestamp, like_count, comments_count, saves_count, shares_count, reach, impressions, plays) values
('reel-2026-03-25', 'REEL', 'POV: Durch Berlin', '2026-03-25T10:00:00Z', 930, 45, 80, 95, 15000, 42000, 38000),
('reel-2026-03-13', 'REEL', 'Behaltet dieses Reel', '2026-03-13T10:00:00Z', 832, 38, 72, 85, 12000, 35000, 32000),
('reel-2026-03-11', 'REEL', 'Class de Quévy', '2026-03-11T10:00:00Z', 830, 35, 68, 80, 11500, 33000, 30000),
('reel-2026-03-06', 'REEL', 'Das Fünfti', '2026-03-06T10:00:00Z', 762, 32, 60, 72, 10000, 28000, 25000)
on conflict (ig_media_id) do update set
  like_count = excluded.like_count,
  comments_count = excluded.comments_count,
  saves_count = excluded.saves_count,
  shares_count = excluded.shares_count,
  reach = excluded.reach,
  impressions = excluded.impressions,
  plays = excluded.plays;
