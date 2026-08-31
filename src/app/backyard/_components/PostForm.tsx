"use client";

import { useEffect, useState } from "react";
import { FEED_API } from "@/app/backyard/_data/event";

const MAX = 240;

/**
 * Das Schreibfeld. Der Schlüssel steht im Link (/post?key=…) und wird im
 * Browser behalten – am Renntag um vier Uhr morgens sucht niemand den Link
 * noch einmal heraus. Der Name ebenso.
 */
export default function PostForm() {
  const [key, setKey] = useState<string | null>(null);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({ key, author, body }),
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

  if (key === null) {
    return (
      <p className="mt-10 border-t pt-8 text-[15px] leading-relaxed rule">
        You need the link with the key. Ask someone in the crew for it.
      </p>
    );
  }

  return (
    <form onSubmit={send} className="mt-10 border-t pt-8 rule">
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

      <label className="stamp mt-8 block">What is happening</label>
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
        {state === "sending" ? "Sending…" : state === "sent" ? "It is up" : "Post it"}
      </button>
    </form>
  );
}
