"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Library,
  Plus,
  Search,
  X,
  Trash2,
  Footprints,
  Dumbbell,
  Wind,
  Moon,
  Image,
  Video,
} from "lucide-react";
import type { Exercise, SessionType } from "@/lib/supabase";
import {
  SESSION_TYPE_LABELS,
  SESSION_TYPE_COLORS,
  MUSCLE_GROUPS,
} from "@/lib/supabase";

const SESSION_TYPE_ICONS: Record<SessionType, React.ElementType> = {
  lauf: Footprints,
  kraft: Dumbbell,
  mobility: Wind,
  ruhe: Moon,
};

const CATEGORY_TABS: { value: SessionType | "alle"; label: string }[] = [
  { value: "alle", label: "Alle" },
  { value: "kraft", label: "Kraft" },
  { value: "mobility", label: "Mobility" },
  { value: "lauf", label: "Lauf" },
  { value: "ruhe", label: "Ruhe" },
];

interface ExerciseFormData {
  name: string;
  category: SessionType;
  muscle_group: string;
  description: string;
  instructions: string;
  video_url: string;
  image_url: string;
}

const defaultForm: ExerciseFormData = {
  name: "",
  category: "kraft",
  muscle_group: "",
  description: "",
  instructions: "",
  video_url: "",
  image_url: "",
};

function getVideoEmbedUrl(url: string): string | null {
  const yt = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
  );
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vim = url.match(/vimeo\.com\/(\d+)/);
  if (vim) return `https://player.vimeo.com/video/${vim[1]}`;
  return null;
}

export default function ExerciseLibraryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SessionType | "alle">("alle");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [form, setForm] = useState<ExerciseFormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  const loadExercises = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeTab !== "alle") params.set("category", activeTab);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      const res = await fetch(`/api/exercises?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExercises(data || []);
      }
    } catch (err) {
      console.error("Error loading exercises:", err);
    }
    setLoading(false);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    setLoading(true);
    loadExercises();
  }, [loadExercises]);

  function openNewExercise() {
    setEditingExercise(null);
    setForm({ ...defaultForm });
    setShowPanel(true);
  }

  function openEditExercise(exercise: Exercise) {
    setEditingExercise(exercise);
    setForm({
      name: exercise.name,
      category: exercise.category,
      muscle_group: exercise.muscle_group || "",
      description: exercise.description || "",
      instructions: exercise.instructions || "",
      video_url: exercise.video_url || "",
      image_url: exercise.image_url || "",
    });
    setShowPanel(true);
  }

  async function saveExercise() {
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name,
      category: form.category,
      muscle_group: form.muscle_group || null,
      description: form.description || null,
      instructions: form.instructions || null,
      video_url: form.video_url || null,
      image_url: form.image_url || null,
    };

    try {
      if (editingExercise) {
        await fetch(`/api/exercises/${editingExercise.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/exercises", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setShowPanel(false);
      await loadExercises();
    } catch {
      alert("Fehler beim Speichern");
    }
    setSaving(false);
  }

  async function deleteExercise() {
    if (!editingExercise || !confirm("Ubung unwiderruflich loschen?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/exercises/${editingExercise.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowPanel(false);
        await loadExercises();
      } else {
        alert("Fehler beim Loschen");
      }
    } catch {
      alert("Verbindungsfehler");
    }
    setSaving(false);
  }

  const videoEmbed = form.video_url ? getVideoEmbedUrl(form.video_url) : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Ubungsbibliothek
          </h1>
          <p className="text-zinc-500 mt-1">
            Verwalte deine Ubungen fur Trainingsplane
          </p>
        </div>
        <button
          onClick={openNewExercise}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          <Plus size={18} />
          Neue Ubung
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ubung suchen..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Exercise Grid */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Laden...</div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Library size={32} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3" />
          <p className="text-zinc-500 mb-4">Keine Ubungen gefunden</p>
          <button
            onClick={openNewExercise}
            className="inline-flex items-center gap-2 text-zinc-900 dark:text-white font-medium hover:underline"
          >
            <Plus size={16} />
            Erste Ubung erstellen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((exercise) => {
            const colors = SESSION_TYPE_COLORS[exercise.category];
            const Icon = SESSION_TYPE_ICONS[exercise.category];
            return (
              <button
                key={exercise.id}
                onClick={() => openEditExercise(exercise)}
                className="text-left bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-sm transition-all"
              >
                {/* Image or Placeholder */}
                {exercise.image_url ? (
                  <div className="h-36 w-full overflow-hidden">
                    <img
                      src={exercise.image_url}
                      alt={exercise.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`h-36 w-full flex items-center justify-center ${colors.bg}`}
                  >
                    <Icon size={40} className={`${colors.text} opacity-40`} />
                  </div>
                )}

                {/* Card Body */}
                <div className="p-4">
                  <h3 className="font-bold text-zinc-900 dark:text-white mb-2 truncate">
                    {exercise.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                    >
                      <Icon size={10} />
                      {SESSION_TYPE_LABELS[exercise.category]}
                    </span>
                    {exercise.muscle_group && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                        {exercise.muscle_group}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Slide-in Panel */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowPanel(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {editingExercise ? "Ubung bearbeiten" : "Neue Ubung"}
              </h2>
              <button
                onClick={() => setShowPanel(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 px-6 py-5 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="z.B. Bulgarian Split Squat"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Kategorie
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map(
                    (type) => {
                      const colors = SESSION_TYPE_COLORS[type];
                      const Icon = SESSION_TYPE_ICONS[type];
                      const isActive = form.category === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, category: type }))
                          }
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

              {/* Muscle Group */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Muskelgruppe
                </label>
                <select
                  value={form.muscle_group}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      muscle_group: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                >
                  <option value="">-- Keine --</option>
                  {MUSCLE_GROUPS.map((mg) => (
                    <option key={mg} value={mg}>
                      {mg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Beschreibung
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Kurze Beschreibung der Ubung..."
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white resize-none"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Ausfuhrung
                </label>
                <textarea
                  value={form.instructions}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Detaillierte Anleitung zur korrekten Ausfuhrung..."
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white resize-none"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Video size={14} />
                    Video URL
                  </span>
                </label>
                <input
                  type="url"
                  value={form.video_url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, video_url: e.target.value }))
                  }
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                />
                {videoEmbed && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    <iframe
                      src={videoEmbed}
                      className="w-full aspect-video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Image size={14} />
                    Bild URL
                  </span>
                </label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, image_url: e.target.value }))
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                />
                {form.image_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    <img
                      src={form.image_url}
                      alt="Vorschau"
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              {editingExercise ? (
                <button
                  onClick={deleteExercise}
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
                onClick={saveExercise}
                disabled={saving || !form.name.trim()}
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
