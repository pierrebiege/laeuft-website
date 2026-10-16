/**
 * Aus dem, was jemand im Notfall aus YouTube kopiert, die Einbettungsadresse
 * machen. Akzeptiert die üblichen Formen:
 *
 *   youtube.com/live/ID · youtube.com/watch?v=ID · youtu.be/ID
 *   youtube.com/embed/ID · youtube.com/shorts/ID · nur die ID
 *   youtube.com/channel/UC…(/live) → läuft immer auf den aktuellen Stream des Kanals
 *
 * Gibt null zurück, wenn nichts davon passt. Läuft im Browser und auf dem Server.
 */
const ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeEmbed(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  if (ID.test(raw)) return `https://www.youtube.com/embed/${raw}?autoplay=1&mute=1&playsinline=1`;

  let u: URL;
  try {
    u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  const parts = u.pathname.split("/").filter(Boolean);
  let id: string | null = null;

  if (host === "youtu.be") id = parts[0] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parts[0] === "watch") id = u.searchParams.get("v");
    else if (["live", "embed", "shorts", "v"].includes(parts[0] ?? "")) id = parts[1] ?? null;
    else if (parts[0] === "channel" && parts[1]?.startsWith("UC")) {
      return `https://www.youtube.com/embed/live_stream?channel=${parts[1]}&autoplay=1&mute=1&playsinline=1`;
    }
  }
  return id && ID.test(id) ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1` : null;
}

/** Die normale Seite auf YouTube zum selben Einbettungslink (für «auf YouTube öffnen»). */
export function youtubeWatch(embed: string): string {
  const u = new URL(embed);
  const channel = u.searchParams.get("channel");
  if (channel) return `https://www.youtube.com/channel/${channel}/live`;
  return `https://www.youtube.com/watch?v=${u.pathname.split("/").pop()}`;
}
