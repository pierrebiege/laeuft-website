-- YouTube Video Ideas - Masterplan 2026
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS youtube_videos (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  rating TEXT NOT NULL DEFAULT 'A' CHECK (rating IN ('S', 'A')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'scripted', 'filmed', 'edited', 'published')),
  cluster TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#888888',
  description TEXT,
  formula TEXT,
  week TEXT,
  setting TEXT NOT NULL DEFAULT 'keller' CHECK (setting IN ('keller', 'outdoor', 'challenge', 'collab', 'race')),
  arc_phase TEXT CHECK (arc_phase IN ('Prequel', 'Setup', 'Race Day', 'Aftermath')),
  arc_race TEXT,
  notes TEXT,
  publish_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_youtube_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER youtube_videos_updated_at
  BEFORE UPDATE ON youtube_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_youtube_videos_updated_at();

-- Index for week-based queries (cron job)
CREATE INDEX idx_youtube_videos_week ON youtube_videos(week);
CREATE INDEX idx_youtube_videos_status ON youtube_videos(status);

-- ============================================================
-- SEED DATA: All 78 planned videos
-- ============================================================
INSERT INTO youtube_videos (title, rating, cluster, color, description, formula, week, setting, arc_phase, arc_race) VALUES
-- W15: Launch
('Mein Weg zum Ultrarunner – die komplette Geschichte', 'S', 'Mindset & Story', '#ec4899', 'Origin-Video MUSS zuerst kommen', NULL, 'W15', 'keller', NULL, NULL),
('Tag 600: Warum ich fast aufgehört habe', 'S', 'Mindset & Story', '#ec4899', 'Stärkster Hook deines Channels', NULL, 'W15', 'keller', NULL, NULL),
-- W16: Lea Varner
('Meine Frau läuft ihren ersten Backyard Ultra', 'S', 'Varner Backyard (Lea)', '#f472b6', 'Paar-Content, Footage von März!', NULL, 'W16', 'race', 'Setup', 'Varner'),
('Lea vs. Backyard Ultra – Das komplette Rennen', 'S', 'Varner Backyard (Lea)', '#f472b6', 'Race-Footage von März sofort nutzen', NULL, 'W16', 'race', 'Race Day', 'Varner'),
-- W17: Wittiker Setup
('Was ist ein Backyard Ultra? Das brutalste Rennformat der Welt', 'S', 'Wittiker Backyard', '#22c55e', 'Evergreen-Explainer, kaum DE-Konkurrenz', NULL, 'W17', 'keller', 'Setup', 'Wittiker'),
('Meine Backyard-Strategie: Schlafen, Essen, Überleben', 'S', 'Wittiker Backyard', '#22c55e', 'Hohe Suchnachfrage, fast null Content', NULL, 'W17', 'keller', 'Setup', 'Wittiker'),
-- W18
('6 Wochen bis zum Backyard Ultra – so bereite ich mich vor', 'A', 'Wittiker Backyard', '#22c55e', 'Countdown-Serie', NULL, 'W18', 'keller', 'Setup', 'Wittiker'),
('Wie schläft man bei einem 48h-Rennen?', 'S', 'Wittiker Backyard', '#22c55e', 'Massives Suchinteresse', NULL, 'W18', 'keller', 'Setup', 'Wittiker'),
-- W19
('Was ich bei einem Backyard Ultra esse (10.000+ kcal)', 'S', 'Wittiker Backyard', '#22c55e', 'Full day of eating + Shock-Value', NULL, 'W19', 'keller', 'Setup', 'Wittiker'),
('Mein komplettes Race-Setup für den Wittiker Backyard', 'A', 'Wittiker Backyard', '#22c55e', 'Gear-Content mit Search-Intent', NULL, 'W19', 'keller', 'Setup', 'Wittiker'),
-- W20
('Vergiss Gels – probier dieses natürliche Race Fuel', 'A', 'Last Soul Ultra', '#ef4444', 'Identity-Formel', 'Identity', 'W20', 'keller', 'Aftermath', 'Last Soul'),
('Ich laufe jeden SBB-Halt ab', 'S', 'Challenges & Crossover', '#06b6d4', 'Kims Tram-Challenge für die Schweiz', NULL, 'W20', 'challenge', NULL, NULL),
-- W21: Wittiker Race
('Wittiker Backyard Ultra – Das komplette Rennen', 'S', 'Wittiker Backyard', '#22c55e', 'EIN starkes Video, kein Split', NULL, 'W21', 'race', 'Race Day', 'Wittiker'),
('Wittiker Backyard – Was ich gelernt habe', 'A', 'Wittiker Backyard', '#22c55e', 'Reflexion + Learnings', NULL, 'W21', 'keller', 'Aftermath', 'Wittiker'),
-- W22
('Backyard Ultra vs. Ultramarathon – was ist härter?', 'A', 'Wittiker Backyard', '#22c55e', 'Vergleichsformat', NULL, 'W22', 'keller', 'Aftermath', 'Wittiker'),
('ULTRARUNNER ERKLÄRT: Laufgewohnheiten die dich verletzen', 'S', 'Wittiker Backyard', '#22c55e', 'Authority-Formel (61x Outlier)', 'Authority 61x', 'W22', 'keller', 'Aftermath', 'Wittiker'),
-- W23: Last Soul Prequel
('Ich bin am Last Soul 2025 angetreten und es hat mich zerstört', 'S', 'Last Soul Ultra', '#ef4444', 'PREQUEL: Flashback 2025, emotional', NULL, 'W23', 'keller', 'Prequel', 'Last Soul'),
('Was ich beim Last Soul 2025 falsch gemacht habe', 'S', 'Last Soul Ultra', '#ef4444', 'Bridge 2025→2026', NULL, 'W23', 'keller', 'Prequel', 'Last Soul'),
-- W24: Collab + Evergreen
('Ich trainiere einen Tag mit Kim Gottwald', 'S', 'Collabs & Hybrid', '#f97316', 'FRÜH platziert = maximaler Boost', NULL, 'W24', 'collab', NULL, NULL),
('Warum Ultrarunning NICHT gesund ist', 'S', 'Mindset & Story', '#ec4899', 'Kontroverser Take, breiter Appeal', NULL, 'W24', 'keller', NULL, NULL),
-- W25
('Was ich an einem Trainingstag esse (Full Day of Eating)', 'S', 'Training & Wissenschaft', '#8b5cf6', 'Bewährtes Format', NULL, 'W25', 'keller', NULL, NULL),
('Was passiert mit deinem Körper bei einem 100km-Lauf?', 'S', 'Training & Wissenschaft', '#8b5cf6', 'Massives Suchvolumen, virales Potenzial', NULL, 'W25', 'keller', NULL, NULL),
-- W26
('Was Lea beim Varner gelernt hat (und was ICH als Crew)', 'A', 'Varner Backyard (Lea)', '#f472b6', 'Doppel-Perspektive nach dem Race', NULL, 'W26', 'keller', 'Aftermath', 'Varner'),
('Was passiert mit deinem Darm bei einem Ultra?', 'S', 'Training & Wissenschaft', '#8b5cf6', 'Schock + Wissenschaft', NULL, 'W26', 'keller', NULL, NULL),
-- W27
('Ultra-Laufen als Vater – Familie und Training', 'S', 'Mindset & Story', '#ec4899', 'Breiter Appeal', NULL, 'W27', 'keller', NULL, NULL),
('Koffein-Strategie beim Backyard Ultra', 'A', 'Training & Wissenschaft', '#8b5cf6', 'Spezifisch, hoher Nutzen', NULL, 'W27', 'keller', NULL, NULL),
-- W28: 99 Laps Setup
('99 Laps erklärt: Das brutalste Elimination-Rennen', 'S', '99 Laps', '#f59e0b', 'FIRST MOVER auf YouTube', NULL, 'W28', 'keller', 'Setup', '99 Laps'),
('Ich laufe gegen Andri Stöhle, Stefan Pütz & Co', 'S', '99 Laps', '#f59e0b', 'Name-Dropping, zieht Audiences', NULL, 'W28', 'keller', 'Setup', '99 Laps'),
-- W29
('Meine Strategie für ein Elimination Race', 'A', '99 Laps', '#f59e0b', 'Sprint oder Verstecken?', NULL, 'W29', 'keller', 'Setup', '99 Laps'),
('Die Mathe hinter 99 Laps', 'A', '99 Laps', '#f59e0b', 'Daten/Taktik-Content', NULL, 'W29', 'keller', 'Setup', '99 Laps'),
-- W30
('Ich trainiere mit Andri Stöhle vor 99 Laps', 'A', 'Collabs & Hybrid', '#f97316', 'Pre-Race Collab', NULL, 'W30', 'collab', NULL, NULL),
('Apple Watch Ultra vs. 20-CHF-Casio auf 100km', 'S', 'Training & Wissenschaft', '#8b5cf6', 'Tech-Crossover', NULL, 'W30', 'outdoor', NULL, NULL),
-- W31: 99 Laps Race
('99 Laps – Das komplette Rennen', 'S', '99 Laps', '#f59e0b', 'Race Vlog', NULL, 'W31', 'race', 'Race Day', '99 Laps'),
('99 Laps – Was ich daraus gelernt habe', 'A', '99 Laps', '#f59e0b', 'Recap + Überleitung Last Soul', NULL, 'W31', 'keller', 'Aftermath', '99 Laps'),
-- W32
('Elimination Race vs. Backyard Ultra – brutaler?', 'A', '99 Laps', '#f59e0b', 'Vergleich deiner Erfahrungen', NULL, 'W32', 'keller', 'Aftermath', '99 Laps'),
('20 Tage zwischen 99 Laps und Last Soul', 'A', '99 Laps', '#f59e0b', 'Bridge zu Last Soul', NULL, 'W32', 'keller', 'Aftermath', '99 Laps'),
-- W33: Last Soul Setup
('Last Soul Ultra 2026 – warum ich zurückgehe', 'S', 'Last Soul Ultra', '#ef4444', 'Redemption-Arc', NULL, 'W33', 'keller', 'Setup', 'Last Soul'),
('4 Wochen bis Last Soul – mein neuer Plan', 'A', 'Last Soul Ultra', '#ef4444', 'Was sich seit 2025 verändert hat', NULL, 'W33', 'keller', 'Setup', 'Last Soul'),
-- W34: Last Soul Race
('Last Soul Ultra 2026 – Das komplette Rennen', 'S', 'Last Soul Ultra', '#ef4444', 'MAIN EVENT Race Doku', NULL, 'W34', 'race', 'Race Day', 'Last Soul'),
('Last Soul hat alles verändert', 'S', 'Last Soul Ultra', '#ef4444', 'Emotional, Cliffhanger', NULL, 'W34', 'keller', 'Aftermath', 'Last Soul'),
-- W35
('Meine Frau und Kinder waren nicht dabei', 'A', 'Last Soul Ultra', '#ef4444', 'Einschulung vs. Race', NULL, 'W35', 'keller', 'Aftermath', 'Last Soul'),
('Last Soul 2025 vs. 2026 – der komplette Vergleich', 'A', 'Last Soul Ultra', '#ef4444', 'Schliesst den Redemption-Arc ab', NULL, 'W35', 'keller', 'Aftermath', 'Last Soul'),
-- W36-W40: Post-Race
('Schlafentzug beim Ultra: 30+ Stunden wach', 'S', 'Training & Wissenschaft', '#8b5cf6', 'Halluzinationen als Hook', NULL, 'W36', 'keller', NULL, NULL),
('50km nur mit Google Maps schlechteste Route', 'S', 'Challenges & Crossover', '#06b6d4', 'Fun, unberechenbar', NULL, 'W36', 'challenge', NULL, NULL),
('Was 100 Meilen mit deinem Gehirn machen', 'A', 'Training & Wissenschaft', '#8b5cf6', 'Neurowissenschaft', NULL, 'W37', 'keller', NULL, NULL),
('ChatGPT plant mein Ultra-Training 30 Tage', 'S', 'Challenges & Crossover', '#06b6d4', 'AI-Trend 2026', NULL, 'W37', 'outdoor', NULL, NULL),
('Meine grössten Fails als Läufer (Top 5)', 'A', 'Mindset & Story', '#ec4899', 'Listicle + Authentizität', NULL, 'W38', 'keller', NULL, NULL),
('Recovery-Routine nach 200km', 'A', 'Training & Wissenschaft', '#8b5cf6', 'Praktisch', NULL, 'W38', 'keller', NULL, NULL),
('COACH VERRÄT: Deine Zone-2-Daten sind falsch', 'S', 'Training & Wissenschaft', '#8b5cf6', 'Authority-Formel (61x)', 'Authority 61x', 'W39', 'keller', NULL, NULL),
('Nicht-Läufer reagieren auf Ultra-Content', 'A', 'Challenges & Crossover', '#06b6d4', 'Reaktionsformat', NULL, 'W39', 'keller', NULL, NULL),
('Ernährungstausch mit einem Bodybuilder', 'S', 'Challenges & Crossover', '#06b6d4', 'Collab, Gym-Audience', NULL, 'W40', 'collab', NULL, NULL),
('Hört auf Goggins zu schauen – fangt an zu laufen', 'A', 'Challenges & Crossover', '#06b6d4', 'Polarisiert', NULL, 'W40', 'keller', NULL, NULL),
-- W41-W44
('700 Tage Garmin-Schlafdaten in 12 Minuten', 'S', 'Training & Wissenschaft', '#8b5cf6', 'Compression-Formel (80x)', 'Compression 80x', 'W41', 'keller', NULL, NULL),
('Ich teste Kims Trainingsplan für eine Woche', 'A', 'Collabs & Hybrid', '#f97316', 'Ich teste X Format', NULL, 'W41', 'outdoor', NULL, NULL),
('Hör auf zu dehnen – mach DAS statt dessen', 'A', 'Training & Wissenschaft', '#8b5cf6', 'Contrarian', NULL, 'W42', 'keller', NULL, NULL),
('Die verrücktesten Ultraläufe der Welt', 'A', 'Challenges & Crossover', '#06b6d4', 'Listicle', NULL, 'W42', 'keller', NULL, NULL),
('Ich bin 35 – 10 Minuten, 10 Jahre Verletzungen gespart', 'A', 'Mindset & Story', '#ec4899', 'Mentor-Formel (6.8x)', 'Mentor 6.8x', 'W43', 'keller', NULL, NULL),
('Tagesablauf: IT-Firma, Ultra, Familie', 'A', 'Mindset & Story', '#ec4899', 'Day in the Life', NULL, 'W43', 'outdoor', NULL, NULL),
('90% aller Läufer trainieren zu schnell', 'S', 'Training & Wissenschaft', '#8b5cf6', 'Contrarian + Suchvolumen', NULL, 'W44', 'keller', NULL, NULL),
('Zone 2: Langsamer Laufen = schneller werden', 'S', 'Training & Wissenschaft', '#8b5cf6', 'Riesiges Keyword, Evergreen', NULL, 'W44', 'keller', NULL, NULL),
-- W45-W48
('Du hast genug Cardio. Fang an zu heben.', 'S', 'Challenges & Crossover', '#06b6d4', 'Identity-Formel (100x)', 'Identity 100x', 'W45', 'keller', NULL, NULL),
('Teure Laufschuhe sind ein Scam', 'A', 'Training & Wissenschaft', '#8b5cf6', 'Contrarian', NULL, 'W45', 'keller', NULL, NULL),
('Smartwatch für Recovery – die 2026-Methode', 'A', 'Training & Wissenschaft', '#8b5cf6', 'Novelty-Formel (11x)', 'Novelty 11x', 'W46', 'keller', NULL, NULL),
('Einfach weiterlaufen ist der dümmste Rat', 'A', 'Challenges & Crossover', '#06b6d4', 'Contrarian', NULL, 'W46', 'keller', NULL, NULL),
('Die wahren Kosten eines Ultralaufs', 'A', 'Mindset & Story', '#ec4899', 'Geld = Neugier', NULL, 'W47', 'keller', NULL, NULL),
('Easy Mode: Dein erster 50k', 'A', 'Mindset & Story', '#ec4899', 'Beginner-Content', 'Novelty 65x', 'W47', 'keller', NULL, NULL),
('Blueprint: Hybrid-Athlete-Körper', 'S', 'Collabs & Hybrid', '#f97316', 'Blueprint-Formel (100x)', 'Blueprint 100x', 'W48', 'keller', NULL, NULL),
('Verlierst du Muskeln beim Laufen?', 'A', 'Collabs & Hybrid', '#f97316', 'Identity-Formel, Gym', 'Identity', 'W48', 'keller', NULL, NULL),
-- W49-W50
('1000 Tage täglich laufen – Countdown', 'S', 'Mindset & Story', '#ec4899', 'Milestone: 31% mehr Engagement', NULL, 'W49', 'outdoor', NULL, NULL),
('Warum ich KEINE Marathons mehr laufe', 'A', 'Mindset & Story', '#ec4899', 'Contrarian', NULL, 'W49', 'keller', NULL, NULL),
('Mentale Tricks bei Kilometer 150', 'A', 'Mindset & Story', '#ec4899', 'Praktisch + Neugier', NULL, 'W50', 'keller', NULL, NULL),
('Subscriber bestimmen meinen 24h-Lauf', 'A', 'Collabs & Hybrid', '#f97316', 'Community-Engagement', NULL, 'W50', 'challenge', NULL, NULL),
-- W51-W53
('Jahresrückblick 2026: 3 Races, 1000 Tage', 'S', 'Evergreen', '#10b981', 'Dezember-Pflicht-Video', NULL, 'W51', 'keller', NULL, NULL),
('5 Jahre Ultrarunning-Wissen in 14 Minuten', 'A', 'Mindset & Story', '#ec4899', 'Compression (80x)', 'Compression 80x', 'W51', 'keller', NULL, NULL),
('Anfänger-Guide: Von 0 auf deinen ersten Ultra', 'S', 'Evergreen', '#10b981', 'Evergreen, Search-Traffic', NULL, 'W52', 'keller', NULL, NULL),
('Warum ich jeden Tag laufe', 'A', 'Evergreen', '#10b981', 'Persönlich', NULL, 'W52', 'keller', NULL, NULL),
('Race Season 2027 – was kommt', 'A', 'Evergreen', '#10b981', 'Cliffhanger', NULL, 'W53', 'keller', NULL, NULL),
('Schwer heben OHNE Laufen zu ruinieren', 'A', 'Training & Wissenschaft', '#8b5cf6', 'Gym-Crossover', NULL, 'W53', 'keller', NULL, NULL),
('30 Tage Hybrid Training als Ultrarunner', 'A', 'Last Soul Ultra', '#ef4444', 'Transformation-Format', 'Transformation', 'W20', 'outdoor', 'Aftermath', 'Last Soul');
