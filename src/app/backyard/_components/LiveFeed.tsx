"use client";

import { useCallback, useEffect, useState } from "react";
import { FEED_API } from "@/app/backyard/_data/event";

type Post = { id: string; created_at: string; author: string; body: string; kind: "human" | "auto" };

const since = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.floor(h / 24)} d ago`;
};

/**
 * Was die Leute vor Ort schreiben. Die Crew, das Team, wer den Link hat.
 *
 * Bewusst roh gehalten: Klartext, keine anklickbaren Links, keine Bilder.
 * Ein Feed, in den jeder mit dem Link schreiben kann, ist sonst innert
 * Stunden voll mit Werbung.
 */
export default function LiveFeed() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [open, setOpen] = useState(true);
  const [adminKey, setAdminKey] = useState<string | null>(null);

  // Moderation ohne eigene Seite: wer /live?admin=… aufruft, bekommt die
  // Knöpfe eingeblendet. Der Schlüssel wird behalten und aus der Adresse
  // genommen. Nachts um drei tippt niemand eine Kommandozeile.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("admin");
    if (fromUrl) {
      try { localStorage.setItem("byd-feed-admin", fromUrl); } catch { /* privates Fenster */ }
      setAdminKey(fromUrl);
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      try { setAdminKey(localStorage.getItem("byd-feed-admin")); } catch { setAdminKey(null); }
    }
  }, []);

  const load = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    try {
      const res = await fetch(FEED_API, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { open: boolean; posts: Post[] };
      setPosts(json.posts);
      setOpen(json.open);
    } catch {
      /* Der Feed ist Beiwerk. Fällt er aus, bleibt das Board stehen. */
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [load]);

  const moderate = async (payload: Record<string, unknown>) => {
    await fetch(FEED_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminKey, ...payload }),
    });
    load();
  };

  if (posts === null) return null;
  if (!open && posts.length === 0 && !adminKey) return null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b pb-4 rule">
        <span className="stamp">From the course</span>
        <span className="stamp flex items-center gap-4">
          {open ? "Crew, team and whoever has the link" : "Closed"}
          {adminKey && (
            <button
              onClick={() => moderate({ open: !open })}
              className="underline underline-offset-4"
              style={{ color: "var(--byd-accent)" }}
            >
              {open ? "close the feed" : "open it again"}
            </button>
          )}
        </span>
      </div>

      {posts.length === 0 ? (
        <p className="py-8 text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
          Nothing yet. On race day this fills up with whatever the crew shouts across
          the tent.
        </p>
      ) : (
        <ol>
          {posts.map((p) => (
            <li key={p.id} className="border-b py-5 rule">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="stamp" style={p.kind === "auto" ? { color: "var(--byd-accent)" } : undefined}>
                  {p.kind === "auto" ? "Timing" : p.author}
                </span>
                <span className="stamp tnum flex items-center gap-4">
                  {since(p.created_at)}
                  {adminKey && (
                    <button
                      onClick={() => moderate({ hide: p.id })}
                      className="underline underline-offset-4"
                      style={{ color: "var(--byd-accent)" }}
                    >
                      hide
                    </button>
                  )}
                </span>
              </div>
              <p className="mt-2 text-[15px] leading-relaxed">{p.body}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
