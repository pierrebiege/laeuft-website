"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, CalendarDays, LayoutGrid, Film, Plus, Trash2, X, Save,
  Mountain, Zap, Flame, Brain, Heart, Rocket, Users, Star,
  Home, TreePine, Target, Handshake, Flag,
} from "lucide-react";

type VideoStatus = "open" | "scripted" | "filmed" | "edited" | "published";
type Rating = "S" | "A";
type Setting = "keller" | "outdoor" | "challenge" | "collab" | "race";
type Production = "inhouse" | "extern";
type ViewMode = "calendar" | "clusters" | "arcs";

interface Partner {
  id: string;
  name: string;
  partner_type: string;
  status: string;
}

interface Video {
  id: number;
  title: string;
  rating: Rating;
  status: VideoStatus;
  cluster: string;
  color: string;
  description: string | null;
  formula: string | null;
  week: string | null;
  setting: Setting;
  arc_phase: string | null;
  arc_race: string | null;
  notes: string | null;
  publish_date: string | null;
  partner_id: string | null;
  partner: Partner | null;
  production: Production;
  producer: string | null;
}

const STATUS_CONFIG: Record<VideoStatus, { label: string; color: string; bg: string }> = {
  open: { label: "Offen", color: "text-zinc-500", bg: "bg-zinc-100 dark:bg-zinc-800" },
  scripted: { label: "Skript", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
  filmed: { label: "Gefilmt", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
  edited: { label: "Geschnitten", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950" },
  published: { label: "Live", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
};

const SETTING_CONFIG: Record<Setting, { label: string; icon: React.ElementType; emoji: string }> = {
  keller: { label: "Keller", icon: Home, emoji: "🏠" },
  outdoor: { label: "Outdoor", icon: TreePine, emoji: "🏔️" },
  challenge: { label: "Challenge", icon: Target, emoji: "🎯" },
  collab: { label: "Collab", icon: Handshake, emoji: "🤝" },
  race: { label: "Race Day", icon: Flag, emoji: "🏁" },
};

const CLUSTERS = [
  "Wittiker Backyard", "Varner Backyard (Lea)", "99 Laps", "Last Soul Ultra",
  "Training & Wissenschaft", "Mindset & Story", "Challenges & Crossover", "Collabs & Hybrid", "Evergreen",
];

const CLUSTER_COLORS: Record<string, string> = {
  "Wittiker Backyard": "#22c55e", "Varner Backyard (Lea)": "#f472b6", "99 Laps": "#f59e0b",
  "Last Soul Ultra": "#ef4444", "Training & Wissenschaft": "#8b5cf6", "Mindset & Story": "#ec4899",
  "Challenges & Crossover": "#06b6d4", "Collabs & Hybrid": "#f97316", "Evergreen": "#10b981",
};

const RACES = [
  { name: "Wittiker Backyard", date: "2026-05-14", color: "#22c55e" },
  { name: "Varner Backyard (Lea)", date: "2026-06-27", color: "#f472b6" },
  { name: "99 Laps", date: "2026-07-25", color: "#f59e0b" },
  { name: "Last Soul Ultra", date: "2026-08-14", color: "#ef4444" },
];

function getWeekLabel(week: string): string {
  const wNum = parseInt(week.replace("W", ""));
  const start = new Date(2026, 3, 6);
  start.setDate(start.getDate() + (wNum - 15) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.getDate()}.${start.getMonth() + 1}. – ${end.getDate()}.${end.getMonth() + 1}.`;
}

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export default function YouTubePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("calendar");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VideoStatus>("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [dragVideoId, setDragVideoId] = useState<number | null>(null);
  const [dragOverWeek, setDragOverWeek] = useState<string | null>(null);
  const [newVideo, setNewVideo] = useState({ title: "", cluster: CLUSTERS[0], rating: "A" as Rating, setting: "keller" as Setting, week: "", description: "", formula: "", arc_phase: "", arc_race: "", partner_id: "", production: "inhouse" as Production, producer: "" });

  const fetchVideos = useCallback(async () => {
    const [vRes, pRes] = await Promise.all([
      fetch("/api/youtube"),
      fetch("/api/partners"),
    ]);
    if (vRes.ok) setVideos(await vRes.json());
    if (pRes.ok) {
      const pData = await pRes.json();
      setPartners(Array.isArray(pData) ? pData : pData.partners || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  async function updateVideo(id: number, updates: Partial<Video>) {
    const res = await fetch("/api/youtube", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    }
  }

  async function deleteVideo(id: number) {
    if (!confirm("Video-Idee wirklich löschen?")) return;
    const res = await fetch(`/api/youtube?id=${id}`, { method: "DELETE" });
    if (res.ok) setVideos((prev) => prev.filter((v) => v.id !== id));
  }

  async function addVideo() {
    if (!newVideo.title) return;
    const res = await fetch("/api/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newVideo,
        color: CLUSTER_COLORS[newVideo.cluster] || "#888888",
        arc_phase: newVideo.arc_phase || null,
        arc_race: newVideo.arc_race || null,
        partner_id: newVideo.partner_id || null,
        production: newVideo.production,
        producer: newVideo.producer || null,
      }),
    });
    if (res.ok) {
      await fetchVideos();
      setShowAdd(false);
      setNewVideo({ title: "", cluster: CLUSTERS[0], rating: "A", setting: "keller", week: "", description: "", formula: "", arc_phase: "", arc_race: "", partner_id: "", production: "inhouse", producer: "" });
    }
  }

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      const ms = !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.cluster.toLowerCase().includes(search.toLowerCase()) || (v.formula || "").toLowerCase().includes(search.toLowerCase()) || (v.description || "").toLowerCase().includes(search.toLowerCase());
      const mf = statusFilter === "all" || v.status === statusFilter;
      return ms && mf;
    });
  }, [videos, search, statusFilter]);

  const stats = useMemo(() => ({
    total: videos.length,
    s: videos.filter((v) => v.rating === "S").length,
    open: videos.filter((v) => v.status === "open").length,
    published: videos.filter((v) => v.status === "published").length,
  }), [videos]);

  // ============================================================
  // Video Card
  // ============================================================
  function VideoCard({ v }: { v: Video }) {
    const isExp = expanded === v.id;
    const stCfg = STATUS_CONFIG[v.status];
    const setCfg = SETTING_CONFIG[v.setting];

    return (
      <div
        draggable
        onDragStart={(e) => { e.dataTransfer.setData("text/plain", String(v.id)); setDragVideoId(v.id); setExpanded(null); }}
        onDragEnd={() => setDragVideoId(null)}
        onClick={() => setExpanded(isExp ? null : v.id)}
        className={`rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-all bg-white dark:bg-zinc-900 ${dragVideoId === v.id ? "opacity-50 scale-95" : ""} ${v.status === "published" ? "opacity-40 border-green-800" : v.status !== "open" ? "border-amber-500/50" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-zinc-400 mb-0.5">#{v.id} {v.week && `· ${v.week} · ${getWeekLabel(v.week)}`}</div>
            <div className={`text-sm font-semibold leading-tight ${v.status === "published" ? "line-through text-zinc-500" : "text-zinc-900 dark:text-white"}`}>{v.title}</div>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${v.rating === "S" ? "bg-amber-400 text-black" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>{v.rating === "S" ? "Pflicht" : "Stark"}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${stCfg.bg} ${stCfg.color}`}>{stCfg.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">{setCfg.emoji} {setCfg.label}</span>
              {v.arc_phase && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${v.color}20`, color: v.color }}>{v.arc_phase}</span>}
              {v.formula && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{v.formula}</span>}
              {v.production === "extern" && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">🎬 {v.producer || "Extern"}</span>}
              {v.partner && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">🤝 {v.partner.name}</span>}
            </div>
          </div>
        </div>
        {isExp && (
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            {v.description && <p className="text-xs text-zinc-500">{v.description}</p>}
            {/* Woche verschieben */}
            <div>
              <div className="text-[10px] text-zinc-400 mb-1 uppercase tracking-wider">Woche</div>
              <div className="flex items-center gap-2">
                <select
                  value={v.week || ""}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { e.stopPropagation(); updateVideo(v.id, { week: e.target.value || null }); }}
                  className="text-[11px] px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option value="">Nicht eingeplant</option>
                  {Array.from({ length: 39 }, (_, i) => i + 15).map((w) => (
                    <option key={w} value={`W${w}`}>W{w} · {getWeekLabel(`W${w}`)}</option>
                  ))}
                </select>
                <span className="text-[10px] text-zinc-400">aktuell: {v.week || "–"}</span>
              </div>
            </div>
            {/* Partner */}
            <div>
              <div className="text-[10px] text-zinc-400 mb-1 uppercase tracking-wider">Partner</div>
              <select
                value={v.partner_id || ""}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => { e.stopPropagation(); updateVideo(v.id, { partner_id: e.target.value || null }); }}
                className="text-[11px] px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              >
                <option value="">Kein Partner</option>
                {partners.filter(p => p.status === "Active" || p.status === "Negotiating" || p.id === v.partner_id).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.partner_type})</option>
                ))}
              </select>
            </div>
            {/* Status */}
            <div>
              <div className="text-[10px] text-zinc-400 mb-1 uppercase tracking-wider">Status</div>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(STATUS_CONFIG) as VideoStatus[]).map((s) => (
                  <button key={s} onClick={(e) => { e.stopPropagation(); updateVideo(v.id, { status: s }); }}
                    className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${v.status === s ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent" : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                  >{STATUS_CONFIG[s].label}</button>
                ))}
              </div>
            </div>
            {/* Setting */}
            <div>
              <div className="text-[10px] text-zinc-400 mb-1 uppercase tracking-wider">Setting</div>
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(SETTING_CONFIG) as Setting[]).map((s) => (
                  <button key={s} onClick={(e) => { e.stopPropagation(); updateVideo(v.id, { setting: s }); }}
                    className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${v.setting === s ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent" : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                  >{SETTING_CONFIG[s].emoji} {SETTING_CONFIG[s].label}</button>
                ))}
              </div>
            </div>
            {/* Produktion */}
            <div>
              <div className="text-[10px] text-zinc-400 mb-1 uppercase tracking-wider">Produktion</div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); updateVideo(v.id, { production: "inhouse", producer: null }); }}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${v.production === "inhouse" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent" : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                >🏠 Inhouse</button>
                <button onClick={(e) => { e.stopPropagation(); updateVideo(v.id, { production: "extern" }); }}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${v.production === "extern" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent" : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                >🎬 Extern</button>
                {v.production === "extern" && (
                  <input
                    type="text"
                    value={v.producer || ""}
                    placeholder="Produzent..."
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => { e.stopPropagation(); updateVideo(v.id, { producer: e.target.value }); }}
                    className="text-[11px] px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white w-40"
                  />
                )}
              </div>
            </div>
            {/* Delete */}
            <button onClick={(e) => { e.stopPropagation(); deleteVideo(v.id); }} className="text-[11px] text-red-500 hover:text-red-400 flex items-center gap-1"><Trash2 size={12} /> Löschen</button>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // Calendar View
  // ============================================================
  function CalendarView() {
    // Show ALL weeks W15-W53 so empty weeks are drop targets too
    const allWeeks = Array.from({ length: 39 }, (_, i) => `W${i + 15}`);
    const usedWeeks = new Set(filtered.map((v) => v.week).filter(Boolean));
    const weeks = dragVideoId ? allWeeks : allWeeks.filter(w => usedWeeks.has(w));
    let currentMonth = -1;

    return (
      <div className="space-y-1">
        {weeks.map((week) => {
          const wNum = parseInt(week.replace("W", ""));
          const start = new Date(2026, 3, 6);
          start.setDate(start.getDate() + (wNum - 15) * 7);
          const monthNum = start.getMonth();
          const showMonth = monthNum !== currentMonth;
          if (showMonth) currentMonth = monthNum;

          const weekVideos = filtered.filter((v) => v.week === week);
          const raceThisWeek = RACES.find((r) => {
            const rd = new Date(r.date);
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            return rd >= start && rd <= end;
          });

          const isDropTarget = dragOverWeek === week;

          return (
            <div key={week}>
              {showMonth && (
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mt-6 mb-3 flex items-center gap-3">
                  {MONTHS[monthNum]} 2026
                  {RACES.filter((r) => new Date(r.date).getMonth() === monthNum).map((r) => (
                    <span key={r.name} className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: `${r.color}20`, color: r.color }}>
                      {r.name} – {new Date(r.date).getDate()}.{monthNum + 1}.
                    </span>
                  ))}
                </h3>
              )}
              {raceThisWeek && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1" style={{ background: `${raceThisWeek.color}10`, border: `1px solid ${raceThisWeek.color}30` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: raceThisWeek.color }} />
                  <span className="text-sm font-semibold" style={{ color: raceThisWeek.color }}>{raceThisWeek.name}</span>
                </div>
              )}
              <div
                className={`flex gap-2 items-start rounded-lg transition-colors ${isDropTarget ? "bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-400 ring-inset" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverWeek(week); }}
                onDragLeave={() => setDragOverWeek(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverWeek(null);
                  const videoId = Number(e.dataTransfer.getData("text/plain"));
                  if (videoId) updateVideo(videoId, { week });
                  setDragVideoId(null);
                }}
              >
                <div className="text-xs text-zinc-400 pt-3 font-mono w-[70px] shrink-0">{week}<br /><span className="text-[10px]">{getWeekLabel(week)}</span></div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 py-1">
                  {weekVideos.map((v) => <VideoCard key={v.id} v={v} />)}
                  {weekVideos.length === 0 && isDropTarget && (
                    <div className="rounded-lg border-2 border-dashed border-amber-400 p-4 text-center text-xs text-amber-600">Hier ablegen</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ============================================================
  // Cluster View
  // ============================================================
  function ClusterView() {
    const clusters: Record<string, Video[]> = {};
    filtered.forEach((v) => { if (!clusters[v.cluster]) clusters[v.cluster] = []; clusters[v.cluster].push(v); });
    return (
      <div className="space-y-8">
        {Object.entries(clusters).map(([name, vids]) => (
          <div key={name}>
            <div className="flex items-center gap-3 mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              <div className="w-3 h-3 rounded-full" style={{ background: vids[0]?.color }} />
              <h3 className="font-semibold text-zinc-900 dark:text-white">{name}</h3>
              <span className="text-xs text-zinc-400 ml-auto">{vids.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {vids.map((v) => <VideoCard key={v.id} v={v} />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ============================================================
  // Arc View
  // ============================================================
  function ArcView() {
    const arcRaces = ["Wittiker", "Varner", "99 Laps", "Last Soul"];
    const labels: Record<string, string> = { Wittiker: "Wittiker Backyard – 14. Mai", Varner: "Varner Backyard (Lea) – 27. Juni", "99 Laps": "99 Laps – 25./26. Juli", "Last Soul": "Last Soul Ultra – 14. August" };
    const phases = ["Prequel", "Setup", "Race Day", "Aftermath"];
    return (
      <div className="space-y-10">
        {arcRaces.map((race) => {
          const raceVideos = filtered.filter((v) => v.arc_race === race);
          if (!raceVideos.length) return null;
          const col = raceVideos[0]?.color || "#888";
          return (
            <div key={race}>
              <div className="flex items-center gap-3 mb-4">
                <Film size={20} style={{ color: col }} />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{labels[race]}</h3>
              </div>
              <div className="flex gap-1 mb-4 h-1.5 rounded-full overflow-hidden">
                {phases.map((p) => {
                  const has = raceVideos.some((v) => v.arc_phase === p);
                  const done = raceVideos.filter((v) => v.arc_phase === p).every((v) => v.status === "published");
                  return <div key={p} className="flex-1 rounded-full" style={{ background: has ? col : "#333", opacity: has ? (done ? 1 : 0.4) : 0.1 }} />;
                })}
              </div>
              {phases.map((p) => {
                const pVids = raceVideos.filter((v) => v.arc_phase === p);
                if (!pVids.length) return null;
                return (
                  <div key={p} className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: col }}>{p}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">{pVids.map((v) => <VideoCard key={v.id} v={v} />)}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // ============================================================
  // Main
  // ============================================================
  if (loading) return <div className="flex items-center justify-center h-64 text-zinc-500">Laden...</div>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">YouTube Masterplan 2026</h1>
          <p className="text-sm text-zinc-500 mt-1">Ziel: 30.000 Abonnenten · 2 Videos/Woche · 4 Race Story-Arcs</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90">
          <Plus size={16} /> Neue Idee
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: stats.total },
          { label: "Pflicht (S)", value: stats.s, color: "text-amber-600" },
          { label: "Offen", value: stats.open, color: "text-zinc-500" },
          { label: "Published", value: stats.published, color: "text-green-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <div className={`text-xl font-bold ${s.color || "text-zinc-900 dark:text-white"}`}>{s.value}</div>
            <div className="text-xs text-zinc-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 w-fit">
        {([
          { key: "calendar" as ViewMode, label: "Kalender", icon: CalendarDays },
          { key: "clusters" as ViewMode, label: "Cluster", icon: LayoutGrid },
          { key: "arcs" as ViewMode, label: "Story Arcs", icon: Film },
        ]).map((t) => (
          <button key={t.key} onClick={() => setView(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === t.key ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
          ><t.icon size={14} />{t.label}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suche..." className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-white" />
        </div>
        {(["all", ...Object.keys(STATUS_CONFIG)] as ("all" | VideoStatus)[]).map((f) => (
          <button key={f} onClick={() => setStatusFilter(f)}
            className={`px-3 py-2 text-xs rounded-lg border transition-colors ${statusFilter === f ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent" : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
          >{f === "all" ? "Alle" : STATUS_CONFIG[f].label}</button>
        ))}
      </div>

      {/* Content */}
      {filtered.length === 0 ? <div className="text-center py-16 text-zinc-500">Keine Videos gefunden.</div>
        : view === "calendar" ? <CalendarView />
        : view === "clusters" ? <ClusterView />
        : <ArcView />}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Neue Video-Idee</h2>
              <button onClick={() => setShowAdd(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"><X size={20} /></button>
            </div>
            <input type="text" placeholder="Titel *" value={newVideo.title} onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })} className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white outline-none" />
            <textarea placeholder="Beschreibung" value={newVideo.description} onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })} className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white outline-none h-20 resize-none" />
            <div className="grid grid-cols-2 gap-3">
              <select value={newVideo.cluster} onChange={(e) => setNewVideo({ ...newVideo, cluster: e.target.value })} className="px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white">
                {CLUSTERS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={newVideo.rating} onChange={(e) => setNewVideo({ ...newVideo, rating: e.target.value as Rating })} className="px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white">
                <option value="S">S – Pflicht</option>
                <option value="A">A – Stark</option>
              </select>
              <select value={newVideo.setting} onChange={(e) => setNewVideo({ ...newVideo, setting: e.target.value as Setting })} className="px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white">
                {(Object.keys(SETTING_CONFIG) as Setting[]).map((s) => <option key={s} value={s}>{SETTING_CONFIG[s].emoji} {SETTING_CONFIG[s].label}</option>)}
              </select>
              <input type="text" placeholder="Woche (z.B. W20)" value={newVideo.week} onChange={(e) => setNewVideo({ ...newVideo, week: e.target.value })} className="px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white outline-none" />
              <input type="text" placeholder="Formel (optional)" value={newVideo.formula} onChange={(e) => setNewVideo({ ...newVideo, formula: e.target.value })} className="px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white outline-none" />
              <select value={newVideo.arc_phase} onChange={(e) => setNewVideo({ ...newVideo, arc_phase: e.target.value })} className="px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white">
                <option value="">Kein Arc</option>
                <option value="Prequel">Prequel</option>
                <option value="Setup">Setup</option>
                <option value="Race Day">Race Day</option>
                <option value="Aftermath">Aftermath</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={newVideo.production} onChange={(e) => setNewVideo({ ...newVideo, production: e.target.value as Production })} className="px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white">
                <option value="inhouse">🏠 Inhouse</option>
                <option value="extern">🎬 Extern</option>
              </select>
              {newVideo.production === "extern" && (
                <input type="text" placeholder="Produzent (z.B. Performance Media)" value={newVideo.producer} onChange={(e) => setNewVideo({ ...newVideo, producer: e.target.value })} className="px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white outline-none" />
              )}
            </div>
            <select value={newVideo.partner_id} onChange={(e) => setNewVideo({ ...newVideo, partner_id: e.target.value })} className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white">
              <option value="">Kein Partner</option>
              {partners.map((p) => <option key={p.id} value={p.id}>🤝 {p.name} ({p.partner_type})</option>)}
            </select>
            <button onClick={addVideo} disabled={!newVideo.title} className="w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2">
              <Save size={16} /> Speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
