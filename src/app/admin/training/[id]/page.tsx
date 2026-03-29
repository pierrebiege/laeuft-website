"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Copy,
  Send,
  Trash2,
  X,
  GripVertical,
  Clock,
  Flame,
  Dumbbell,
  Wind,
  Moon,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import type {
  TrainingPlan,
  TrainingWeek,
  TrainingSession,
  SessionType,
  Client,
} from "@/lib/supabase";
import {
  SESSION_SUBTYPES,
  SESSION_TYPE_LABELS,
  SESSION_TYPE_COLORS,
  DAY_LABELS,
} from "@/lib/supabase";

type PlanWithRelations = TrainingPlan & {
  client: Client;
  weeks: (TrainingWeek & { sessions: TrainingSession[] })[];
};

const SESSION_TYPE_ICONS: Record<SessionType, React.ElementType> = {
  lauf: Flame,
  kraft: Dumbbell,
  mobility: Wind,
  ruhe: Moon,
};

const INTENSITY_COLORS = [
  "bg-green-500", "bg-green-400", "bg-lime-400", "bg-lime-500", "bg-yellow-400",
  "bg-yellow-500", "bg-orange-400", "bg-orange-500", "bg-red-400", "bg-red-500",
];

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: "Entwurf", color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800" },
  sent: { label: "Gesendet", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30" },
  active: { label: "Aktiv", color: "text-green-600 bg-green-50 dark:bg-green-900/30" },
  archived: { label: "Archiviert", color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800" },
};

interface SessionFormData {
  session_type: SessionType;
  session_subtype: string;
  title: string;
  duration_minutes: number;
  intensity: number;
  description: string;
}

const defaultSessionForm: SessionFormData = {
  session_type: "lauf",
  session_subtype: "Zone 1-2",
  title: "Zone 1-2",
  duration_minutes: 60,
  intensity: 5,
  description: "",
};

export default function TrainingPlanEditorPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  const [plan, setPlan] = useState<PlanWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [modalWeekId, setModalWeekId] = useState<string | null>(null);
  const [modalDayOfWeek, setModalDayOfWeek] = useState(0);
  const [sessionForm, setSessionForm] = useState<SessionFormData>(defaultSessionForm);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [editingWeekLabel, setEditingWeekLabel] = useState<string | null>(null);
  const [weekLabelValue, setWeekLabelValue] = useState("");

  const loadPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/training/${planId}`);
      if (!res.ok) { router.push("/admin/training"); return; }
      const data: PlanWithRelations = await res.json();
      setPlan(data);
      setTitleValue(data.title);
    } catch { console.error("Error loading plan"); }
    setLoading(false);
  }, [planId, router]);

  useEffect(() => { loadPlan(); }, [loadPlan]);

  const weeks = plan?.weeks?.sort((a, b) => a.sort_order - b.sort_order) || [];

  function sessionsForDayInWeek(weekId: string, day: number) {
    const week = weeks.find(w => w.id === weekId);
    return (week?.sessions || []).filter(s => s.day_of_week === day).sort((a, b) => a.sort_order - b.sort_order);
  }

  // --- Title editing ---
  async function saveTitle() {
    if (!titleValue.trim() || titleValue === plan?.title) { setEditingTitle(false); return; }
    await fetch(`/api/training/${planId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleValue }),
    });
    setPlan(prev => prev ? { ...prev, title: titleValue } : prev);
    setEditingTitle(false);
  }

  // --- Week label editing ---
  async function saveWeekLabel(weekId: string) {
    const week = weeks.find(w => w.id === weekId);
    if (!week || weekLabelValue === (week.label || "")) { setEditingWeekLabel(null); return; }
    await fetch(`/api/training/${planId}/weeks`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_label", week_id: weekId, label: weekLabelValue || null }),
    });
    await loadPlan();
    setEditingWeekLabel(null);
  }

  // --- Copy link ---
  function copyLink() {
    if (!plan) return;
    navigator.clipboard.writeText(`${window.location.origin}/training/${plan.unique_token}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  // --- Send plan ---
  async function sendPlan() {
    if (!plan || !confirm("Trainingsplan an Client senden?")) return;
    await fetch(`/api/training/${planId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sent", sent_at: new Date().toISOString() }),
    });
    loadPlan();
  }

  // --- Week operations ---
  async function addWeek() {
    const res = await fetch(`/api/training/${planId}/weeks`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add" }),
    });
    if (res.ok) await loadPlan();
  }

  async function duplicateWeek(weekId: string) {
    const res = await fetch(`/api/training/${planId}/weeks`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "duplicate", week_id: weekId }),
    });
    if (res.ok) await loadPlan();
  }

  async function deleteWeek(weekId: string) {
    if (!confirm("Diese Woche und alle Sessions loschen?")) return;
    await fetch(`/api/training/${planId}/weeks?week_id=${weekId}`, { method: "DELETE" });
    await loadPlan();
  }

  // --- Session modal ---
  function openNewSession(weekId: string, dayOfWeek: number) {
    setEditingSession(null);
    setModalWeekId(weekId);
    setModalDayOfWeek(dayOfWeek);
    setSessionForm({ ...defaultSessionForm });
    setShowModal(true);
  }

  function openEditSession(session: TrainingSession, weekId: string) {
    setEditingSession(session);
    setModalWeekId(weekId);
    setModalDayOfWeek(session.day_of_week);
    setSessionForm({
      session_type: session.session_type,
      session_subtype: session.session_subtype,
      title: session.title,
      duration_minutes: session.duration_minutes || 60,
      intensity: session.intensity || 5,
      description: session.description || "",
    });
    setShowModal(true);
  }

  function handleTypeChange(type: SessionType) {
    const subtypes = SESSION_SUBTYPES[type];
    setSessionForm(prev => ({ ...prev, session_type: type, session_subtype: subtypes[0] || "", title: subtypes[0] || "" }));
  }

  function handleSubtypeChange(subtype: string) {
    setSessionForm(prev => ({ ...prev, session_subtype: subtype, title: prev.title === prev.session_subtype ? subtype : prev.title }));
  }

  async function saveSession() {
    if (!modalWeekId) return;
    setSaving(true);
    const payload = { ...sessionForm, week_id: modalWeekId, day_of_week: modalDayOfWeek };
    if (editingSession) {
      await fetch(`/api/training/${planId}/sessions`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingSession.id, ...payload }),
      });
    } else {
      await fetch(`/api/training/${planId}/sessions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    setShowModal(false);
    await loadPlan();
    setSaving(false);
  }

  async function duplicateSession() {
    if (!editingSession || !modalWeekId) return;
    setSaving(true);
    await fetch(`/api/training/${planId}/sessions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_id: modalWeekId,
        day_of_week: modalDayOfWeek,
        session_type: editingSession.session_type,
        session_subtype: editingSession.session_subtype,
        title: editingSession.title,
        duration_minutes: editingSession.duration_minutes,
        intensity: editingSession.intensity,
        description: editingSession.description,
      }),
    });
    setShowModal(false);
    await loadPlan();
    setSaving(false);
  }

  async function duplicateSessionToDay(session: TrainingSession, sourceWeekId: string, targetWeekId: string, targetDay: number) {
    await fetch(`/api/training/${planId}/sessions`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        week_id: targetWeekId,
        day_of_week: targetDay,
        session_type: session.session_type,
        session_subtype: session.session_subtype,
        title: session.title,
        duration_minutes: session.duration_minutes,
        intensity: session.intensity,
        description: session.description,
      }),
    });
    await loadPlan();
  }

  async function deleteSession() {
    if (!editingSession || !confirm("Session loschen?")) return;
    setSaving(true);
    await fetch(`/api/training/${planId}/sessions?id=${editingSession.id}`, { method: "DELETE" });
    setShowModal(false);
    await loadPlan();
    setSaving(false);
  }

  // --- Drag & Drop ---
  function handleDragStart(e: React.DragEvent, session: TrainingSession, weekId: string) {
    e.dataTransfer.setData("sessionId", session.id);
    e.dataTransfer.setData("sourceWeekId", weekId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, weekId: string, day: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverTarget(`${weekId}-${day}`);
  }

  function handleDragLeave() { setDragOverTarget(null); }

  async function handleDrop(e: React.DragEvent, weekId: string, day: number) {
    e.preventDefault();
    setDragOverTarget(null);
    const sessionId = e.dataTransfer.getData("sessionId");
    const sourceWeekId = e.dataTransfer.getData("sourceWeekId");
    if (!sessionId) return;

    // Alt/Option key = duplicate, normal drag = move
    if (e.altKey) {
      const sourceWeek = weeks.find(w => w.id === sourceWeekId);
      const session = sourceWeek?.sessions?.find(s => s.id === sessionId);
      if (session) {
        await duplicateSessionToDay(session, sourceWeekId, weekId, day);
      }
    } else {
      await fetch(`/api/training/${planId}/sessions`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, day_of_week: day, week_id: weekId }),
      });
      await loadPlan();
    }
  }

  if (loading) return <div className="text-center py-12 text-zinc-500">Laden...</div>;
  if (!plan) return <div className="text-center py-12 text-zinc-500">Plan nicht gefunden</div>;

  const status = statusConfig[plan.status] || statusConfig.draft;

  // Calculate dates for each week/day
  function getDayDate(weekIndex: number, dayOfWeek: number) {
    const start = new Date(plan!.start_date);
    const d = new Date(start);
    d.setDate(start.getDate() + weekIndex * 7 + dayOfWeek);
    return d;
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/training" className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0">
            <ArrowLeft size={20} />
          </Link>
          {editingTitle ? (
            <input type="text" value={titleValue} onChange={e => setTitleValue(e.target.value)} onBlur={saveTitle}
              onKeyDown={e => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") { setTitleValue(plan.title); setEditingTitle(false); } }}
              autoFocus className="text-xl font-bold text-zinc-900 dark:text-white bg-transparent border-b-2 border-zinc-900 dark:border-white outline-none px-1" />
          ) : (
            <h1 onClick={() => setEditingTitle(true)} className="text-xl font-bold text-zinc-900 dark:text-white cursor-pointer hover:underline decoration-zinc-300 dark:decoration-zinc-600 underline-offset-4 truncate">
              {plan.title}
            </h1>
          )}
          <span className="text-zinc-400 dark:text-zinc-500 shrink-0">{plan.client?.company || plan.client?.name}</span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${status.color}`}>{status.label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={copyLink} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            {copiedLink ? <><Check size={14} className="text-green-500" />Kopiert</> : <><Copy size={14} />Link kopieren</>}
          </button>
          <button onClick={sendPlan} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors">
            <Send size={14} />Senden
          </button>
        </div>
      </div>

      {/* Month view: all weeks stacked */}
      <div className="space-y-1">
        {/* Day header row */}
        <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-1">
          <div />
          {DAY_LABELS.map((day, i) => (
            <div key={i} className="text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 py-1">{day}</div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, weekIdx) => (
          <div key={week.id} className="grid grid-cols-[140px_repeat(7,1fr)] gap-1 group">
            {/* Week label */}
            <div className="flex flex-col justify-start pt-1 pr-2">
              {editingWeekLabel === week.id ? (
                <input type="text" value={weekLabelValue} onChange={e => setWeekLabelValue(e.target.value)}
                  onBlur={() => saveWeekLabel(week.id)}
                  onKeyDown={e => { if (e.key === "Enter") saveWeekLabel(week.id); if (e.key === "Escape") setEditingWeekLabel(null); }}
                  autoFocus className="text-xs font-medium text-zinc-900 dark:text-white bg-transparent border-b border-zinc-400 outline-none w-full" />
              ) : (
                <button onClick={() => { setEditingWeekLabel(week.id); setWeekLabelValue(week.label || `Woche ${week.week_number}`); }}
                  className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 text-left hover:text-zinc-900 dark:hover:text-white truncate">
                  {week.label || `Woche ${week.week_number}`}
                </button>
              )}
              <span className="text-[10px] text-zinc-400 mt-0.5">
                {getDayDate(weekIdx, 0).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })} – {getDayDate(weekIdx, 6).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })}
              </span>
              <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => duplicateWeek(week.id)} title="Woche duplizieren" className="text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
                  <Copy size={10} />
                </button>
                <button onClick={() => deleteWeek(week.id)} title="Woche loschen" className="text-[10px] text-zinc-400 hover:text-red-500">
                  <Trash2 size={10} />
                </button>
              </div>
            </div>

            {/* 7 day cells */}
            {DAY_LABELS.map((_, dayIdx) => {
              const daySessions = sessionsForDayInWeek(week.id, dayIdx);
              const isOver = dragOverTarget === `${week.id}-${dayIdx}`;
              const dayDate = getDayDate(weekIdx, dayIdx);
              const isToday = dayDate.toDateString() === new Date().toDateString();

              return (
                <div
                  key={dayIdx}
                  className={`min-h-[80px] rounded-lg border p-1 transition-colors ${
                    isOver ? "border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/50"
                    : isToday ? "border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/20"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  }`}
                  onDragOver={e => handleDragOver(e, week.id, dayIdx)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, week.id, dayIdx)}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[10px] ${isToday ? "font-bold text-blue-600 dark:text-blue-400" : "text-zinc-400"}`}>
                      {dayDate.getDate()}.
                    </span>
                  </div>

                  {/* Sessions */}
                  <div className="space-y-1">
                    {daySessions.map(session => {
                      const tc = SESSION_TYPE_COLORS[session.session_type];
                      const Icon = SESSION_TYPE_ICONS[session.session_type];
                      return (
                        <div key={session.id} draggable onDragStart={e => handleDragStart(e, session, week.id)}
                          onClick={() => openEditSession(session, week.id)}
                          className={`px-1.5 py-1 rounded border-l-2 cursor-pointer hover:shadow-sm transition-shadow text-[11px] ${tc.bg} ${tc.border}`}>
                          <div className="flex items-center gap-1">
                            <Icon size={10} className={tc.text} />
                            <span className={`font-medium truncate ${tc.text}`}>{session.title}</span>
                          </div>
                          {session.duration_minutes && (
                            <span className="text-[9px] text-zinc-400">{session.duration_minutes}min</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add button */}
                  <button onClick={() => openNewSession(week.id, dayIdx)}
                    className="w-full flex items-center justify-center mt-0.5 py-0.5 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors rounded">
                    <Plus size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        ))}

        {/* Add week row */}
        <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-1">
          <button onClick={addWeek}
            className="flex items-center gap-1 px-2 py-2 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <Plus size={14} />
            Woche hinzufugen
          </button>
        </div>
      </div>

      {/* Session Modal (Slide-in from right) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {editingSession ? "Session bearbeiten" : "Neue Session"}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-5 space-y-5">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Typ</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map(type => {
                    const colors = SESSION_TYPE_COLORS[type];
                    const Icon = SESSION_TYPE_ICONS[type];
                    const isActive = sessionForm.session_type === type;
                    return (
                      <button key={type} type="button" onClick={() => handleTypeChange(type)}
                        className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border-2 transition-colors text-xs font-medium ${
                          isActive ? `${colors.border} ${colors.bg} ${colors.text}` : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600"
                        }`}>
                        <Icon size={18} />{SESSION_TYPE_LABELS[type]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subtype */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Untertyp</label>
                <select value={sessionForm.session_subtype} onChange={e => handleSubtypeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white">
                  {SESSION_SUBTYPES[sessionForm.session_type].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Titel</label>
                <input type="text" value={sessionForm.title} onChange={e => setSessionForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white" />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Dauer (Minuten)</label>
                <input type="number" value={sessionForm.duration_minutes} onChange={e => setSessionForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                  min={0} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white" />
              </div>

              {/* Intensity */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Intensitat ({sessionForm.intensity}/10)</label>
                <input type="range" min={1} max={10} value={sessionForm.intensity} onChange={e => setSessionForm(prev => ({ ...prev, intensity: parseInt(e.target.value) }))}
                  className="w-full accent-zinc-900 dark:accent-white" />
                <div className="flex justify-between mt-1">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className={`w-6 h-2 rounded-full ${i < sessionForm.intensity ? INTENSITY_COLORS[i] : "bg-zinc-200 dark:bg-zinc-700"}`} />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Beschreibung</label>
                <textarea value={sessionForm.description} onChange={e => setSessionForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white resize-none"
                  placeholder="Notizen zur Session..." />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              {editingSession ? (
                <div className="flex items-center gap-2">
                  <button onClick={duplicateSession} disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50">
                    <Copy size={14} />Duplizieren
                  </button>
                  <button onClick={deleteSession} disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50">
                    <Trash2 size={14} />Loschen
                  </button>
                </div>
              ) : <div />}
              <button onClick={saveSession} disabled={saving || !sessionForm.title}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? "Speichere..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
