-- Prospect-Daten aus Apple Mail (pierre@laeuft.ch) importiert
-- Stand: 26.02.2026

INSERT INTO prospects (company, contact_name, email, website, status, notes, email_1_sent_at, email_2_sent_at, responded_at, created_at) VALUES

-- 1. Pizzeria Giardino – Pascal hat geantwortet, Follow-up Mitte März
('Pizzeria Giardino', 'Pascal', 'info@pizzeriagiardino.ch', 'https://pizzeriagiardino.ch', 'geantwortet',
 'Prototyp: giardino-gilt.vercel.app + Tischreservation: tablereservation-beta.vercel.app. Pascal: "Ist schon mal der richtige Weg. Bitte gib uns Zeit, denke Mitte März." Follow-up Mitte März.',
 '2026-01-13T18:38:00+01:00', '2026-02-09T16:24:00+01:00', '2026-02-13T23:10:00+01:00', '2026-01-13T18:38:00+01:00'),

-- 2. Vouilloz Weine – Petra prüft Prototyp mit Michel
('Vouilloz Weine', 'Petra Vouilloz', 'info@weinevouilloz.ch', 'https://weinevouilloz.ch', 'geantwortet',
 'Prototyp: vouilloz.vercel.app. Petra: "Schaue mir das in den nächsten Tagen mit Michel an und melde mich."',
 '2026-01-31T22:40:00+01:00', NULL, '2026-02-03T07:49:00+01:00', '2026-01-31T22:40:00+01:00'),

-- 3. Varonier Weine – keine Antwort
('Varonier Weine', 'Familie Varonier', 'c@varonier.ch', 'https://varonier.ch', 'kontaktiert',
 'Prototyp: vaornier.vercel.app. Keine Antwort erhalten.',
 '2026-02-01T22:32:00+01:00', NULL, NULL, '2026-02-01T22:32:00+01:00'),

-- 4. NETKUM AG – Manfred Kummer, BNI-Kontakt, Meeting wird geplant
('NETKUM AG', 'Manfred Kummer', 'manfred.kummer@netkum.ch', 'https://netkum.ch', 'geantwortet',
 'BNI-Kontakt. Manfred hat sich gemeldet, Treffen im Büro wird geplant. Software/Webdesign – mögliche Zusammenarbeit statt Konkurrenz.',
 '2026-02-03T07:33:00+01:00', NULL, '2026-02-03T07:33:00+01:00', '2026-02-03T07:33:00+01:00'),

-- 5. Chanton Kellerei – keine Antwort
('Chanton Kellerei', 'Familie Chanton', 'weine@chanton.ch', 'https://chanton.ch', 'kontaktiert',
 'Prototyp: chanton.vercel.app. Historische Kellerei mit seltenen Rebsorten (Gwäss, Himbertscha). Keine Antwort.',
 '2026-02-05T00:37:00+01:00', NULL, NULL, '2026-02-05T00:37:00+01:00'),

-- 6. Naturpark Pfyn-Finges – nur Auto-Reply
('Naturpark Pfyn-Finges', 'M. Gaspoz', 'm.gaspoz@pfyn-finges.ch', 'https://pfyn-finges.ch', 'kontaktiert',
 'Prototyp: pfynwald.vercel.app. Auch an admin@pfyn-finges.ch gesendet. Nur automatische Antwort erhalten.',
 '2026-02-05T09:52:00+01:00', NULL, NULL, '2026-02-05T09:52:00+01:00'),

-- 7. La Poste Visp – Nadja Studer (Direktorin) hat geantwortet, Vergabeverfahren
('La Poste Visp', 'Nadja Studer', 'laposte@visp.ch', 'https://laposte-ten.vercel.app', 'geantwortet',
 'Prototyp: laposte-ten.vercel.app. Nadja (Direktorin, 15 Jahre La Poste): Gemeinde hat externen Auftrag vergeben für Info/Buchungssystem. Bedarfsanalyse läuft. Öffentliches Vergabeverfahren – Pierre wird eingeladen.',
 '2026-02-11T18:09:00+01:00', NULL, '2026-02-18T16:52:00+01:00', '2026-02-11T18:09:00+01:00'),

-- 8. Abgottspon-Werlen Architekten – keine Antwort
('Abgottspon-Werlen', 'Pascal Abgottspon', 'p.abgottspon@abgottspon-werlen.ch', NULL, 'kontaktiert',
 'Prototyp: architektur-bice.vercel.app. International publiziert (Elle Decor Italia, NZZ, Monocle). Auch an b.werlen@abgottspon-werlen.ch gesendet. Keine Antwort.',
 '2026-02-12T22:08:00+01:00', NULL, NULL, '2026-02-12T22:08:00+01:00'),

-- 9. ungeskriptet (Podcast) – keine Antwort, Teambewerbung
('ungeskriptet', 'Ben', 'ben@ungeskriptet.com', 'https://ungeskriptet.com', 'kontaktiert',
 'Prototyp: unscriptet.vercel.app. Teambewerbung als Webentwickler, nicht klassische Kaltakquise. Keine Antwort.',
 '2026-02-15T00:47:00+01:00', NULL, NULL, '2026-02-15T00:47:00+01:00'),

-- 10. Centerpark Visp – Email gebounced
('Centerpark Visp', 'Centerpark Team', 'info@centerpark.ch', 'https://centerpark.ch', 'neu',
 'Prototyp: centerpark.vercel.app. EMAIL GEBOUNCED – "554 5.7.1 Relay access denied". Neue E-Mail-Adresse nötig.',
 NULL, NULL, NULL, '2026-02-17T16:08:00+01:00'),

-- 11. Gemeinde Albinen – Offerte CHF 4700, Lukas prüft
('Gemeinde Albinen', 'Lukas Grand', 'lukas.grand@albinen.ch', 'https://albinen.ch', 'geantwortet',
 'Offerte CHF 4''700 (Pauschal) gesendet, gültig bis 31.3.2026. Lukas: "Zum Verständnis: Pauschalangebot?" → Pierre bestätigt. Wird dem Gemeinderat vorgelegt.',
 '2026-02-25T08:29:00+01:00', NULL, '2026-02-25T08:37:00+01:00', '2026-02-25T08:29:00+01:00');
