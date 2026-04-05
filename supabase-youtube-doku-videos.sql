-- Add Performance Media Wittiker Doku videos (2-Teiler)
-- These are IN ADDITION to Pierre's own Race Vlog
-- Run this in Supabase SQL Editor

INSERT INTO youtube_videos (title, rating, cluster, color, description, formula, week, setting, arc_phase, arc_race, production, producer) VALUES
('Wittiker Backyard Ultra – Wer ist Pierre? (Doku Teil 1)', 'S', 'Wittiker Backyard', '#22c55e', 'Performance Media 2-Teiler. Teil 1: Der Mensch vor dem Rennen. 15-20 Min. Pre-Interview, Anreise, Vorbereitung, Startschuss.', NULL, 'W23', 'race', 'Setup', 'Wittiker', 'extern', 'Performance Media'),
('Wittiker Backyard Ultra – Das Rennen (Doku Teil 2)', 'S', 'Wittiker Backyard', '#22c55e', 'Performance Media 2-Teiler. Teil 2: Der Verlauf, der Entscheid, die Reflexion. 20-30 Min. Post-Interview.', NULL, 'W24', 'race', 'Race Day', 'Wittiker', 'extern', 'Performance Media');
