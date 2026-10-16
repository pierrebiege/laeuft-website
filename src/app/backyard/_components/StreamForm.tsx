"use client";

import { useEffect, useState } from "react";
import { STREAM_API } from "@/app/backyard/_data/event";
import { youtubeEmbed } from "@/app/backyard/_lib/stream";

/**
 * Formular für die Regie (Patrick, Pierre, Team): YouTube-Link einfügen,
 * speichern, fertig. Startseite und /live holen den Link alle 30 Sekunden
 * neu, also ist ein Wechsel ohne Deploy und ohne Neuladen bei allen sichtbar.
 * Deutsch, weil nur das Team diese Seite sieht.
 */
export default function StreamForm() {
  const [key, setKey] = useState<string | null>(null);
  const [current, setCurrent] = useState<{ url: string | null; updatedAt: string | null } | null>(null);
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("k");
    if (fromUrl) {
      try { localStorage.setItem("byd-stream-key", fromUrl); } catch { /* privates Fenster */ }
      setKey(fromUrl);
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      try { setKey(localStorage.getItem("byd-stream-key")); } catch { setKey(null); }
    }
    load();
  }, []);

  async function load() {
    const res = await fetch(STREAM_API, { cache: "no-store" }).catch(() => null);
    if (res?.ok) {
      const json = await res.json();
      setCurrent({ url: json.url, updatedAt: json.updatedAt });
    }
  }

  async function save(url: string) {
    setBusy(true);
    setMsg(null);
    const res = await fetch(STREAM_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, url }),
    }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok) {
      setMsg({ ok: false, text: json.error ?? "Keine Verbindung. Nochmals versuchen." });
      return;
    }
    setMsg({ ok: true, text: url ? "Gespeichert. In spätestens 30 Sekunden bei allen sichtbar." : "Stream ausgeblendet." });
    setValue("");
    load();
  }

  if (!key) {
    return (
      <p className="text-[15px]">
        Diese Seite braucht den Regie-Link mit Schlüssel (…/regie?k=…).
      </p>
    );
  }

  const preview = youtubeEmbed(value);
  const live = youtubeEmbed(current?.url);

  return (
    <div>
      <h1 className="display text-[2rem] sm:text-5xl">Livestream</h1>
      <p className="mt-6 text-[15px] leading-relaxed" style={{ color: "var(--byd-mute)" }}>
        Offizieller Link für alle: <strong>swiss-backyardultra.ch</strong>. Welcher YouTube-Stream dort
        läuft, stellst du hier ein. Bricht der Stream ab und YouTube gibt eine neue Adresse: neuen
        Link einfügen, speichern, fertig. Startseite und Live-Seite wechseln innert 30 Sekunden.
      </p>

      <div className="mt-10 border-t pt-6 rule">
        <p className="stamp">Läuft jetzt</p>
        <p className="mt-3 break-all text-[15px]">{current?.url ?? "Kein Stream eingestellt (auf der Seite ausgeblendet)."}</p>
        {current?.updatedAt && (
          <p className="mt-1 text-xs" style={{ color: "var(--byd-mute)" }}>
            Geändert {new Date(current.updatedAt).toLocaleString("de-CH")}
          </p>
        )}
        {live && (
          <div className="relative mt-4 aspect-video w-full overflow-hidden border rule" style={{ background: "#000" }}>
            <iframe src={live} title="Aktueller Stream" className="absolute inset-0 h-full w-full" allow="autoplay; encrypted-media" />
          </div>
        )}
      </div>

      <form
        className="mt-10 border-t pt-6 rule"
        onSubmit={(e) => { e.preventDefault(); if (preview) save(value); }}
      >
        <label className="stamp" htmlFor="yt">Neuer YouTube-Link</label>
        <input
          id="yt"
          type="text"
          inputMode="url"
          autoComplete="off"
          value={value}
          onChange={(e) => { setValue(e.target.value); setMsg(null); }}
          placeholder="https://www.youtube.com/live/…"
          className="mt-3 block w-full border bg-transparent px-4 py-3 text-[15px] rule"
        />
        {value && !preview && (
          <p className="mt-2 text-sm" style={{ color: "var(--byd-accent)" }}>
            Diesen Link kann ich nicht lesen. Am besten auf YouTube «Teilen» → Link kopieren.
          </p>
        )}
        <button
          type="submit"
          disabled={!preview || busy}
          className="mt-4 w-full border px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.08em] disabled:opacity-40 sm:w-auto"
          style={{ background: "var(--byd-accent)", color: "#fff", borderColor: "var(--byd-accent)" }}
        >
          {busy ? "Speichert …" : "Speichern"}
        </button>
        {msg && (
          <p className="mt-4 text-[15px]" style={{ color: msg.ok ? undefined : "var(--byd-accent)" }}>{msg.text}</p>
        )}
      </form>

      <div className="mt-14 border-t pt-6 rule">
        <button
          type="button"
          onClick={() => { if (confirm("Stream auf der Seite ausblenden?")) save(""); }}
          className="stamp underline underline-offset-4"
        >
          Stream ausblenden
        </button>
      </div>
    </div>
  );
}
