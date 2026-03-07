"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAdminRole } from "@/components/admin/AdminRoleContext";
import type {
  Partner,
  PartnerType,
  PartnerStatus,
  CollaborationType,
} from "@/lib/supabase";
import { POTENTIAL_LEVELS, FIT_LEVELS } from "@/lib/supabase";
import { ArrowLeft, Upload, X } from "lucide-react";

const PARTNER_TYPES: PartnerType[] = ["Brand", "Athlete/Persönlichkeiten", "Event", "NPO", "Medien"];
const CATEGORIES = [
  "Sports",
  "Tech",
  "Lifestyle",
  "Nutrition",
  "Fashion",
  "Travel",
  "Finance",
  "Health",
  "Media",
  "Other",
];
const STATUSES: PartnerStatus[] = [
  "Lead",
  "Negotiating",
  "Active",
  "Closed",
  "Declined",
];
const COLLABORATION_TYPES: CollaborationType[] = [
  "Sponsoring",
  "Ambassador",
  "Product Placement",
  "Event",
  "Barter Deal",
  "Content Creation",
  "Affiliate",
  "Sonstiges",
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export default function NewPartnerPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [tagIn, setTagIn] = useState("");
  const role = useAdminRole();
  const user = role === "manager" ? "Anes" : "Pierre";
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("partners").select("tags");
      const tags = new Set<string>();
      (data || []).forEach((p) => (p.tags || []).forEach((t: string) => tags.add(t)));
      setAllTags(Array.from(tags).sort());
    })();
  }, []);

  const [f, setF] = useState<Partial<Partner>>({
    name: "",
    partner_type: "Brand",
    category: "Sports",
    status: "Lead",
    collaboration_types: [],
    contact_first_name: "",
    contact_last_name: "",
    contact_position: "",
    contact_email: "",
    contact_website: "",
    instagram: "",
    source: "",
    value: "",
    notes: "",
    status_date: today(),
    follow_up_date: null,
    last_contact: null,
    tags: [],
    potenzial: null,
    fit: null,
  });

  const set = (k: string, v: unknown) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const toggleCollab = (ct: CollaborationType) => {
    const current = f.collaboration_types || [];
    if (current.includes(ct)) {
      set(
        "collaboration_types",
        current.filter((x) => x !== ct)
      );
    } else {
      set("collaboration_types", [...current, ct]);
    }
  };

  const addTag = () => {
    if (tagIn.trim()) {
      set("tags", [...(f.tags || []), tagIn.trim()]);
      setTagIn("");
    }
  };

  const handleSave = async () => {
    if (!f.name?.trim()) return;
    setSaving(true);

    // Create partner
    const { data, error } = await supabase
      .from("partners")
      .insert(f)
      .select()
      .single();

    if (error || !data) {
      alert("Fehler: " + (error?.message || "Unbekannt"));
      setSaving(false);
      return;
    }

    // Add history entry
    await supabase.from("partner_history").insert({
      partner_id: data.id,
      author: user,
      note: "Partner erstellt.",
    });

    // Upload files
    for (const file of pendingFiles) {
      const filePath = `${data.id}/${Date.now()}_${file.name}`;
      await supabase.storage
        .from("partner-attachments")
        .upload(filePath, file);

      await supabase.from("partner_attachments").insert({
        partner_id: data.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user,
      });
    }

    router.push(`/admin/partners/${data.id}`);
  };

  return (
    <div>
      <button
        onClick={() => router.push("/admin/partners")}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Zurück zu Partners
      </button>

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">
        Neuer Partner
      </h1>

      <div className="max-w-2xl space-y-6">
        {/* Grunddaten */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Grunddaten
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Partner Name *
              </label>
              <input
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                value={f.name || ""}
                onChange={(e) => set("name", e.target.value)}
                placeholder="z.B. On Running"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Partner-Typ
              </label>
              <select
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                value={f.partner_type || "Brand"}
                onChange={(e) => set("partner_type", e.target.value)}
              >
                {PARTNER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Kategorie
              </label>
              <select
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                value={f.category || "Sports"}
                onChange={(e) => set("category", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Status
              </label>
              <select
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                value={f.status || "Lead"}
                onChange={(e) => set("status", e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Potenzial
              </label>
              <select
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                value={f.potenzial || ""}
                onChange={(e) => set("potenzial", e.target.value || null)}
              >
                <option value="">– Nicht gesetzt –</option>
                {POTENTIAL_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Fit
              </label>
              <select
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                value={f.fit || ""}
                onChange={(e) => set("fit", e.target.value || null)}
              >
                <option value="">– Nicht gesetzt –</option>
                {FIT_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Zusammenarbeitsform */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Zusammenarbeitsform
          </h2>
          <div className="flex flex-wrap gap-2">
            {COLLABORATION_TYPES.map((ct) => {
              const active = (f.collaboration_types || []).includes(ct);
              return (
                <button
                  key={ct}
                  type="button"
                  onClick={() => toggleCollab(ct)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {ct}
                </button>
              );
            })}
          </div>
        </div>

        {/* Kontaktperson */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Kontaktperson
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              value={f.contact_first_name || ""}
              onChange={(e) => set("contact_first_name", e.target.value)}
              placeholder="Vorname"
            />
            <input
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              value={f.contact_last_name || ""}
              onChange={(e) => set("contact_last_name", e.target.value)}
              placeholder="Name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              value={f.contact_position || ""}
              onChange={(e) => set("contact_position", e.target.value)}
              placeholder="Position"
            />
            <input
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              type="email"
              value={f.contact_email || ""}
              onChange={(e) => set("contact_email", e.target.value)}
              placeholder="E-Mail"
            />
          </div>
          <input
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
            value={f.contact_website || ""}
            onChange={(e) => set("contact_website", e.target.value)}
            placeholder="Webseite (z.B. https://on-running.com)"
          />
        </div>

        {/* Details */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Instagram
              </label>
              <input
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                value={f.instagram || ""}
                onChange={(e) => set("instagram", e.target.value)}
                placeholder="@brand"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Quelle
              </label>
              <input
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                value={f.source || ""}
                onChange={(e) => set("source", e.target.value)}
                placeholder="Instagram DM"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Deal-Wert
              </label>
              <input
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                value={f.value || ""}
                onChange={(e) => set("value", e.target.value)}
                placeholder="CHF 2'500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                Follow-up Datum
              </label>
              <input
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                type="date"
                value={f.follow_up_date || ""}
                onChange={(e) =>
                  set("follow_up_date", e.target.value || null)
                }
              />
            </div>
          </div>
        </div>

        {/* Bemerkungen */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Aktueller Stand - Bemerkungen
          </h2>
          <textarea
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white min-h-[80px]"
            value={f.notes || ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Deal-Details, nächste Schritte…"
          />
        </div>

        {/* Anhang */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Anhänge
          </h2>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              drag
                ? "border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
            }`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const file = e.dataTransfer.files?.[0];
              if (file) setPendingFiles((prev) => [...prev, file]);
            }}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPendingFiles((prev) => [...prev, file]);
                e.target.value = "";
              }}
            />
            <Upload size={20} className="mx-auto text-zinc-400 mb-2" />
            <div className="text-sm text-zinc-500">
              Datei hierher ziehen oder klicken
            </div>
          </div>
          {pendingFiles.length > 0 && (
            <div className="space-y-2">
              {pendingFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {formatSize(file.size)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingFiles((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                    className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Tags
          </h2>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              value={tagIn}
              onChange={(e) => setTagIn(e.target.value)}
              placeholder="Tag hinzufügen…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              +
            </button>
          </div>
          {(f.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(f.tags || []).map((t) => (
                <span
                  key={t}
                  onClick={() =>
                    set(
                      "tags",
                      (f.tags || []).filter((x) => x !== t)
                    )
                  }
                  className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs cursor-pointer hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                >
                  {t} &times;
                </span>
              ))}
            </div>
          )}
          {allTags.filter((t) => !(f.tags || []).includes(t)).length > 0 && (
            <div>
              <div className="text-[10px] text-zinc-400 mb-1">Vorhandene Tags:</div>
              <div className="flex flex-wrap gap-1.5">
                {allTags
                  .filter((t) => !(f.tags || []).includes(t))
                  .filter((t) => !tagIn || t.toLowerCase().includes(tagIn.toLowerCase()))
                  .map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("tags", [...(f.tags || []), t])}
                      className="px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 rounded text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-700"
                    >
                      + {t}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 pb-8">
          <button
            onClick={() => router.push("/admin/partners")}
            className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !f.name?.trim()}
            className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {saving ? "Wird gespeichert…" : "Partner erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}
