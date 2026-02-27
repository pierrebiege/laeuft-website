"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Partner, PartnerType, PartnerStatus, CollaborationType, SortOption } from "@/lib/supabase";
import { calcPriority, priorityOrder, parseValue, POTENTIAL_LEVELS, FIT_LEVELS, SORT_OPTIONS, PRIORITY_COLORS } from "@/lib/supabase";
import {
  Plus,
  Search,
  Building2,
  User,
  CalendarDays,
  Heart,
  Newspaper,
  Paperclip,
  ArrowUpRight,
  AlertTriangle,
  SlidersHorizontal,
  X,
  Sparkles,
  Clock,
  MessageCircle,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Send,
  Check,
  Pencil,
  Loader2,
  ImagePlus,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────

const STATUSES: PartnerStatus[] = [
  "Lead",
  "Negotiating",
  "Active",
  "Closed",
  "Declined",
];
const TYPES: PartnerType[] = ["Brand", "Athlete/Persönlichkeiten", "Event", "NPO", "Medien"];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Lead: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300" },
  Negotiating: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300" },
  Active: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300" },
  Closed: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-500 dark:text-zinc-400" },
  Declined: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300" },
};

const TYPE_ICONS: Record<string, typeof Building2> = {
  Brand: Building2,
  "Athlete/Persönlichkeiten": User,
  Event: CalendarDays,
  NPO: Heart,
  Medien: Newspaper,
};

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

// ── Helpers ────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - d.getTime()) / 86400000);
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// ── Interfaces ─────────────────────────────────────────────────────

interface ActionItem {
  icon: typeof AlertTriangle;
  color: string;
  label: string;
  partnerId: string;
  partnerName: string;
  detail: string;
  priority: number;
}

interface ImagePreview {
  data: string;
  media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  preview: string;
  name: string;
}

type AIStep = "input" | "loading" | "review" | "saving" | "done";

// ── Action Board logic ─────────────────────────────────────────────

function computeActions(allPartners: Partner[]): ActionItem[] {
  const actions: ActionItem[] = [];

  for (const p of allPartners) {
    if (p.status === "Closed" || p.status === "Declined") continue;

    if (p.follow_up_date) {
      const days = daysUntil(p.follow_up_date);
      if (days < 0) {
        actions.push({
          icon: AlertTriangle,
          color: "text-red-600 dark:text-red-400",
          label: "Follow-up überfällig",
          partnerId: p.id,
          partnerName: p.name,
          detail: `seit ${Math.abs(days)} Tag${Math.abs(days) !== 1 ? "en" : ""}`,
          priority: 0,
        });
      } else if (days <= 3 && days >= 0) {
        actions.push({
          icon: CalendarClock,
          color: "text-amber-600 dark:text-amber-400",
          label: "Follow-up bald",
          partnerId: p.id,
          partnerName: p.name,
          detail: days === 0 ? "heute" : `in ${days} Tag${days !== 1 ? "en" : ""}`,
          priority: 1,
        });
      }
    }

    if (p.status === "Lead" || p.status === "Negotiating") {
      const days = daysSince(p.last_contact);
      if (days === null || days > 14) {
        actions.push({
          icon: MessageCircle,
          color: "text-blue-600 dark:text-blue-400",
          label: "Keine Rückmeldung",
          partnerId: p.id,
          partnerName: p.name,
          detail: days === null ? "noch nie kontaktiert" : `seit ${days} Tagen`,
          priority: days === null ? 2 : 3,
        });
      }

      if (!p.follow_up_date) {
        actions.push({
          icon: Clock,
          color: "text-zinc-500",
          label: "Kein Follow-up",
          partnerId: p.id,
          partnerName: p.name,
          detail: "Follow-up Datum setzen",
          priority: 4,
        });
      }
    }
  }

  return actions.sort((a, b) => a.priority - b.priority);
}

// ── Field component ────────────────────────────────────────────────

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

// ── Main Page ──────────────────────────────────────────────────────

