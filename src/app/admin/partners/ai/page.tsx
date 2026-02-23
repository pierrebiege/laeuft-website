"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Partner, CollaborationType } from "@/lib/supabase";
import {
  ArrowLeft,
  Send,
  Sparkles,
  Check,
  Pencil,
  Loader2,
  ImagePlus,
  X,
} from "lucide-react";

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

const SOURCES = [
  { value: "", label: "Quelle wählen (optional)" },
  { value: "Instagram DM", label: "Instagram DM" },
  { value: "E-Mail", label: "E-Mail" },
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "Telefon", label: "Telefon" },
  { value: "Event", label: "Event / Messe" },
  { value: "Website", label: "Website-Anfrage" },
  { value: "Empfehlung", label: "Empfehlung" },
  { value: "Sonstiges", label: "Sonstiges" },
];

type Step = "input" | "loading" | "review" | "saving" | "done";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

interface ImagePreview {
  data: string; // base64 without prefix
  media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  preview: string; // data URL for preview
  name: string;
}

export default function AIPartnerPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState("Pierre");

  const [step, setStep] = useState<Step>("input");
  const [message, setMessage] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);

  // Extracted data
  const [extracted, setExtracted] = useState<Partial<Partner> | null>(null);
  const [originalMessage, setOriginalMessage] = useState("");

  useEffect(() => {
    const r = document.cookie.match(/(?:^|; )admin_role=([^;]*)/);
    if (r && decodeURIComponent(r[1]) === "manager") setUser("Anes");
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 300) + "px";
    }
  }, [message]);

  const processFile = (file: File) => {
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ] as const;
    type ValidType = (typeof validTypes)[number];
    if (!validTypes.includes(file.type as ValidType)) return;
    if (file.size > 20 * 1024 * 1024) {
      setError("Bild zu gross (max. 20MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      setImages((prev) => [
        ...prev,
        {
          data: base64,
          media_type: file.type as ValidType,
          preview: dataUrl,
          name: file.name,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) processFile(file);
      }
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleExtract = async () => {
    if (!message.trim() && images.length === 0) return;
    setError("");
    setStep("loading");
    setOriginalMessage(message);

    try {
      const res = await fetch("/api/partners/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          source,
          images: images.map((img) => ({
            data: img.data,
            media_type: img.media_type,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler bei der Extraktion");
      }

      const data = await res.json();

      // Map to partner fields
      setExtracted({
        name: data.name || "",
        partner_type: data.partner_type || "Brand",
        category: data.category || "Sports",
        status: data.status || "Lead",
        collaboration_types: data.collaboration_types || [],
        contact_first_name: data.contact_first_name || "",
        contact_last_name: data.contact_last_name || "",
        contact_position: data.contact_position || "",
        contact_email: data.contact_email || "",
        contact_website: data.contact_website || "",
        instagram: data.instagram || "",
        source: data.source || source || "",
        value: data.value || "",
        notes: data.notes || "",
        tags: data.tags || [],
        status_date: today(),
        follow_up_date: null,
        last_contact: today(),
      });
      setStep("review");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unbekannter Fehler"
      );
      setStep("input");
    }
  };

  const updateField = (key: string, value: unknown) => {
    setExtracted((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const toggleCollab = (ct: CollaborationType) => {
    const current = extracted?.collaboration_types || [];
    if (current.includes(ct)) {
      updateField(
        "collaboration_types",
        current.filter((x) => x !== ct)
      );
    } else {
      updateField("collaboration_types", [...current, ct]);
    }
  };

  const handleSave = async () => {
    if (!extracted?.name?.trim()) return;
    setStep("saving");

    try {
      // Create partner
      const { data, error: dbError } = await supabase
        .from("partners")
        .insert(extracted)
        .select()
        .single();

      if (dbError || !data) {
        throw new Error(dbError?.message || "Fehler beim Speichern");
      }

      // Add creation history entry
      await supabase.from("partner_history").insert({
        partner_id: data.id,
        author: user,
        note: "Partner erstellt via AI-Assistent.",
        channel: "note",
        direction: "internal",
      });

      // Save original message as history entry
      const historyChannel =
        source === "Instagram DM"
          ? "instagram"
          : source === "E-Mail"
            ? "email"
            : source === "Telefon"
              ? "phone"
              : "note";

      await supabase.from("partner_history").insert({
        partner_id: data.id,
        author: user,
        note: originalMessage,
        channel: historyChannel,
        direction: "incoming",
      });

      setStep("done");

      // Redirect to partner page after short delay
      setTimeout(() => {
        router.push(`/admin/partners/${data.id}`);
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Fehler beim Speichern"
      );
      setStep("review");
    }
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

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl mb-4">
            <Sparkles size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            AI Partner-Erstellung
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            Nachricht oder Screenshot einfügen und Partner automatisch anlegen
          </p>
        </div>

        {/* Input Step */}
        {(step === "input" || step === "loading") && (
          <div className="space-y-4">
            {/* Source selector */}
            <div>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Image previews */}
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group w-20 h-20 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700"
                  >
                    <img
                      src={img.preview}
                      alt={img.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Message input */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPaste={handlePaste}
                placeholder={
                  images.length > 0
                    ? "Optional: zusätzliche Infos zum Screenshot..."
                    : "Nachricht hier einfügen... z.B. Instagram DM, E-Mail, oder Bild einfügen (Cmd+V)"
                }
                className="w-full px-4 py-3 pr-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none min-h-[120px]"
                disabled={step === "loading"}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = e.dataTransfer.files;
                  for (const file of Array.from(files)) {
                    if (file.type.startsWith("image/")) processFile(file);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleExtract();
                  }
                }}
                autoFocus
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files) {
                      for (const file of Array.from(files)) processFile(file);
                    }
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={step === "loading"}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-40"
                  title="Bild hinzufügen"
                >
                  <ImagePlus size={16} />
                </button>
                <button
                  onClick={handleExtract}
                  disabled={
                    (!message.trim() && images.length === 0) ||
                    step === "loading"
                  }
                  className="p-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-lg hover:from-violet-600 hover:to-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {step === "loading" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>

            {step === "loading" && (
              <div className="flex items-center justify-center gap-2 text-sm text-violet-600 dark:text-violet-400">
                <Loader2 size={14} className="animate-spin" />
                Analysiere Nachricht...
              </div>
            )}

            {error && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <p className="text-xs text-zinc-400 text-center">
              Cmd+Enter zum Senden. Screenshots per Cmd+V einfügen oder Bild
              hochladen. Die AI erkennt automatisch Partner-Name, Kontaktdaten,
              Instagram und mehr.
            </p>
          </div>
        )}

        {/* Review Step */}
        {(step === "review" || step === "saving") && extracted && (
          <div className="space-y-4">
            {/* Original message/images preview */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
              <div className="text-xs font-medium text-zinc-500 mb-2">
                {images.length > 0 ? "Originaldaten" : "Originalnachricht"}
              </div>
              {images.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-2">
                  {images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.preview}
                      alt={img.name}
                      className="w-16 h-16 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
                    />
                  ))}
                </div>
              )}
              {originalMessage && (
                <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                  {originalMessage}
                </div>
              )}
            </div>

            {/* Extracted fields */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-violet-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Erkannte Daten
                </h2>
                <span className="text-xs text-zinc-400">
                  Felder können bearbeitet werden
                </span>
              </div>

              {/* Name + Type */}
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Partner Name *"
                  value={extracted.name || ""}
                  onChange={(v) => updateField("name", v)}
                  highlight={!!extracted.name}
                />
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Typ
                  </label>
                  <select
                    value={extracted.partner_type || "Brand"}
                    onChange={(e) => updateField("partner_type", e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {["Brand", "Athlete", "Team", "Verband"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Kategorie
                  </label>
                  <select
                    value={extracted.category || "Sports"}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {[
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
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">
                    Status
                  </label>
                  <select
                    value={extracted.status || "Lead"}
                    onChange={(e) => updateField("status", e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {[
                      "Lead",
                      "Negotiating",
                      "Active",
                      "Closed",
                      "Declined",
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Collaboration types */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Zusammenarbeitsform
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COLLABORATION_TYPES.map((ct) => {
                    const active = (
                      extracted.collaboration_types || []
                    ).includes(ct);
                    return (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => toggleCollab(ct)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          active
                            ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 ring-1 ring-violet-300 dark:ring-violet-700"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {ct}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <label className="block text-xs font-medium text-zinc-500 mb-2">
                  Kontaktperson
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Vorname"
                    value={extracted.contact_first_name || ""}
                    onChange={(v) => updateField("contact_first_name", v)}
                    highlight={!!extracted.contact_first_name}
                  />
                  <Field
                    label="Nachname"
                    value={extracted.contact_last_name || ""}
                    onChange={(v) => updateField("contact_last_name", v)}
                    highlight={!!extracted.contact_last_name}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Field
                    label="Position"
                    value={extracted.contact_position || ""}
                    onChange={(v) => updateField("contact_position", v)}
                    highlight={!!extracted.contact_position}
                  />
                  <Field
                    label="E-Mail"
                    value={extracted.contact_email || ""}
                    onChange={(v) => updateField("contact_email", v)}
                    highlight={!!extracted.contact_email}
                  />
                </div>
                <div className="mt-3">
                  <Field
                    label="Webseite"
                    value={extracted.contact_website || ""}
                    onChange={(v) => updateField("contact_website", v)}
                    highlight={!!extracted.contact_website}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Instagram"
                    value={extracted.instagram || ""}
                    onChange={(v) => updateField("instagram", v)}
                    highlight={!!extracted.instagram}
                  />
                  <Field
                    label="Quelle"
                    value={extracted.source || ""}
                    onChange={(v) => updateField("source", v)}
                    highlight={!!extracted.source}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Field
                    label="Deal-Wert"
                    value={extracted.value || ""}
                    onChange={(v) => updateField("value", v)}
                    highlight={!!extracted.value}
                  />
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">
                      Follow-up
                    </label>
                    <input
                      type="date"
                      value={extracted.follow_up_date || ""}
                      onChange={(e) =>
                        updateField(
                          "follow_up_date",
                          e.target.value || null
                        )
                      }
                      className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Bemerkungen
                </label>
                <textarea
                  value={extracted.notes || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className={`w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none min-h-[60px] ${
                    extracted.notes
                      ? "border-violet-200 dark:border-violet-800"
                      : "border-zinc-200 dark:border-zinc-700"
                  }`}
                />
              </div>

              {/* Tags */}
              {(extracted.tags || []).length > 0 && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(extracted.tags || []).map((t) => (
                      <span
                        key={t}
                        onClick={() =>
                          updateField(
                            "tags",
                            (extracted.tags || []).filter((x) => x !== t)
                          )
                        }
                        className="px-2 py-0.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded text-xs cursor-pointer hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                      >
                        {t} &times;
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setStep("input");
                  setExtracted(null);
                  setError("");
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <Pencil size={14} />
                Nachricht ändern
              </button>
              <button
                onClick={handleSave}
                disabled={step === "saving" || !extracted.name?.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-violet-600 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                {step === "saving" ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Partner erstellen
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Done Step */}
        {step === "done" && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
              <Check size={28} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Partner erstellt!
            </h2>
            <p className="text-sm text-zinc-500">
              Weiterleitung zur Partner-Seite...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable field component with highlight for AI-extracted values
function Field({
  label,
  value,
  onChange,
  highlight,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  highlight?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 mb-1">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
          highlight
            ? "border-violet-200 dark:border-violet-800"
            : "border-zinc-200 dark:border-zinc-700"
        }`}
      />
    </div>
  );
}
