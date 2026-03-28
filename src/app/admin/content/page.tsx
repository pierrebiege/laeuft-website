"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Video,
  Mic,
  FileText,
  Package,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
  Film,
  Scissors,
  Upload,
  Layers,
  Sparkles,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  DatabaseZap,
  BookOpen,
  Quote,
  Palette,
} from "lucide-react";
import reelsJson from "@/data/reels-data.json";
import gedankenJson from "@/data/gedanken-data.json";
import type { ContentReel, ReelStatus, ContentGedanke, GedankeStatus } from "@/lib/supabase";

const STATUS_CONFIG: Record<ReelStatus, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  backlog: { label: "Backlog", color: "text-zinc-500", icon: Layers, bg: "bg-zinc-100 dark:bg-zinc-800" },
  planned: { label: "Geplant", color: "text-blue-600", icon: Clock, bg: "bg-blue-50 dark:bg-blue-950" },
  in_progress: { label: "In Arbeit", color: "text-amber-600", icon: Sparkles, bg: "bg-amber-50 dark:bg-amber-950" },
  filmed: { label: "Gefilmt", color: "text-purple-600", icon: Film, bg: "bg-purple-50 dark:bg-purple-950" },
  edited: { label: "Geschnitten", color: "text-cyan-600", icon: Scissors, bg: "bg-cyan-50 dark:bg-cyan-950" },
  published: { label: "Live", color: "text-green-600", icon: Upload, bg: "bg-green-50 dark:bg-green-950" },
};

const CATEGORIES = [
  "all", "Education", "Story", "Lifestyle", "Gear", "Biohacking",
  "Community", "Sponsor", "Fun", "Mindset", "Data", "Race",
  "Recovery", "Training", "Nutrition", "Swiss", "Meta", "Seasonal",
];

const STATUS_ORDER: ReelStatus[] = ["backlog", "planned", "in_progress", "filmed", "edited", "published"];

const GEDANKE_STATUS_CONFIG: Record<GedankeStatus, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  backlog: { label: "Backlog", color: "text-zinc-500", icon: Layers, bg: "bg-zinc-100 dark:bg-zinc-800" },
  planned: { label: "Geplant", color: "text-blue-600", icon: Clock, bg: "bg-blue-50 dark:bg-blue-950" },
  in_progress: { label: "In Arbeit", color: "text-amber-600", icon: Sparkles, bg: "bg-amber-50 dark:bg-amber-950" },
  designed: { label: "Designed", color: "text-purple-600", icon: Palette, bg: "bg-purple-50 dark:bg-purple-950" },
  published: { label: "Live", color: "text-green-600", icon: Upload, bg: "bg-green-50 dark:bg-green-950" },
};

const GEDANKE_STATUS_ORDER: GedankeStatus[] = ["backlog", "planned", "in_progress", "designed", "published"];
const GEDANKE_CATEGORIES = ["all", "Meditativ", "Provokativ", "Familie", "Übergang"];