export default function PartnersPage() {
  const router = useRouter();

  // Partner list state
  const [partners, setPartners] = useState<Partner[]>([]);
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [potenzialFilter, setPotenzialFilter] = useState<string>("All");
  const [fitFilter, setFitFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [showActions, setShowActions] = useState(true);

  // AI state
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState("Pierre");
  const [aiStep, setAiStep] = useState<AIStep>("input");
  const [aiMessage, setAiMessage] = useState("");
  const [aiSource, setAiSource] = useState("");
  const [aiError, setAiError] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [extracted, setExtracted] = useState<Partial<Partner> | null>(null);
  const [originalMessage, setOriginalMessage] = useState("");
  const [formattedHistory, setFormattedHistory] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);

  // ── Effects ────────────────────────────────────────────────────

  // User from cookie
  useEffect(() => {
    const r = document.cookie.match(/(?:^|; )admin_role=([^;]*)/);
    if (r && decodeURIComponent(r[1]) === "manager") setUser("Anes");
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Load all partners once (for stats + action board)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("partners")
        .select("*")
        .order("updated_at", { ascending: false });
      setAllPartners((data || []) as Partner[]);
    })();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [aiMessage]);

  const loadPartners = useCallback(async () => {
    let query = supabase
      .from("partners")
      .select("*, partner_attachments(id)")
      .order("updated_at", { ascending: false });

    if (statusFilter !== "All") query = query.eq("status", statusFilter);
    if (typeFilter !== "All") query = query.eq("partner_type", typeFilter);
    if (potenzialFilter !== "All") query = query.eq("potenzial", potenzialFilter);
    if (fitFilter !== "All") query = query.eq("fit", fitFilter);
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,contact_first_name.ilike.%${search}%,contact_last_name.ilike.%${search}%,contact_email.ilike.%${search}%`
      );
    }

    const { data } = await query;

    const mapped = (data || []).map((p) => ({
      ...p,
      attachment_count: p.partner_attachments?.length || 0,
      partner_attachments: undefined,
    }));

    setPartners(mapped as Partner[]);
    setLoading(false);
  }, [statusFilter, typeFilter, potenzialFilter, fitFilter, search]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  // ── AI functions ───────────────────────────────────────────────

  const processFile = (file: File) => {
    if (file.type === "application/pdf") {
      if (file.size > 20 * 1024 * 1024) {
        setAiError("Datei zu gross (max. 20MB)");
        return;
      }
      setPendingFiles((prev) => [...prev, file]);
      return;
    }

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ] as const;
    type ValidType = (typeof validTypes)[number];
    if (!validTypes.includes(file.type as ValidType)) return;
    if (file.size > 20 * 1024 * 1024) {
      setAiError("Bild zu gross (max. 20MB)");
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
    if (!aiMessage.trim() && images.length === 0) return;
    setAiError("");
    setAiStep("loading");
    setOriginalMessage(aiMessage);

    try {
      const res = await fetch("/api/partners/ai-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: aiMessage,
          source: aiSource,
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
        source: data.source || aiSource || "",
        value: data.value || "",
        notes: data.notes || "",
        tags: data.tags || [],
        status_date: today(),
        follow_up_date: null,
        last_contact: today(),
      });
      setFormattedHistory(data.formatted_history || "");
      setAiStep("review");
      setShowReviewModal(true);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : "Unbekannter Fehler"
      );
      setAiStep("input");
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
    setAiStep("saving");

    try {
      const { data, error: dbError } = await supabase
        .from("partners")
        .insert(extracted)
        .select()
        .single();

      if (dbError || !data) {
        throw new Error(dbError?.message || "Fehler beim Speichern");
      }

      await supabase.from("partner_history").insert({
        partner_id: data.id,
        author: user,
        note: "Partner erstellt via AI-Assistent.",
        channel: "note",
        direction: "internal",
      });

      const historyNote = formattedHistory || originalMessage;
      if (historyNote.trim()) {
        const historyChannel =
          aiSource === "Instagram DM"
            ? "instagram"
            : aiSource === "E-Mail"
              ? "email"
              : aiSource === "Telefon"
                ? "phone"
                : "note";

        await supabase.from("partner_history").insert({
          partner_id: data.id,
          author: user,
          note: historyNote,
          channel: historyChannel,
          direction: "incoming",
        });
      }

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

      for (const img of images) {
        const ext = img.media_type.split("/")[1] || "png";
        const fileName = img.name || `screenshot_${Date.now()}.${ext}`;
        const filePath = `${data.id}/${Date.now()}_${fileName}`;

        const byteChars = atob(img.data);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteArray[i] = byteChars.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: img.media_type });

        await supabase.storage
          .from("partner-attachments")
          .upload(filePath, blob);

        await supabase.from("partner_attachments").insert({
          partner_id: data.id,
          file_name: fileName,
          file_path: filePath,
          file_size: blob.size,
          mime_type: img.media_type,
          uploaded_by: user,
        });
      }

      setAiStep("done");
      setShowReviewModal(false);

      setTimeout(() => {
        router.push(`/admin/partners/${data.id}`);
      }, 1500);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : "Fehler beim Speichern"
      );
      setAiStep("review");
    }
  };

  const resetAI = () => {
    setAiStep("input");
    setAiMessage("");
    setAiSource("");
    setAiError("");
    setImages([]);
    setPendingFiles([]);
    setExtracted(null);
    setOriginalMessage("");
    setFormattedHistory("");
    setShowReviewModal(false);
  };

  // ── Computed values ────────────────────────────────────────────

  const sortedPartners = useMemo(() => {
    const list = [...partners];
    switch (sortBy) {
      case "priority":
        list.sort((a, b) => {
          const pa = priorityOrder(calcPriority(a.potenzial, a.fit));
          const pb = priorityOrder(calcPriority(b.potenzial, b.fit));
          if (pa !== pb) return pa - pb;
          return parseValue(b.value) - parseValue(a.value);
        });
        break;
      case "value":
        list.sort((a, b) => parseValue(b.value) - parseValue(a.value));
        break;
      case "last_contact":
        list.sort((a, b) => {
          if (!a.last_contact && !b.last_contact) return 0;
          if (!a.last_contact) return 1;
          if (!b.last_contact) return -1;
          return a.last_contact.localeCompare(b.last_contact);
        });
        break;
      case "follow_up":
        list.sort((a, b) => {
          if (!a.follow_up_date && !b.follow_up_date) return 0;
          if (!a.follow_up_date) return 1;
          if (!b.follow_up_date) return -1;
          return a.follow_up_date.localeCompare(b.follow_up_date);
        });
        break;
      default:
        break;
    }
    return list;
  }, [partners, sortBy]);

  const activeCount = allPartners.filter((p) => p.status === "Active").length;
  const pipelineCount = allPartners.filter(
    (p) => p.status === "Lead" || p.status === "Negotiating"
  ).length;
  const actions = computeActions(allPartners);

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div>
      {/* Header — compact stats inline */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Partners
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {allPartners.length} Partner
            {activeCount > 0 && ` · ${activeCount} aktiv`}
            {pipelineCount > 0 && ` · ${pipelineCount} in Pipeline`}
          </p>
        </div>
        <Link
          href="/admin/partners/neu"
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          <Plus size={16} />
          Neuer Partner
        </Link>
      </div>

      {/* AI Input Bar */}
      <div className="mb-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-start gap-3">
          {/* Source dropdown — compact */}
          <select
            value={aiSource}
            onChange={(e) => setAiSource(e.target.value)}
            className="shrink-0 px-2.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 w-[130px]"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              onPaste={handlePaste}
              placeholder="Nachricht, Screenshot oder Dokument einfügen — AI erkennt Partner automatisch"
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none min-h-[40px] max-h-[200px]"
              rows={1}
              disabled={aiStep === "loading"}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const files = e.dataTransfer.files;
                for (const file of Array.from(files)) {
                  if (
                    file.type.startsWith("image/") ||
                    file.type === "application/pdf"
                  )
                    processFile(file);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleExtract();
                }
              }}
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
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
              disabled={aiStep === "loading"}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors disabled:opacity-40 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="Bild/PDF hinzufügen"
            >
              <ImagePlus size={16} />
            </button>
            <button
              onClick={handleExtract}
              disabled={
                (!aiMessage.trim() && images.length === 0) ||
                aiStep === "loading"
              }
              className="p-2 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-lg hover:from-violet-600 hover:to-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="AI Extraktion starten (Cmd+Enter)"
            >
              {aiStep === "loading" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Image/PDF previews */}
        {(images.length > 0 || pendingFiles.length > 0) && (
          <div className="flex gap-2 flex-wrap mt-3">
            {images.map((img, idx) => (
              <div
                key={`img-${idx}`}
                className="relative group w-16 h-16 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700"
              >
                <img
                  src={img.preview}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {pendingFiles.map((file, idx) => (
              <div
                key={`pdf-${idx}`}
                className="relative group w-16 h-16 rounded-lg border border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-800"
              >
                <span className="text-sm">📄</span>
                <span className="text-[9px] text-zinc-500 truncate max-w-[56px] px-0.5">
                  {file.name}
                </span>
                <button
                  onClick={() =>
                    setPendingFiles((prev) =>
                      prev.filter((_, i) => i !== idx)
                    )
                  }
                  className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator */}
        {aiStep === "loading" && (
          <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400 mt-3">
            <Loader2 size={12} className="animate-spin" />
            Analysiere Nachricht...
          </div>
        )}

        {/* Error */}
        {aiError && (
          <div className="mt-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300">
            {aiError}
          </div>
        )}

        {/* Done message */}
        {aiStep === "done" && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 mt-3">
            <Check size={12} />
            Partner erstellt! Weiterleitung...
          </div>
        )}
      </div>

      {/* Review Modal — fullscreen overlay */}
      {showReviewModal && extracted && (aiStep === "review" || aiStep === "saving") && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl mx-4 my-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-violet-500" />
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Erkannte Daten
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setAiStep("input");
                  setExtracted(null);
                  setAiError("");
                }}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Formatted conversation history */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-zinc-500">
                    Konversation (wird im Aktivitäts-Log gespeichert)
                  </div>
                  {images.length > 0 && (
                    <div className="flex gap-1.5">
                      {images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.preview}
                          alt={img.name}
                          className="w-8 h-8 rounded object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <textarea
                  value={formattedHistory || originalMessage}
                  onChange={(e) => setFormattedHistory(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none min-h-[80px] max-h-[200px]"
                />
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
                    {["Brand", "Athlete/Persönlichkeiten", "Event", "NPO", "Medien"].map((t) => (
                      <option key={t} value={t}>{t}</option>
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
                    {["Sports", "Tech", "Lifestyle", "Nutrition", "Fashion", "Travel", "Finance", "Health", "Media", "Other"].map((c) => (
                      <option key={c} value={c}>{c}</option>
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
                    {["Lead", "Negotiating", "Active", "Closed", "Declined"].map((s) => (
                      <option key={s} value={s}>{s}</option>
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
                    const active = (extracted.collaboration_types || []).includes(ct);
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
                        updateField("follow_up_date", e.target.value || null)
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

              {/* Error in modal */}
              {aiError && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                  {aiError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setAiStep("input");
                  setExtracted(null);
                  setAiError("");
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <Pencil size={14} />
                Nachricht ändern
              </button>
              <button
                onClick={handleSave}
                disabled={aiStep === "saving" || !extracted.name?.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-violet-600 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                {aiStep === "saving" ? (
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
        </div>
      )}

      {/* Action Board */}
      {actions.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => setShowActions(!showActions)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            To Do
            <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-bold normal-case">
              {actions.length}
            </span>
            {showActions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showActions && (
            <div className="space-y-1.5">
              {actions.slice(0, 8).map((a, idx) => {
                const Icon = a.icon;
                return (
                  <Link
                    key={`${a.partnerId}-${idx}`}
                    href={`/admin/partners/${a.partnerId}`}
                    className="flex items-center gap-3 px-3.5 py-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group"
                  >
                    <Icon size={14} className={`${a.color} shrink-0`} />
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {a.partnerName}
                      </span>
                      <span className={`text-xs font-medium ${a.color}`}>
                        {a.label}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 shrink-0">
                      {a.detail}
                    </span>
                    <ArrowUpRight
                      size={12}
                      className="text-zinc-300 group-hover:text-zinc-500 shrink-0 transition-colors"
                    />
                  </Link>
                );
              })}
              {actions.length > 8 && (
                <div className="text-xs text-zinc-400 px-3.5 py-1">
                  +{actions.length - 8} weitere
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
            placeholder="Suchen…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Filter Button */}
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              statusFilter !== "All" || typeFilter !== "All"
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
            }`}
          >
            <SlidersHorizontal size={14} />
            Filter
            {(statusFilter !== "All" || typeFilter !== "All" || potenzialFilter !== "All" || fitFilter !== "All") && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 dark:bg-black/20 rounded text-xs">
                {(statusFilter !== "All" ? 1 : 0) + (typeFilter !== "All" ? 1 : 0) + (potenzialFilter !== "All" ? 1 : 0) + (fitFilter !== "All" ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Filter Dropdown */}
          {showFilters && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowFilters(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-lg z-20 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Filter
                  </span>
                  {(statusFilter !== "All" || typeFilter !== "All" || potenzialFilter !== "All" || fitFilter !== "All") && (
                    <button
                      onClick={() => {
                        setStatusFilter("All");
                        setTypeFilter("All");
                        setPotenzialFilter("All");
                        setFitFilter("All");
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      Zurücksetzen
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", ...STATUSES].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          statusFilter === s
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {s === "All" ? "Alle" : s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2">
                    Typ
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", ...TYPES].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          typeFilter === t
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {t === "All" ? "Alle" : t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2">
                    Potenzial
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", ...POTENTIAL_LEVELS].map((l) => (
                      <button
                        key={l}
                        onClick={() => setPotenzialFilter(l)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          potenzialFilter === l
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {l === "All" ? "Alle" : l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2">
                    Fit
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["All", ...FIT_LEVELS].map((l) => (
                      <button
                        key={l}
                        onClick={() => setFitFilter(l)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                          fitFilter === l
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {l === "All" ? "Alle" : l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2">
                    Sortierung
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Active filter chips */}
        {(statusFilter !== "All" || typeFilter !== "All" || potenzialFilter !== "All" || fitFilter !== "All") && (
          <div className="flex items-center gap-2">
            {statusFilter !== "All" && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {statusFilter}
                <button
                  onClick={() => setStatusFilter("All")}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {typeFilter !== "All" && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {typeFilter}
                <button
                  onClick={() => setTypeFilter("All")}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {potenzialFilter !== "All" && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Pot: {potenzialFilter}
                <button
                  onClick={() => setPotenzialFilter("All")}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {fitFilter !== "All" && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Fit: {fitFilter}
                <button
                  onClick={() => setFitFilter("All")}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-zinc-400 py-12">Laden…</div>
      ) : partners.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-zinc-400 mb-2">Keine Partner gefunden</div>
          <Link
            href="/admin/partners/neu"
            className="text-sm text-zinc-900 dark:text-white underline"
          >
            Ersten Partner erstellen
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Partner
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Zusammenarbeit
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Stand
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Anhang
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sortedPartners.map((p) => {
                const TypeIcon = TYPE_ICONS[p.partner_type] || Building2;
                const sc = STATUS_COLORS[p.status] || STATUS_COLORS.Lead;
                const prio = calcPriority(p.potenzial, p.fit);
                const pc = prio ? PRIORITY_COLORS[prio] : null;
                const overdue =
                  p.follow_up_date &&
                  daysUntil(p.follow_up_date) <= 0 &&
                  p.status !== "Closed" &&
                  p.status !== "Declined";
                const contactName = [
                  p.contact_first_name,
                  p.contact_last_name,
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/partners/${p.id}`}
                        className="block"
                      >
                        <div className="flex items-center gap-2">
                          <TypeIcon
                            size={14}
                            className="text-zinc-400 shrink-0"
                          />
                          <span className="font-medium text-zinc-900 dark:text-white">
                            {p.name}
                          </span>
                          {pc && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pc.bg} ${pc.text}`}>
                              {prio}
                            </span>
                          )}
                          <ArrowUpRight
                            size={12}
                            className="text-zinc-300 shrink-0"
                          />
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">
                          {p.category}
                          {p.value ? ` · ${p.value}` : ""}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(p.collaboration_types || []).slice(0, 2).map((ct) => (
                          <span
                            key={ct}
                            className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs"
                          >
                            {ct}
                          </span>
                        ))}
                        {(p.collaboration_types || []).length > 2 && (
                          <span className="text-xs text-zinc-400">
                            +{p.collaboration_types.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {contactName && (
                        <div className="text-zinc-900 dark:text-white text-xs font-medium">
                          {contactName}
                        </div>
                      )}
                      {p.contact_email && (
                        <div className="text-xs text-zinc-500 truncate max-w-[180px]">
                          {p.contact_email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${sc.bg} ${sc.text}`}
                      >
                        {p.status}
                      </span>
                      {overdue && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                          <AlertTriangle size={10} />
                          Follow-up überfällig
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(p.attachment_count || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                          <Paperclip size={12} />
                          {p.attachment_count}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
