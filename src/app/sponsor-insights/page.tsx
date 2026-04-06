"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, BarChart3, ExternalLink } from "lucide-react";

const STORAGE_KEY = "laeuft_sponsor_insights_unlocked";
// Passwort hier ändern wenn nötig:
const PASSWORD = "laeuft2026";

export default function SponsorInsightsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1") {
      setUnlocked(true);
    }
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <form onSubmit={submit} className="max-w-sm w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-8">
            <Lock size={24} />
          </div>
          <h1 className="text-3xl font-bold mb-3">Insights</h1>
          <p className="text-white/60 mb-10 text-sm">Geschützter Bereich. Bitte Passwort eingeben.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="Passwort"
            autoFocus
            className={`w-full px-5 py-4 bg-white/5 border ${error ? "border-red-500" : "border-white/20"} rounded-2xl text-center text-lg focus:outline-none focus:border-white/60 transition-colors`}
          />
          {error && <p className="text-red-400 text-sm mt-3">Falsches Passwort</p>}
          <button type="submit" className="mt-6 w-full px-6 py-4 bg-white text-black rounded-2xl font-semibold hover:bg-white/90 transition-colors">
            Zugriff
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 size={20} />
          <span className="font-semibold">Pierre Biege · Live Insights</span>
        </div>
        <Link href="https://www.instagram.com/pierrebiege" target="_blank" className="text-sm text-white/60 hover:text-white flex items-center gap-2">
          @pierrebiege <ExternalLink size={14} />
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-16">
        <div className="mb-20">
          <div className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4">Stand April 2026</div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.9]">
            Reichweite, die<br />Geschichten erzählt.
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-white/10 rounded-3xl overflow-hidden mb-10">
          <Stat label="Instagram Follower" value="15.2k" trend="+8% / Monat" />
          <Stat label="Reach (30 Tage)" value="284k" trend="+22% / Monat" />
          <Stat label="Engagement Rate" value="6.8%" trend="Top 3% Sport" />
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-white/10 rounded-3xl overflow-hidden mb-20">
          <Stat label="YouTube Subscribers" value="1.1k" trend="Wachstum 2026" />
          <Stat label="YouTube Views (30d)" value="42k" trend="+150% YoY" />
          <Stat label="Story Avg. Views" value="3.4k" trend="22% der Follower" />
          <Stat label="Inner Circle (WhatsApp)" value="180+" trend="Hardcore Fans" />
        </div>

        <section className="mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-10">Audience</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card title="Top Country" value="Schweiz" sub="68% der Reach" />
            <Card title="Alter" value="25–44" sub="71% der Audience" />
            <Card title="Gender" value="62% / 38%" sub="Männlich / Weiblich" />
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-10">Top Content 2026</h2>
          <div className="space-y-px bg-white/10 rounded-3xl overflow-hidden">
            <Row rank="01" title="Last Soul Ultra 2025 – Was ich gelernt habe" reach="58.2k" engagement="9.4%" />
            <Row rank="02" title="40 Stunden ohne Schlaf – So fühlt sich Backyard an" reach="42.7k" engagement="8.1%" />
            <Row rank="03" title="Mein Trainingstag mit Lea" reach="38.1k" engagement="11.2%" />
            <Row rank="04" title="Race Vlog Wittikon Recap" reach="31.5k" engagement="7.8%" />
            <Row rank="05" title="Hybrid Athlete – Was bedeutet das wirklich?" reach="28.9k" engagement="6.5%" />
          </div>
        </section>

        <p className="text-xs text-white/40 text-center">
          Daten Stand April 2026. Aktuelle Zahlen jederzeit auf Anfrage.
        </p>
      </main>
    </div>
  );
}

function Stat({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <div className="bg-black p-10">
      <div className="text-xs uppercase tracking-wider text-white/40 mb-3">{label}</div>
      <div className="text-5xl md:text-6xl font-bold tabular-nums mb-2">{value}</div>
      <div className="text-sm text-green-400">{trend}</div>
    </div>
  );
}

function Card({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
      <div className="text-xs uppercase tracking-wider text-white/40 mb-3">{title}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-white/60">{sub}</div>
    </div>
  );
}

function Row({ rank, title, reach, engagement }: { rank: string; title: string; reach: string; engagement: string }) {
  return (
    <div className="bg-black px-6 py-5 flex items-center gap-6 hover:bg-zinc-900 transition-colors">
      <span className="text-2xl font-bold text-white/30 tabular-nums w-12">{rank}</span>
      <span className="flex-1 font-medium">{title}</span>
      <span className="text-sm text-white/60 tabular-nums w-20 text-right">{reach}</span>
      <span className="text-sm text-green-400 tabular-nums w-16 text-right">{engagement}</span>
    </div>
  );
}
