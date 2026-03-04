"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type {
  Partner,
  PartnerType,
  PartnerStatus,
  PartnerHistory,
  PartnerAttachment,
  CollaborationType,
  HistoryChannel,
  HistoryDirection,
  PotentialLevel,
  FitLevel,
} from "@/lib/supabase";
import { calcPriority, POTENTIAL_LEVELS, FIT_LEVELS, PRIORITY_COLORS, POTENTIAL_COLORS, FIT_COLORS } from "@/lib/supabase";
import {
  ArrowLeft,
  Building2,
  User,
  Trash2,
  Upload,
  X,
  Mail,
  Globe,
  Instagram,
  AlertTriangle,
  Paperclip,
  Send,
  Download,
  FileText,
  Receipt,
  Image as ImageIcon,
  File as FileIcon,
  CalendarDays,
  Heart,
  Newspaper,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────

const PARTNER_TYPES: PartnerType[] = ["Brand", "Athlete/Persönlichkeiten", "Event", "NPO", "Medien"];
const CATEGORIES = [
  "Sports", "Tech", "Lifestyle", "Nutrition", "Fashion",
  "Travel", "Finance", "Health", "Media", "Other",
];
const STATUSES: PartnerStatus[] = [
  "Lead", "Negotiating", "Active", "Closed", "Declined",
];
const COLLABORATION_TYPES: CollaborationType[] = [
  "Sponsoring", "Ambassador", "Product Placement", "Event",
  "Barter Deal", "Content Creation", "Affiliate", "Sonstiges",
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Lead: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300" },
  Negotiating: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300" },
  Active: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300" },
  Closed: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-500 dark:text-zinc-400" },
  Declined: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300" },
};

const TYPE_ICONS: Record<string, typeof Building2> = {
  Brand: Building2, "Athlete/Persönlichkeiten": User, Event: CalendarDays, NPO: Heart, Medien: Newspaper,
};

const CHANNELS: { value: HistoryChannel; label: string; icon: string }[] = [
  { value: "email", label: "E-Mail", icon: "📩" },
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "phone", label: "Telefon", icon: "📞" },
  { value: "meeting", label: "Meeting", icon: "🤝" },
  { value: "note", label: "Notiz", icon: "📝" },
  { value: "initial", label: "Erstanfrage", icon: "🚀" },
];

const DIRECTIONS: { value: HistoryDirection; label: string; icon: string }[] = [
  { value: "outgoing", label: "Ausgehend", icon: "→" },
  { value: "incoming", label: "Eingehend", icon: "←" },
  { value: "internal", label: "Intern", icon: "—" },
];

// ── Helpers ────────────────────────────────────────────────────────

function fmtDate(d: string | null): string {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("de-CH", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

async function downloadFile(url: string, fileName: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Download fehlgeschlagen");
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, "_blank");
  }
}

// ── Component ──────────────────────────────────────────────────────

interface PartnerDetailProps {
  id: string;
  onClose?: () => void;
}

