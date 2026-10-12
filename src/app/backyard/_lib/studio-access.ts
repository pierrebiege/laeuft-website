/**
 * Zugang zum Studio über einen geheimen Link (?k=…).
 *
 * Env STUDIO_KEYS, kommagetrennt «stufe:schlüssel», z. B.
 *   STUDIO_KEYS="team:abc123,all:def456"
 * «team» sieht nur die Team-Vorlagen, «all» zusätzlich Pierres Strava-Vorlagen.
 * Ohne passenden Schlüssel gibt es keine Seite.
 */
export type StudioAccess = "team" | "all" | null;

export function studioAccess(key: string | null | undefined): StudioAccess {
  if (!key) return null;
  for (const pair of (process.env.STUDIO_KEYS ?? "").split(",")) {
    const [level, secret] = pair.split(":").map((s) => s.trim());
    if (secret && secret === key && (level === "team" || level === "all")) return level;
  }
  return null;
}