export default function ContentPlannerPage() {
  const [tab, setTab] = useState<"reels" | "gedanken">("reels");
  const [reels, setReels] = useState<ContentReel[]>([]);
  const [gedanken, setGedanken] = useState<ContentGedanke[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [view, setView] = useState<"list" | "board">("list");

  useEffect(() => {
    fetchReels();
    fetchGedanken();
  }, []);

  async function fetchGedanken() {
    const res = await fetch("/api/content-gedanken");
    if (res.ok) {
      const data = await res.json();
      setGedanken(data);
    }
  }

  async function importGedanken() {
    setImporting(true);
    try {
      const rows = (gedankenJson as Array<Record<string, unknown>>).map((g) => ({
        tag_number: g.id as number,
        title: g.title as string,
        category: g.category as string,
        philosopher: g.philosopher as string,
        quote: g.quote as string,
        context: g.context as string || null,
        status: "backlog",
        priority: 0,
      }));

      let imported = 0;
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const res = await fetch("/api/content-gedanken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
        });
        if (res.ok) {
          const data = await res.json();
          imported += data.imported || batch.length;
        }
      }

      alert(`${imported} Gedanken importiert!`);
      fetchGedanken();
    } catch (e) {
      alert("Import fehlgeschlagen: " + (e as Error).message);
    }
    setImporting(false);
  }

  async function updateGedanke(id: number, updates: Partial<ContentGedanke>) {
    const res = await fetch("/api/content-gedanken", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setGedanken((prev) => prev.map((g) => (g.id === id ? updated : g)));
    }
  }

  async function fetchReels() {
    setLoading(true);
    const res = await fetch("/api/content-reels");
    if (res.ok) {
      const data = await res.json();
      setReels(data);
    }
    setLoading(false);
  }

  async function updateReel(id: number, updates: Partial<ContentReel>) {
    const res = await fetch("/api/content-reels", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setReels((prev) => prev.map((r) => (r.id === id ? updated : r)));
    }
  }

  async function importReels() {
    setImporting(true);
    try {
      // Transform JSON to DB format
      const rows = (reelsJson as Array<Record<string, unknown>>).map((r: Record<string, unknown>) => ({
        reel_number: r.id as number,
        title: r.title as string,
        category: r.category as string || "Education",
        duration: r.duration as string || "15-30s",
        reel_type: r.type as string || "Music+Text",
        hook_text: r.hook_text as string || "",
        storyboard: ((r.storyboard as string[]) || []).map((s: string, i: number) => ({ time: `Szene ${i + 1}`, description: s })),
        audio_type: r.audio_type as string || "Trending",
        audio_mood: r.audio_mood as string || "",
        caption: r.caption as string || "",
        sponsor: r.sponsor as string || null,
        sponsor_details: r.sponsor_details as string || null,
        needs_voiceover: r.needs_voiceover as boolean || false,
        needs_video_footage: true,
        props: r.needs_props as string[] || [],
        month: r.month as string || "",
        season: r.season as string || "",
        status: "backlog",
        priority: 0,
      }));

      // Send in batches of 50
      let imported = 0;
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const res = await fetch("/api/content-reels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
        });
        if (res.ok) {
          const data = await res.json();
          imported += data.imported || batch.length;
        }
      }

      alert(`${imported} Reels importiert!`);
      fetchReels();
    } catch (e) {
      alert("Import fehlgeschlagen: " + (e as Error).message);
    }
    setImporting(false);
  }

  const filtered = useMemo(() => {
    return reels.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterCategory !== "all" && r.category !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.hook_text?.toLowerCase().includes(q) ||
          r.caption?.toLowerCase().includes(q) ||
          String(r.reel_number).includes(q)
        );
      }
      return true;
    });
  }, [reels, filterStatus, filterCategory, search]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of STATUS_ORDER) counts[s] = 0;
    reels.forEach((r) => counts[r.status]++);
    return counts;
  }, [reels]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
            Content Planner
          </h1>
          <p className="text-zinc-500 text-sm">
            {tab === "reels" ? "365 Reel-Ideen" : "365 Laufergedanken"} fur @pierrebiege
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === "reels" && reels.length === 0 && (
            <button
              onClick={importReels}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition-all"
            >
              <DatabaseZap size={16} />
              {importing ? "Importiere..." : "365 Reels importieren"}
            </button>
          )}
          {tab === "gedanken" && gedanken.length === 0 && (
            <button
              onClick={importGedanken}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50 transition-all"
            >
              <DatabaseZap size={16} />
              {importing ? "Importiere..." : "365 Gedanken importieren"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => { setTab("reels"); setFilterStatus("all"); setFilterCategory("all"); setSearch(""); setExpandedId(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === "reels"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Video size={16} />
          Reels ({reels.length})
        </button>
        <button
          onClick={() => { setTab("gedanken"); setFilterStatus("all"); setFilterCategory("all"); setSearch(""); setExpandedId(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === "gedanken"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <BookOpen size={16} />
          Gedanken ({gedanken.length})
        </button>
      </div>

      {/* === REELS TAB === */}
      {tab === "reels" && (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-6 gap-3 mb-6">
            {STATUS_ORDER.map((s) => {
              const conf = STATUS_CONFIG[s];
              const Icon = conf.icon;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                    filterStatus === s
                      ? "border-zinc-900 dark:border-white ring-1 ring-zinc-900 dark:ring-white"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                  } ${conf.bg}`}
                >
                  <Icon size={16} className={conf.color} />
                  <div className="text-left">
                    <div className="text-xs text-zinc-500">{conf.label}</div>
                    <div className={`text-lg font-bold ${conf.color}`}>{stats[s] || 0}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>{stats.published || 0} von {reels.length} publiziert</span>
              <span>{reels.length > 0 ? Math.round(((stats.published || 0) / reels.length) * 100) : 0}%</span>
            </div>
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${reels.length > 0 ? ((stats.published || 0) / reels.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Suche nach Titel, Hook, Caption..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={14} className="text-zinc-400" />
                </button>
              )}
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "Alle Kategorien" : c}
                </option>
              ))}
            </select>
            <span className="text-sm text-zinc-500">{filtered.length} Reels</span>
          </div>

          {/* Reel List */}
          <div className="space-y-2">
            {filtered.map((reel) => (
              <ReelCard
                key={reel.id}
                reel={reel}
                expanded={expandedId === reel.id}
                onToggle={() => setExpandedId(expandedId === reel.id ? null : reel.id)}
                onUpdate={updateReel}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-20 text-zinc-400">
                Keine Reels gefunden.
              </div>
            )}
          </div>
        </>
      )}

      {/* === GEDANKEN TAB === */}
      {tab === "gedanken" && (
        <GedankenTab
          gedanken={gedanken}
          search={search}
          setSearch={setSearch}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          onUpdate={updateGedanke}
        />
      )}
    </div>
  );
}

function ReelCard({
  reel,
  expanded,
  onToggle,
  onUpdate,
}: {
  reel: ContentReel;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (id: number, updates: Partial<ContentReel>) => void;
}) {
  const conf = STATUS_CONFIG[reel.status];
  const StatusIcon = conf.icon;

  function nextStatus() {
    const idx = STATUS_ORDER.indexOf(reel.status);
    if (idx < STATUS_ORDER.length - 1) {
      onUpdate(reel.id, { status: STATUS_ORDER[idx + 1] });
    }
  }

  function prevStatus() {
    const idx = STATUS_ORDER.indexOf(reel.status);
    if (idx > 0) {
      onUpdate(reel.id, { status: STATUS_ORDER[idx - 1] });
    }
  }

  return (
    <div
      className={`border rounded-xl transition-all ${
        expanded
          ? "border-zinc-900 dark:border-zinc-200 shadow-lg"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
      } bg-white dark:bg-zinc-900`}
    >
      {/* Compact Row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={onToggle}
      >
        {/* Number */}
        <span className="text-xs font-mono text-zinc-400 w-8 text-right shrink-0">
          #{reel.reel_number}
        </span>

        {/* Status Badge */}
        <button
          onClick={(e) => { e.stopPropagation(); nextStatus(); }}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${conf.bg} ${conf.color}`}
          title="Klick = nachster Status"
        >
          <StatusIcon size={12} />
          {conf.label}
        </button>

        {/* Title */}
        <span className="font-medium text-sm text-zinc-900 dark:text-white truncate flex-1">
          {reel.title}
        </span>

        {/* Quick Info Icons */}
        <div className="flex items-center gap-2 shrink-0">
          {reel.needs_voiceover && (
            <span title="Voiceover noetig" className="text-amber-500"><Mic size={14} /></span>
          )}
          {reel.sponsor && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {reel.sponsor}
            </span>
          )}
          <span className="text-xs text-zinc-400">{reel.duration}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            {reel.category}
          </span>
          {expanded ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Content */}
            <div className="space-y-4">
              {/* Hook */}
              {reel.hook_text && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Hook (Text-Overlay)
                  </h4>
                  <p className="text-base font-bold text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2 border-l-4 border-amber-500">
                    {reel.hook_text}
                  </p>
                </div>
              )}

              {/* Storyboard */}
              {reel.storyboard && reel.storyboard.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Storyboard
                  </h4>
                  <div className="space-y-1">
                    {reel.storyboard.map((scene, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-zinc-400 font-mono text-xs shrink-0 w-16">{scene.time}</span>
                        <span className="text-zinc-700 dark:text-zinc-300">{scene.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Voiceover Script */}
              {reel.voiceover_script && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    <Mic size={12} className="inline mr-1" />
                    Voiceover Script
                  </h4>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2 whitespace-pre-wrap">
                    {reel.voiceover_script}
                  </p>
                </div>
              )}

              {/* Caption */}
              {reel.caption && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    <FileText size={12} className="inline mr-1" />
                    Caption
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {reel.caption}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Meta + Checklist */}
            <div className="space-y-4">
              {/* Status Controls */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Status
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevStatus}
                    disabled={reel.status === "backlog"}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <div className={`flex-1 text-center py-2 rounded-lg font-medium text-sm ${conf.bg} ${conf.color}`}>
                    {conf.label}
                  </div>
                  <button
                    onClick={nextStatus}
                    disabled={reel.status === "published"}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Checkliste
                </h4>
                <div className="space-y-1.5">
                  <ChecklistItem
                    icon={Video}
                    label="Video-Footage aufnehmen"
                    checked={reel.status !== "backlog" && reel.status !== "planned"}
                  />
                  {reel.needs_voiceover && (
                    <ChecklistItem
                      icon={Mic}
                      label="Voiceover aufnehmen"
                      checked={reel.status === "edited" || reel.status === "published"}
                    />
                  )}
                  <ChecklistItem
                    icon={Scissors}
                    label="Schnitt & Edit"
                    checked={reel.status === "edited" || reel.status === "published"}
                  />
                  <ChecklistItem
                    icon={FileText}
                    label="Caption schreiben"
                    checked={!!reel.caption}
                  />
                  <ChecklistItem
                    icon={Upload}
                    label="Publizieren"
                    checked={reel.status === "published"}
                  />
                </div>
              </div>

              {/* Audio Info */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Audio</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {reel.audio_type} -- {reel.audio_mood}
                </p>
              </div>

              {/* Type */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Typ</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{reel.reel_type}</p>
              </div>

              {/* Props */}
              {reel.props && reel.props.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    <Package size={12} className="inline mr-1" />
                    Requisiten
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {reel.props.map((p, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sponsor */}
              {reel.sponsor && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Sponsor</h4>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{reel.sponsor}</p>
                  {reel.sponsor_details && (
                    <p className="text-xs text-zinc-500 mt-0.5">{reel.sponsor_details}</p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Notizen</h4>
                <textarea
                  defaultValue={reel.notes || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (reel.notes || "")) {
                      onUpdate(reel.id, { notes: e.target.value || null });
                    }
                  }}
                  placeholder="Eigene Notizen..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistItem({ icon: Icon, label, checked }: { icon: React.ElementType; label: string; checked: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${checked ? "text-green-600" : "text-zinc-400"}`}>
      {checked ? <Check size={14} /> : <Icon size={14} />}
      <span className={checked ? "line-through" : ""}>{label}</span>
    </div>
  );
}

/* ========== GEDANKEN TAB ========== */

function GedankenTab({
  gedanken,
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
  filterCategory,
  setFilterCategory,
  expandedId,
  setExpandedId,
  onUpdate,
}: {
  gedanken: ContentGedanke[];
  search: string;
  setSearch: (s: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  filterCategory: string;
  setFilterCategory: (s: string) => void;
  expandedId: number | null;
  setExpandedId: (id: number | null) => void;
  onUpdate: (id: number, updates: Partial<ContentGedanke>) => void;
}) {
  const filtered = useMemo(() => {
    return gedanken.filter((g) => {
      if (filterStatus !== "all" && g.status !== filterStatus) return false;
      if (filterCategory !== "all" && g.category !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          g.quote.toLowerCase().includes(q) ||
          g.philosopher.toLowerCase().includes(q) ||
          g.context?.toLowerCase().includes(q) ||
          String(g.tag_number).includes(q)
        );
      }
      return true;
    });
  }, [gedanken, filterStatus, filterCategory, search]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of GEDANKE_STATUS_ORDER) counts[s] = 0;
    gedanken.forEach((g) => counts[g.status]++);
    return counts;
  }, [gedanken]);

  return (
    <>
      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {GEDANKE_STATUS_ORDER.map((s) => {
          const conf = GEDANKE_STATUS_CONFIG[s];
          const Icon = conf.icon;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                filterStatus === s
                  ? "border-zinc-900 dark:border-white ring-1 ring-zinc-900 dark:ring-white"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
              } ${conf.bg}`}
            >
              <Icon size={16} className={conf.color} />
              <div className="text-left">
                <div className="text-xs text-zinc-500">{conf.label}</div>
                <div className={`text-lg font-bold ${conf.color}`}>{stats[s] || 0}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
          <span>{stats.published || 0} von {gedanken.length} publiziert</span>
          <span>{gedanken.length > 0 ? Math.round(((stats.published || 0) / gedanken.length) * 100) : 0}%</span>
        </div>
        <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${gedanken.length > 0 ? ((stats.published || 0) / gedanken.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Suche nach Zitat, Philosoph..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} className="text-zinc-400" />
            </button>
          )}
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm"
        >
          {GEDANKE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "Alle Kategorien" : c}
            </option>
          ))}
        </select>
        <span className="text-sm text-zinc-500">{filtered.length} Gedanken</span>
      </div>

      {/* Gedanken List */}
      <div className="space-y-2">
        {filtered.map((g) => (
          <GedankeCard
            key={g.id}
            gedanke={g}
            expanded={expandedId === g.id}
            onToggle={() => setExpandedId(expandedId === g.id ? null : g.id)}
            onUpdate={onUpdate}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-zinc-400">
            Keine Gedanken gefunden.
          </div>
        )}
      </div>
    </>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  Meditativ: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  Provokativ: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  Familie: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400",
  "Übergang": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
};

function GedankeCard({
  gedanke,
  expanded,
  onToggle,
  onUpdate,
}: {
  gedanke: ContentGedanke;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (id: number, updates: Partial<ContentGedanke>) => void;
}) {
  const conf = GEDANKE_STATUS_CONFIG[gedanke.status];
  const StatusIcon = conf.icon;

  function nextStatus() {
    const idx = GEDANKE_STATUS_ORDER.indexOf(gedanke.status);
    if (idx < GEDANKE_STATUS_ORDER.length - 1) {
      onUpdate(gedanke.id, { status: GEDANKE_STATUS_ORDER[idx + 1] });
    }
  }

  function prevStatus() {
    const idx = GEDANKE_STATUS_ORDER.indexOf(gedanke.status);
    if (idx > 0) {
      onUpdate(gedanke.id, { status: GEDANKE_STATUS_ORDER[idx - 1] });
    }
  }

  return (
    <div
      className={`border rounded-xl transition-all ${
        expanded
          ? "border-zinc-900 dark:border-zinc-200 shadow-lg"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
      } bg-white dark:bg-zinc-900`}
    >
      {/* Compact Row */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={onToggle}>
        <span className="text-xs font-mono text-zinc-400 w-8 text-right shrink-0">
          #{gedanke.tag_number}
        </span>

        <button
          onClick={(e) => { e.stopPropagation(); nextStatus(); }}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${conf.bg} ${conf.color}`}
          title="Klick = nachster Status"
        >
          <StatusIcon size={12} />
          {conf.label}
        </button>

        <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${CATEGORY_COLORS[gedanke.category] || "bg-zinc-100 text-zinc-600"}`}>
          {gedanke.category}
        </span>

        <span className="text-sm text-zinc-500 shrink-0">{gedanke.philosopher}</span>

        <span className="font-medium text-sm text-zinc-900 dark:text-white truncate flex-1 italic">
          &ldquo;{gedanke.quote.length > 80 ? gedanke.quote.substring(0, 80) + "..." : gedanke.quote}&rdquo;
        </span>

        {expanded ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Quote */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  <Quote size={12} className="inline mr-1" />
                  Zitat
                </h4>
                <blockquote className="text-lg font-medium text-zinc-900 dark:text-white italic bg-zinc-50 dark:bg-zinc-800 rounded-lg px-4 py-3 border-l-4 border-amber-500">
                  &ldquo;{gedanke.quote}&rdquo;
                </blockquote>
                <p className="text-sm text-zinc-500 mt-2">-- {gedanke.philosopher}</p>
              </div>

              {gedanke.context && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Kontext</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{gedanke.context}</p>
                </div>
              )}
            </div>

            {/* Right: Controls */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Status</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevStatus}
                    disabled={gedanke.status === "backlog"}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <div className={`flex-1 text-center py-2 rounded-lg font-medium text-sm ${conf.bg} ${conf.color}`}>
                    {conf.label}
                  </div>
                  <button
                    onClick={nextStatus}
                    disabled={gedanke.status === "published"}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Checkliste</h4>
                <div className="space-y-1.5">
                  <ChecklistItem icon={FileText} label="Text finalisiert" checked={gedanke.status !== "backlog"} />
                  <ChecklistItem icon={Palette} label="Grafik designed" checked={gedanke.status === "designed" || gedanke.status === "published"} />
                  <ChecklistItem icon={Upload} label="Publiziert" checked={gedanke.status === "published"} />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Notizen</h4>
                <textarea
                  defaultValue={gedanke.notes || ""}
                  onBlur={(e) => {
                    if (e.target.value !== (gedanke.notes || "")) {
                      onUpdate(gedanke.id, { notes: e.target.value || null });
                    }
                  }}
                  placeholder="Eigene Notizen..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
