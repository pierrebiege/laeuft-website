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
  "bg-green-500",
  "bg-green-400",
  "bg-lime-400",
  "bg-lime-500",
  "bg-yellow-400",
  "bg-yellow-500",
  "bg-orange-400",
  "bg-orange-500",
  "bg-red-400",
  "bg-red-500",
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
  session_subtype: "",
  title: "",
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
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [modalDayOfWeek, setModalDayOfWeek] = useState(0);
  const [sessionForm, setSessionForm] = useState<SessionFormData>(defaultSessionForm);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  const loadPlan = useCallback(async () => {
    try {
      const res = await fetch(`/api/training/${planId}`);
      if (!res.ok) {
        router.push("/admin/training");
        return;
      }
      const data: PlanWithRelations = await res.json();
      setPlan(data);
      setTitleValue(data.title);
      if (!activeWeekId && data.weeks && data.weeks.length > 0) {
        setActiveWeekId(data.weeks[0].id);
      }
    } catch {
      console.error("Error loading plan");
    }
    setLoading(false);
  }, [planId, activeWeekId, router]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  // Active week data
  const activeWeek = plan?.weeks?.find((w) => w.id === activeWeekId) || null;
  const sessions = activeWeek?.sessions || [];

  function sessionsForDay(day: number) {
    return sessions.filter((s) => s.day_of_week === day);
  }

  // --- Title editing ---
  async function saveTitle() {
    if (!titleValue.trim() || titleValue === plan?.title) {
      setEditingTitle(false);
      return;
    }
    try {
      await fetch(`/api/training/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleValue }),
      });
      setPlan((prev) => (prev ? { ...prev, title: titleValue } : prev));
    } catch {
      console.error("Error saving title");
    }
    setEditingTitle(false);
  }

  // --- Copy link ---
  function copyLink() {
    if (!plan) return;
    const url = `${window.location.origin}/training/${plan.unique_token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  // --- Send plan ---
  async function sendPlan() {
    if (!plan) return;
    if (!confirm("Trainingsplan an Client senden?")) return;
    try {
      await fetch(`/api/training/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sent", sent_at: new Date().toISOString() }),
      });
      loadPlan();
    } catch {
      alert("Fehler beim Senden");
    }
  }

  // --- Week operations ---
  async function addWeek() {
    try {
      const res = await fetch(`/api/training/${planId}/weeks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add" }),
      });
      if (res.ok) {
        const newWeek = await res.json();
        await loadPlan();
        setActiveWeekId(newWeek.id);
      }
    } catch {
      alert("Fehler beim Hinzufugen");
    }
  }

  async function duplicateWeek() {
    if (!activeWeekId) return;
    try {
      const res = await fetch(`/api/training/${planId}/weeks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate", week_id: activeWeekId }),
      });
      if (res.ok) {
        const newWeek = await res.json();
        await loadPlan();
        setActiveWeekId(newWeek.id);
      }
    } catch {
      alert("Fehler beim Duplizieren");
    }
  }

  // --- Session modal ---
  function openNewSession(dayOfWeek: number) {
    setEditingSession(null);
    setModalDayOfWeek(dayOfWeek);
    setSessionForm({ ...defaultSessionForm, session_subtype: SESSION_SUBTYPES.lauf[0] });
    setShowModal(true);
  }

  function openEditSession(session: TrainingSession) {
    setEditingSession(session);
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
    setSessionForm((prev) => ({
      ...prev,
      session_type: type,
      session_subtype: subtypes[0] || "",
      title: subtypes[0] || "",
    }));
  }

  function handleSubtypeChange(subtype: string) {
    setSessionForm((prev) => ({
      ...prev,
      session_subtype: subtype,
      title: prev.title === prev.session_subtype ? subtype : prev.title,
    }));
  }

  async function saveSession() {
    if (!activeWeekId) return;
    setSaving(true);

    const payload = {
      ...sessionForm,
      week_id: activeWeekId,
      day_of_week: modalDayOfWeek,
    };

    try {
      if (editingSession) {
        // Update
        await fetch(`/api/training/${planId}/sessions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingSession.id, ...payload }),
        });
      } else {
        // Create
        await fetch(`/api/training/${planId}/sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      await loadPlan();
    } catch {
      alert("Fehler beim Speichern");
    }
    setSaving(false);
  }

  async function deleteSession() {
    if (!editingSession) return;
    if (!confirm("Session loschen?")) return;
    setSaving(true);
    try {
      await fetch(`/api/training/${planId}/sessions?id=${editingSession.id}`, {
        method: "DELETE",
      });
      setShowModal(false);
      await loadPlan();
    } catch {
      alert("Fehler beim Loschen");
    }
    setSaving(false);
  }

  // --- Drag & Drop ---
  function handleDragStart(e: React.DragEvent, session: TrainingSession) {
    e.dataTransfer.setData("sessionId", session.id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, day: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDay(day);
  }

  function handleDragLeave() {
    setDragOverDay(null);
  }

  async function handleDrop(e: React.DragEvent, day: number) {
    e.preventDefault();
    setDragOverDay(null);
    const sessionId = e.dataTransfer.getData("sessionId");
    if (!sessionId) return;

    try {
      await fetch(`/api/training/${planId}/sessions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, day_of_week: day }),
      });
      await loadPlan();
    } catch {
      console.error("Drop error");
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-zinc-500">Laden...</div>;
  }

  if (!plan) {
    return <div className="text-center py-12 text-zinc-500">Plan nicht gefunden</div>;
  }

  const status = statusConfig[plan.status] || statusConfig.draft;

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/training"
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </Link>

          {editingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") {
                  setTitleValue(plan.title);
                  setEditingTitle(false);
                }
              }}
              autoFocus
              className="text-xl font-bold text-zinc-900 dark:text-white bg-transparent border-b-2 border-zinc-900 dark:border-white outline-none px-1"
            />
          ) : (
            <h1
              onClick={() => setEditingTitle(true)}
              className="text-xl font-bold text-zinc-900 dark:text-white cursor-pointer hover:underline decoration-zinc-300 dark:decoration-zinc-600 underline-offset-4 truncate"
            >
              {plan.title}
            </h1>
          )}

          <span className="text-zinc-400 dark:text-zinc-500 shrink-0">
            {plan.client?.company || plan.client?.name}
          </span>

          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${status.color}`}
          >
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            {copiedLink ? (
              <>
                <Check size={14} className="text-green-500" />
                Kopiert
              </>
            ) : (
              <>
                <Copy size={14} />
                Link kopieren
              </>
            )}
          </button>
          <button
            onClick={sendPlan}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            <Send size={14} />
            Senden
          </button>
        </div>
      </div>

      {/* Week tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {plan.weeks?.map((week) => (
          <button
            key={week.id}
            onClick={() => setActiveWeekId(week.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeWeekId === week.id
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {week.label || `Woche ${week.week_number}`}
          </button>
        ))}
        <button
          onClick={addWeek}
          className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          title="Woche hinzufugen"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={duplicateWeek}
          className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap"
        >
          Woche duplizieren
        </button>
      </div>

      {/* 7-day grid */}
      {activeWeek ? (
        <div className="grid grid-cols-7 gap-2" style={{ minHeight: "400px" }}>
          {DAY_LABELS.map((dayLabel, dayIndex) => (
            <div
              key={dayIndex}
              className={`flex flex-col rounded-xl border transition-colors ${
                dragOverDay === dayIndex
                  ? "border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/50"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              }`}
              onDragOver={(e) => handleDragOver(e, dayIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, dayIndex)}
            >
              {/* Day header */}
              <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {dayLabel}
                </span>
              </div>

              {/* Session cards */}
              <div className="flex-1 p-2 space-y-2">
                {sessionsForDay(dayIndex).map((session) => {
                  const typeColors = SESSION_TYPE_COLORS[session.session_type];
                  const TypeIcon = SESSION_TYPE_ICONS[session.session_type];
                  return (
                    <div
                      key={session.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, session)}
                      onClick={() => openEditSession(session)}
                      className={`p-2 rounded-lg border-l-4 cursor-pointer hover:shadow-sm transition-shadow ${typeColors.bg} ${typeColors.border}`}
                    >
                      <div className="flex items-start gap-1.5">
                        <GripVertical
                          size={12}
                          className="text-zinc-400 mt-0.5 shrink-0 cursor-grab"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 mb-0.5">
                            <TypeIcon size={12} className={typeColors.text} />
                            <span
                              className={`text-xs font-semibold truncate ${typeColors.text}`}
                            >
                              {session.title}
                            </span>
                          </div>
                          <span
                            className={`inline-block text-[10px] px-1.5 py-0.5 rounded ${typeColors.text} ${typeColors.bg} font-medium`}
                          >
                            {session.session_subtype}
                          </span>
                          {session.duration_minutes && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-500">
                              <Clock size={10} />
                              {session.duration_minutes} min
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add button */}
              <div className="p-2 pt-0">
                <button
                  onClick={() => openNewSession(dayIndex)}
                  className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-zinc-500">
          Keine Woche ausgewahlt
        </div>
      )}

      {/* Session Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowModal(false)}
          />
          {/* Panel */}
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col h-full overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {editingSession ? "Session bearbeiten" : "Neue Session"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex-1 px-6 py-5 space-y-5">
              {/* Session type */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Typ
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map(
                    (type) => {
                      const colors = SESSION_TYPE_COLORS[type];
                      const Icon = SESSION_TYPE_ICONS[type];
                      const isActive = sessionForm.session_type === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleTypeChange(type)}
                          className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border-2 transition-colors text-xs font-medium ${
                            isActive
                              ? `${colors.border} ${colors.bg} ${colors.text}`
                              : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600"
                          }`}
                        >
                          <Icon size={18} />
                          {SESSION_TYPE_LABELS[type]}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Subtype */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Untertyp
                </label>
                <select
                  value={sessionForm.session_subtype}
                  onChange={(e) => handleSubtypeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                >
                  {SESSION_SUBTYPES[sessionForm.session_type].map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Titel
                </label>
                <input
                  type="text"
                  value={sessionForm.title}
                  onChange={(e) =>
                    setSessionForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Dauer (Minuten)
                </label>
                <input
                  type="number"
                  value={sessionForm.duration_minutes}
                  onChange={(e) =>
                    setSessionForm((prev) => ({
                      ...prev,
                      duration_minutes: parseInt(e.target.value) || 0,
                    }))
                  }
                  min={0}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>

              {/* Intensity */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Intensitat ({sessionForm.intensity}/10)
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={sessionForm.intensity}
                    onChange={(e) =>
                      setSessionForm((prev) => ({
                        ...prev,
                        intensity: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-zinc-900 dark:accent-white"
                  />
                  <div className="flex justify-between">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-6 h-2 rounded-full ${
                          i < sessionForm.intensity
                            ? INTENSITY_COLORS[i]
                            : "bg-zinc-200 dark:bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Beschreibung
                </label>
                <textarea
                  value={sessionForm.description}
                  onChange={(e) =>
                    setSessionForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white resize-none"
                  placeholder="Notizen zur Session..."
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              {editingSession ? (
                <button
                  onClick={deleteSession}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Loschen
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={saveSession}
                disabled={saving || !sessionForm.title}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium text-sm hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Speichere..." : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
