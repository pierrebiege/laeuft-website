"use client";

import { useEffect, useState } from "react";
import { FEED_API } from "@/app/backyard/_data/event";

const MAX = 240;

/**
 * Das Schreibfeld. Offen für alle: wer anfeuern will, braucht nichts.
 *
 * Der Schlüssel aus /post?key=… ist optional und kennzeichnet die Crew –
 * deren Meldungen von der Strecke stehen im selben Feed, aber als solche
 * erkennbar. Er wird im Browser behalten, damit am Renntag um vier Uhr
 * morgens niemand den Link noch einmal heraussuchen muss. Der Name auch.
 */
export default function PostForm() {
  const [key, setKey] = useState<string | null>(null);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  /** Honigtopf: unsichtbar, und wenn hier etwas steht, war es kein Mensch. */
  const [website, setWebsite] = useState("");

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("key");
    if (fromUrl) {
      try { localStorage.setItem("byd-feed-key", fromUrl); } catch { /* privates Fenster */ }
      setKey(fromUrl);
      // Den Schlüssel aus der Adresszeile nehmen, damit er nicht in
      // Screenshots und Verläufen landet.
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      try { setKey(localStorage.getItem("byd-feed-key")); } catch { setKey(null); }
    }
    try { setAuthor(localStorage.getItem("byd-feed-author") ?? ""); } catch { /* egal */ }
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !author.trim()) return;
    setState("sending");
    setError(null);
    try {
      const res = await fetch(FEED_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key ?? undefined, author, body, website }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not send.");
      try { localStorage.setItem("byd-feed-author", author.trim()); } catch { /* egal */ }
      setBody("");
      setState("sent");
      setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send.");
      setState("idle");
    }
  };

  return (
    <form onSubmit={send} className="mt-10 border-t pt-8 rule">
      {key && <p className="stamp mb-6" style={{ color: "var(--byd-accent)" }}>Crew — your posts are marked as from the course</p>}

      <label className="stamp block">Your name</label>
      <input
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        maxLength={24}
        required
        autoComplete="nickname"
        className="mt-2 w-full border-b bg-transparent py-2 text-[17px] outline-none rule"
        style={{ color: "var(--byd-fg)" }}
      />

      {/* Für Menschen unsichtbar, für einfache Skripte verlockend. */}
      <input
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1 }}
      />

      <label className="stamp mt-8 block">{key ? "What is happening" : "Your message"}</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX))}
        rows={3}
        required
        className="mt-2 w-full resize-none border-b bg-transparent py-2 text-[17px] leading-relaxed outline-none rule"
        style={{ color: "var(--byd-fg)" }}
      />
      <div className="mt-2 flex items-baseline justify-between">
        <span className="stamp tnum">{MAX - body.length}</span>
        {error && <span className="stamp" style={{ color: "var(--byd-accent)" }}>{error}</span>}
      </div>

      <button
        type="submit"
        disabled={state === "sending" || !body.trim() || !author.trim()}
        className="mt-8 w-full border px-6 py-4 text-[13px] font-semibold uppercase tracking-[0.08em] disabled:opacity-40"
        style={{ background: "var(--byd-accent)", color: "#fff", borderColor: "var(--byd-accent)" }}
      >
        {state === "sending" ? "Sending…" : state === "sent" ? "It is up — thank you" : "Send it"}
      </button>
    </form>
  );
}