export function PartnerDetail({ id, onClose }: PartnerDetailProps) {
  const router = useRouter();

  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Partial<Partner>>({});
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<PartnerHistory[]>([]);
  const [attachments, setAttachments] = useState<PartnerAttachment[]>([]);
  const [note, setNote] = useState("");
  const [noteChannel, setNoteChannel] = useState<HistoryChannel>("note");
  const [noteDirection, setNoteDirection] = useState<HistoryDirection>("internal");
  const [noteLoading, setNoteLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [tagIn, setTagIn] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [lightbox, setLightbox] = useState<{ url: string; mimeType: string; fileName: string } | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightbox) setLightbox(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightbox]);

  const [user, setUser] = useState("Pierre");

  useEffect(() => {
    const r = document.cookie.match(/(?:^|; )admin_role=([^;]*)/);
    if (r && decodeURIComponent(r[1]) === "manager") setUser("Anes");
  }, []);

  const loadPartner = async () => {
    const { data } = await supabase
      .from("partners")
      .select("*")
      .eq("id", id)
      .single();
    setPartner(data);
    if (data) setDraft({ ...data });
    setLoading(false);
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from("partner_history")
      .select("*")
      .eq("partner_id", id)
      .order("created_at", { ascending: false });
    setHistory(data || []);
  };

  const getFileUrl = async (filePath: string): Promise<string | undefined> => {
    const { data: urlData, error } = await supabase.storage
      .from("partner-attachments")
      .createSignedUrl(filePath, 3600);
    if (urlData?.signedUrl) return urlData.signedUrl;
    if (error) console.warn("Signed URL failed:", error.message);

    const { data: pubData } = supabase.storage
      .from("partner-attachments")
      .getPublicUrl(filePath);
    return pubData?.publicUrl || undefined;
  };

  const loadAttachments = async () => {
    const { data } = await supabase
      .from("partner_attachments")
      .select("*")
      .eq("partner_id", id)
      .order("created_at", { ascending: false });

    const withUrls = await Promise.all(
      (data || []).map(async (att) => {
        const url = await getFileUrl(att.file_path);
        return { ...att, url };
      })
    );

    setAttachments(withUrls);
  };

  useEffect(() => {
    loadPartner();
    loadHistory();
    loadAttachments();
  }, [id]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("partners").select("tags");
      const tags = new Set<string>();
      (data || []).forEach((p) => (p.tags || []).forEach((t: string) => tags.add(t)));
      setAllTags(Array.from(tags).sort());
    })();
  }, []);

  const goBack = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/admin/partners");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Partner wirklich löschen?")) return;
    await supabase.from("partners").delete().eq("id", id);
    goBack();
  };

  const setD = (k: string, v: unknown) =>
    setDraft((prev) => ({ ...prev, [k]: v }));

  const toggleCollab = (ct: CollaborationType) => {
    const current = draft.collaboration_types || [];
    if (current.includes(ct)) {
      setD("collaboration_types", current.filter((x) => x !== ct));
    } else {
      setD("collaboration_types", [...current, ct]);
    }
  };

  const addTag = () => {
    if (tagIn.trim()) {
      setD("tags", [...(draft.tags || []), tagIn.trim()]);
      setTagIn("");
    }
  };

  const isDirty = partner ? JSON.stringify(draft) !== JSON.stringify(partner) : false;

  const handleSave = async () => {
    if (!draft.name?.trim()) return;
    setSaving(true);

    const {
      id: _id,
      created_at: _ca,
      updated_at: _ua,
      history: _h,
      attachments: _a,
      attachment_count: _ac,
      ...updateData
    } = draft as Partner & { attachment_count?: number };

    await supabase.from("partners").update(updateData).eq("id", id);

    for (const file of pendingFiles) {
      const filePath = `${id}/${Date.now()}_${file.name}`;
      await supabase.storage
        .from("partner-attachments")
        .upload(filePath, file);
      await supabase.from("partner_attachments").insert({
        partner_id: id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user,
      });
    }

    setPendingFiles([]);
    setSaving(false);
    loadPartner();
    loadAttachments();
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setNoteLoading(true);

    await supabase.from("partner_history").insert({
      partner_id: id,
      author: user,
      note: note.trim(),
      channel: noteChannel,
      direction: noteDirection,
    });

    if (noteDirection !== "internal") {
      await supabase
        .from("partners")
        .update({ last_contact: today() })
        .eq("id", id);
    }

    setNote("");
    setNoteChannel("note");
    setNoteDirection("internal");
    setNoteLoading(false);
    loadHistory();
    loadPartner();
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    const filePath = `${id}/${Date.now()}_${file.name}`;

    await supabase.storage
      .from("partner-attachments")
      .upload(filePath, file);

    await supabase.from("partner_attachments").insert({
      partner_id: id,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user,
    });

    setUploading(false);
    loadAttachments();
  };

  const getOrCreateClient = async (): Promise<string | null> => {
    if (!partner) return null;

    const contactName = [partner.contact_first_name, partner.contact_last_name]
      .filter(Boolean)
      .join(" ") || partner.name;

    if (partner.contact_email) {
      const { data: existing } = await supabase
        .from("clients")
        .select("id")
        .eq("email", partner.contact_email)
        .single();

      if (existing) return existing.id;
    }

    const { data: newClient, error } = await supabase
      .from("clients")
      .insert({
        name: contactName,
        company: partner.name,
        email: partner.contact_email || "",
      })
      .select()
      .single();

    if (error || !newClient) {
      alert("Fehler beim Erstellen des Kunden: " + (error?.message || ""));
      return null;
    }

    await supabase.from("partner_history").insert({
      partner_id: id,
      author: user,
      note: `Kunde "${partner.name}" automatisch erstellt.`,
    });
    loadHistory();

    return newClient.id;
  };

  const createOfferte = async () => {
    const clientId = await getOrCreateClient();
    if (clientId) {
      router.push(`/admin/offerten/neu?client=${clientId}`);
    }
  };

  const createRechnung = async () => {
    const clientId = await getOrCreateClient();
    if (clientId) {
      router.push(`/admin/rechnungen/neu?client=${clientId}`);
    }
  };

  const deleteAttachment = async (att: PartnerAttachment) => {
    if (!confirm("Anhang löschen?")) return;
    await supabase.storage
      .from("partner-attachments")
      .remove([att.file_path]);
    await supabase
      .from("partner_attachments")
      .delete()
      .eq("id", att.id);
    loadAttachments();
  };

  if (loading) {
    return (
      <div className="text-center text-zinc-400 py-20">Laden…</div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-20">
        <div className="text-zinc-400 mb-2">Partner nicht gefunden.</div>
        <button
          onClick={goBack}
          className="text-sm text-zinc-900 dark:text-white underline"
        >
          Zurück
        </button>
      </div>
    );
  }

  const TypeIcon = TYPE_ICONS[(draft.partner_type || partner.partner_type) as PartnerType] || Building2;
  const sc = STATUS_COLORS[(draft.status || partner.status) as PartnerStatus] || STATUS_COLORS.Lead;
  const overdue =
    draft.follow_up_date &&
    daysUntil(draft.follow_up_date) <= 0 &&
    draft.status !== "Closed" &&
    draft.status !== "Declined";

  const INP = "w-full px-2 py-1 bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-zinc-300 dark:focus:border-zinc-600 focus:bg-zinc-50 dark:focus:bg-zinc-800 rounded-lg text-sm transition-colors outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20";
  const SEL = "px-2 py-1 bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-zinc-300 dark:focus:border-zinc-600 focus:bg-zinc-50 dark:focus:bg-zinc-800 rounded-lg text-sm transition-colors outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20 cursor-pointer appearance-none";

  return (
    <div>
      {/* Back / Close */}
      <button
        onClick={goBack}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        {onClose ? "Schliessen" : "Zurück zu Partners"}
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <TypeIcon size={14} className="text-zinc-500" />
              <select
                className={`${SEL} text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-transparent pr-5`}
                value={draft.partner_type || "Brand"}
                onChange={(e) => setD("partner_type", e.target.value)}
              >
                {PARTNER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <select
              className={`${SEL} text-xs font-medium px-2.5 py-1 rounded-lg ${sc.bg} ${sc.text}`}
              value={draft.status || "Lead"}
              onChange={(e) => setD("status", e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <input
            className="w-full text-2xl font-bold text-zinc-900 dark:text-white bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-zinc-300 dark:focus:border-zinc-600 focus:bg-zinc-50 dark:focus:bg-zinc-800 rounded-lg px-1 py-0.5 outline-none focus:ring-2 focus:ring-zinc-900/20 dark:focus:ring-white/20 transition-colors"
            value={draft.name || ""}
            onChange={(e) => setD("name", e.target.value)}
          />
          <div className="flex items-center gap-1 mt-1 text-sm text-zinc-500">
            <select
              className={`${SEL} text-zinc-500`}
              value={draft.category || "Sports"}
              onChange={(e) => setD("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span>·</span>
            <input
              className={`${INP} text-zinc-500 max-w-[140px]`}
              value={draft.source || ""}
              onChange={(e) => setD("source", e.target.value)}
              placeholder="Quelle"
            />
            <span>·</span>
            <input
              className={`${INP} text-zinc-500 max-w-[140px]`}
              value={draft.value || ""}
              onChange={(e) => setD("value", e.target.value)}
              placeholder="Deal-Wert"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <button
            onClick={createOfferte}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <FileText size={14} />
            Offerte
          </button>
          <button
            onClick={createRechnung}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
          >
            <Receipt size={14} />
            Rechnung
          </button>
          {isDirty && (
            <button
              onClick={handleSave}
              disabled={saving || !draft.name?.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              {saving ? "Speichern…" : "Speichern"}
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column (2 cols) */}
        <div className="col-span-2 space-y-6">
          {/* Zusammenarbeitsform */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Zusammenarbeitsform
            </h3>
            <div className="flex flex-wrap gap-2">
              {COLLABORATION_TYPES.map((ct) => {
                const active = (draft.collaboration_types || []).includes(ct);
                return (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => toggleCollab(ct)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {ct}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aktueller Stand */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Aktueller Stand
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-zinc-500 mb-1">Status-Datum</div>
                <input
                  type="date"
                  className={`${INP} text-zinc-900 dark:text-white`}
                  value={draft.status_date || ""}
                  onChange={(e) => setD("status_date", e.target.value || null)}
                />
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Follow-up</div>
                <div className="flex items-center gap-1">
                  {overdue && <AlertTriangle size={12} className="text-orange-600 shrink-0" />}
                  <input
                    type="date"
                    className={`${INP} ${overdue ? "text-orange-600 font-semibold" : "text-zinc-900 dark:text-white"}`}
                    value={draft.follow_up_date || ""}
                    onChange={(e) => setD("follow_up_date", e.target.value || null)}
                  />
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Letzter Kontakt</div>
                <input
                  type="date"
                  className={`${INP} text-zinc-900 dark:text-white`}
                  value={draft.last_contact || ""}
                  onChange={(e) => setD("last_contact", e.target.value || null)}
                />
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Potenzial</div>
                <select
                  className={`${SEL} ${draft.potenzial ? `${POTENTIAL_COLORS[draft.potenzial].bg} ${POTENTIAL_COLORS[draft.potenzial].text} font-medium` : "text-zinc-400"}`}
                  value={draft.potenzial || ""}
                  onChange={(e) => setD("potenzial", e.target.value || null)}
                >
                  <option value="">– Nicht gesetzt –</option>
                  {POTENTIAL_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Fit</div>
                <select
                  className={`${SEL} ${draft.fit ? `${FIT_COLORS[draft.fit].bg} ${FIT_COLORS[draft.fit].text} font-medium` : "text-zinc-400"}`}
                  value={draft.fit || ""}
                  onChange={(e) => setD("fit", e.target.value || null)}
                >
                  <option value="">– Nicht gesetzt –</option>
                  {FIT_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              {(() => {
                const prio = calcPriority(draft.potenzial as PotentialLevel | null | undefined, draft.fit as FitLevel | null | undefined);
                if (!prio) return null;
                const pc = PRIORITY_COLORS[prio];
                return (
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Priorität</div>
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${pc.bg} ${pc.text}`}>
                      {prio === "A" ? "A – Top" : prio === "B" ? "B – Mittel" : "C – Tief"}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Bemerkungen</div>
              <textarea
                className={`${INP} text-zinc-700 dark:text-zinc-300 leading-relaxed min-h-[60px] w-full`}
                value={draft.notes || ""}
                onChange={(e) => setD("notes", e.target.value)}
                placeholder="Deal-Details, nächste Schritte…"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Tags
            </h3>
            <div className="flex gap-2 mb-2">
              <input
                className={`${INP} flex-1 border-zinc-200 dark:border-zinc-700`}
                value={tagIn}
                onChange={(e) => setTagIn(e.target.value)}
                placeholder="Tag hinzufügen…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTag(); }
                }}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!tagIn.trim()}
                className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(draft.tags || []).map((t) => (
                <span
                  key={t}
                  onClick={() => setD("tags", (draft.tags || []).filter((x) => x !== t))}
                  className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                >
                  {t} &times;
                </span>
              ))}
            </div>
            {allTags.filter((t) => !(draft.tags || []).includes(t)).length > 0 && (
              <div className="mt-2">
                <div className="text-[10px] text-zinc-400 mb-1">Vorhandene Tags:</div>
                <div className="flex flex-wrap gap-1">
                  {allTags
                    .filter((t) => !(draft.tags || []).includes(t))
                    .filter((t) => !tagIn || t.toLowerCase().includes(tagIn.toLowerCase()))
                    .map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setD("tags", [...(draft.tags || []), t])}
                        className="px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 rounded text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-700"
                      >
                        + {t}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Anhänge */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Anhänge
            </h3>
            <div
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors mb-3 ${
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
                if (file) uploadFile(file);
              }}
            >
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                  e.target.value = "";
                }}
              />
              <Upload size={18} className="mx-auto text-zinc-400 mb-1.5" />
              <div className="text-xs text-zinc-500">
                {uploading
                  ? "Wird hochgeladen…"
                  : "Datei hierher ziehen oder klicken"}
              </div>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((att) => {
                  const isImage = att.mime_type?.startsWith("image/");
                  const isPdf = att.mime_type === "application/pdf";
                  return (
                    <div
                      key={att.id}
                      className="bg-zinc-50 dark:bg-zinc-800 rounded-lg overflow-hidden"
                    >
                      {isImage && att.url && (
                        <button
                          onClick={() => setLightbox({ url: att.url!, mimeType: att.mime_type || "image/*", fileName: att.file_name })}
                          className="block w-full"
                        >
                          <img
                            src={att.url}
                            alt={att.file_name}
                            className="w-full max-h-[200px] object-contain bg-zinc-100 dark:bg-zinc-900 cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </button>
                      )}
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        {isImage ? (
                          <ImageIcon size={14} className="text-blue-400 shrink-0" />
                        ) : isPdf ? (
                          <FileIcon size={14} className="text-red-400 shrink-0" />
                        ) : (
                          <Paperclip size={14} className="text-zinc-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          {(isImage || isPdf) ? (
                            <button
                              onClick={async () => {
                                let url = att.url;
                                if (!url) {
                                  url = await getFileUrl(att.file_path);
                                }
                                if (url) {
                                  setLightbox({ url, mimeType: att.mime_type || "", fileName: att.file_name });
                                } else {
                                  alert("Datei konnte nicht geladen werden.");
                                }
                              }}
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block text-left cursor-pointer"
                            >
                              {att.file_name}
                            </button>
                          ) : att.url ? (
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
                            >
                              {att.file_name}
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-zinc-900 dark:text-white truncate block">
                              {att.file_name}
                            </span>
                          )}
                          <div className="text-xs text-zinc-500">
                            {formatSize(att.file_size)} · {att.uploaded_by} ·{" "}
                            {new Date(att.created_at).toLocaleDateString("de-CH")}
                          </div>
                        </div>
                        {att.url && (
                          <button
                            onClick={() => downloadFile(att.url!, att.file_name)}
                            className="p-1 text-zinc-400 hover:text-blue-500 transition-colors shrink-0"
                            title="Herunterladen"
                          >
                            <Download size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteAttachment(att)}
                          className="p-1 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Aktivitäts-Log */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Aktivitäts-Log
            </h3>

            {/* New entry form */}
            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                <select
                  value={noteChannel}
                  onChange={(e) => setNoteChannel(e.target.value as HistoryChannel)}
                  className="px-2.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                >
                  {CHANNELS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </option>
                  ))}
                </select>
                <div className="flex bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                  {DIRECTIONS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => setNoteDirection(d.value)}
                      title={d.label}
                      className={`px-2.5 py-2 text-sm font-medium transition-colors ${
                        noteDirection === d.value
                          ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                          : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                      }`}
                    >
                      {d.icon}
                    </button>
                  ))}
                </div>
                <span className="self-center text-xs text-zinc-400 whitespace-nowrap">
                  {DIRECTIONS.find((d) => d.value === noteDirection)?.label}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  placeholder="Was ist passiert?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addNote();
                  }}
                />
                <button
                  onClick={addNote}
                  disabled={noteLoading || !note.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
                >
                  <Send size={14} />
                  Log
                </button>
              </div>
            </div>

            {/* History entries */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {history.map((h) => (
                <HistoryEntry
                  key={h.id}
                  entry={h}
                  onAuthorChange={async (newAuthor) => {
                    await supabase
                      .from("partner_history")
                      .update({ author: newAuthor })
                      .eq("id", h.id);
                    loadHistory();
                  }}
                />
              ))}
              {history.length === 0 && (
                <div className="text-sm text-zinc-400 py-2">
                  Noch keine Einträge.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column (1 col) - Kontaktperson */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Kontaktperson
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={`${INP} text-sm font-semibold text-zinc-900 dark:text-white`}
                  value={draft.contact_first_name || ""}
                  onChange={(e) => setD("contact_first_name", e.target.value)}
                  placeholder="Vorname"
                />
                <input
                  className={`${INP} text-sm font-semibold text-zinc-900 dark:text-white`}
                  value={draft.contact_last_name || ""}
                  onChange={(e) => setD("contact_last_name", e.target.value)}
                  placeholder="Nachname"
                />
              </div>
              <input
                className={`${INP} text-xs text-zinc-500`}
                value={draft.contact_position || ""}
                onChange={(e) => setD("contact_position", e.target.value)}
                placeholder="Position"
              />
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-zinc-400 shrink-0" />
                <input
                  type="email"
                  className={`${INP} text-sm text-blue-600 dark:text-blue-400 flex-1`}
                  value={draft.contact_email || ""}
                  onChange={(e) => setD("contact_email", e.target.value)}
                  placeholder="E-Mail"
                />
              </div>
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-zinc-400 shrink-0" />
                <input
                  className={`${INP} text-sm text-blue-600 dark:text-blue-400 flex-1`}
                  value={draft.contact_website || ""}
                  onChange={(e) => setD("contact_website", e.target.value)}
                  placeholder="Webseite"
                />
              </div>
              <div className="flex items-center gap-2">
                <Instagram size={14} className="text-zinc-400 shrink-0" />
                <input
                  className={`${INP} text-sm text-zinc-600 dark:text-zinc-400 flex-1`}
                  value={draft.instagram || ""}
                  onChange={(e) => setD("instagram", e.target.value)}
                  placeholder="@instagram"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Datei-Vorschau Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          {lightbox.mimeType === "application/pdf" ? (
            <div
              className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                  {lightbox.fileName}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadFile(lightbox.url, lightbox.fileName)}
                    className="p-2 text-zinc-500 hover:text-blue-500 transition-colors"
                    title="Herunterladen"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => setLightbox(null)}
                    className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <iframe
                src={lightbox.url}
                className="flex-1 w-full"
                title={lightbox.fileName}
              />
            </div>
          ) : (
            <>
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); downloadFile(lightbox.url, lightbox.fileName); }}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                  title="Herunterladen"
                >
                  <Download size={24} />
                </button>
                <button
                  onClick={() => setLightbox(null)}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <img
                src={lightbox.url}
                alt={lightbox.fileName}
                className="max-w-full max-h-[90vh] object-contain rounded-lg cursor-default"
                onClick={(e) => e.stopPropagation()}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// History entry with editable author
function HistoryEntry({
  entry,
  onAuthorChange,
}: {
  entry: PartnerHistory;
  onAuthorChange: (newAuthor: string) => Promise<void>;
}) {
  const [editingAuthor, setEditingAuthor] = useState(false);
  const ch = CHANNELS.find((c) => c.value === entry.channel);
  const dir = DIRECTIONS.find((d) => d.value === entry.direction);

  return (
    <div className="flex items-start gap-2.5 py-2.5 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
      <span className="text-sm pt-0.5" title={ch?.label}>
        {ch?.icon || "\ud83d\udcdd"}
      </span>
      <span
        className={`text-xs font-bold pt-1 ${
          entry.direction === "outgoing"
            ? "text-blue-500"
            : entry.direction === "incoming"
            ? "text-emerald-500"
            : "text-zinc-400"
        }`}
        title={dir?.label}
      >
        {dir?.icon || "\u2014"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="relative">
            <button
              onClick={() => setEditingAuthor(!editingAuthor)}
              className={`text-xs font-semibold hover:underline cursor-pointer ${
                entry.author === "Pierre"
                  ? "text-blue-600 dark:text-blue-400"
                  : entry.author === "Anes"
                  ? "text-violet-600 dark:text-violet-400"
                  : "text-zinc-500"
              }`}
              title="Klicken um Autor zu ändern"
            >
              {entry.author}
            </button>
            {editingAuthor && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setEditingAuthor(false)}
                />
                <div className="absolute left-0 top-full mt-1 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-lg z-20 py-1 min-w-[100px]">
                  {["Pierre", "Anes"].map((name) => (
                    <button
                      key={name}
                      onClick={async () => {
                        if (name !== entry.author) {
                          await onAuthorChange(name);
                        }
                        setEditingAuthor(false);
                      }}
                      className={`block w-full text-left px-3 py-1.5 text-xs font-medium transition-colors ${
                        name === entry.author
                          ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <span className="text-xs text-zinc-400">
            {new Date(entry.created_at).toLocaleDateString("de-CH")}
          </span>
        </div>
        <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
          {entry.note}
        </div>
      </div>
    </div>
  );
}
