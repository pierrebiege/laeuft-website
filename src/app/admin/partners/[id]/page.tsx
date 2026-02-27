"use client";

import { useState, useEffect, useRef, use } from "react";
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
} from "@/lib/supabase";
import { calcPriority, POTENTIAL_LEVELS, FIT_LEVELS, PRIORITY_COLORS, POTENTIAL_COLORS, FIT_COLORS } from "@/lib/supabase";
import {
  ArrowLeft,
  Building2,
  User,
  Pencil,
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

export default function PartnerDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(paramsPromise);
  const router = useRouter();

  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Partner>>({});

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
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

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

  const loadAttachments = async () => {
    const { data } = await supabase
      .from("partner_attachments")
      .select("*")
      .eq("partner_id", id)
      .order("created_at", { ascending: false });

    const withUrls = await Promise.all(
      (data || []).map(async (att) => {
        const { data: urlData } = await supabase.storage
          .from("partner-attachments")
          .createSignedUrl(att.file_path, 3600);
        return { ...att, url: urlData?.signedUrl || undefined };
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

  const handleDelete = async () => {
    if (!confirm("Partner wirklich löschen?")) return;
    await supabase.from("partners").delete().eq("id", id);
    router.push("/admin/partners");
  };

  const startEdit = () => {
    if (!partner) return;
    setEditData({ ...partner });
    setPendingFiles([]);
    setTagIn("");
    setEditing(true);
  };

  const setE = (k: string, v: unknown) =>
    setEditData((prev) => ({ ...prev, [k]: v }));

  const toggleEditCollab = (ct: CollaborationType) => {
    const current = editData.collaboration_types || [];
    if (current.includes(ct)) {
      setE("collaboration_types", current.filter((x) => x !== ct));
    } else {
      setE("collaboration_types", [...current, ct]);
    }
  };

  const addEditTag = () => {
    if (tagIn.trim()) {
      setE("tags", [...(editData.tags || []), tagIn.trim()]);
      setTagIn("");
    }
  };

  const handleSave = async () => {
    if (!editData.name?.trim()) return;

    const {
      id: _id,
      created_at: _ca,
      updated_at: _ua,
      history: _h,
      attachments: _a,
      attachment_count: _ac,
      ...updateData
    } = editData as Partner & { attachment_count?: number };

    await supabase.from("partners").update(updateData).eq("id", id);

    // Upload pending files
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

    setEditing(false);
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

    // Update last_contact if it's not an internal note
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

    // Check if client with same email already exists
    if (partner.contact_email) {
      const { data: existing } = await supabase
        .from("clients")
        .select("id")
        .eq("email", partner.contact_email)
        .single();

      if (existing) return existing.id;
    }

    // Create new client from partner data
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

    // Log it
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
          onClick={() => router.push("/admin/partners")}
          className="text-sm text-zinc-900 dark:text-white underline"
        >
          Zurück
        </button>
      </div>
    );
  }

  const TypeIcon = TYPE_ICONS[partner.partner_type] || Building2;
  const sc = STATUS_COLORS[partner.status] || STATUS_COLORS.Lead;
  const overdue =
    partner.follow_up_date &&
    daysUntil(partner.follow_up_date) <= 0 &&
    partner.status !== "Closed" &&
    partner.status !== "Declined";
  const contactName = [partner.contact_first_name, partner.contact_last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.push("/admin/partners")}
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Zurück zu Partners
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <TypeIcon size={14} className="text-zinc-500" />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {partner.partner_type}
              </span>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-medium ${sc.bg} ${sc.text}`}
            >
              {partner.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {partner.name}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {partner.category}
            {partner.source ? ` · ${partner.source}` : ""}
            {partner.value ? ` · ${partner.value}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            onClick={startEdit}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Pencil size={14} />
            Bearbeiten
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 size={14} />
            Löschen
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column (2 cols) */}
        <div className="col-span-2 space-y-6">
          {/* Zusammenarbeitsform */}
          {(partner.collaboration_types || []).length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Zusammenarbeitsform
              </h3>
              <div className="flex flex-wrap gap-2">
                {partner.collaboration_types.map((ct) => (
                  <span
                    key={ct}
                    className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-medium"
                  >
                    {ct}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Aktueller Stand */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Aktueller Stand
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-xs text-zinc-500 mb-1">Status</div>
                <span
                  className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${sc.bg} ${sc.text}`}
                >
                  {partner.status}
                </span>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Datum</div>
                <div className="text-sm text-zinc-900 dark:text-white">
                  {fmtDate(partner.status_date)}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Follow-up</div>
                <div
                  className={`text-sm ${
                    overdue
                      ? "text-orange-600 font-semibold"
                      : "text-zinc-900 dark:text-white"
                  }`}
                >
                  {overdue && <AlertTriangle size={12} className="inline mr-1" />}
                  {fmtDate(partner.follow_up_date)}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Letzter Kontakt</div>
                <div className="text-sm text-zinc-900 dark:text-white">
                  {fmtDate(partner.last_contact)}
                </div>
              </div>
              {partner.potenzial && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Potenzial</div>
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${POTENTIAL_COLORS[partner.potenzial].bg} ${POTENTIAL_COLORS[partner.potenzial].text}`}>
                    {partner.potenzial}
                  </span>
                </div>
              )}
              {partner.fit && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Fit</div>
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${FIT_COLORS[partner.fit].bg} ${FIT_COLORS[partner.fit].text}`}>
                    {partner.fit}
                  </span>
                </div>
              )}
              {(() => {
                const prio = calcPriority(partner.potenzial, partner.fit);
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
            {partner.notes && (
              <div>
                <div className="text-xs text-zinc-500 mb-1">Bemerkungen</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {partner.notes}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {(partner.tags || []).length > 0 && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {partner.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

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
                      {/* Image preview */}
                      {isImage && att.url && (
                        <button
                          onClick={() => setLightbox(att.url!)}
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
                          {att.url ? (
                            isImage ? (
                              <button
                                onClick={() => setLightbox(att.url!)}
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block text-left"
                              >
                                {att.file_name}
                              </button>
                            ) : (
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
                              >
                                {att.file_name}
                              </a>
                            )
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
            {contactName || partner.contact_email || partner.contact_website ? (
              <div className="space-y-3">
                {contactName && (
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {contactName}
                  </div>
                )}
                {partner.contact_position && (
                  <div className="text-xs text-zinc-500">
                    {partner.contact_position}
                  </div>
                )}
                {partner.contact_email && (
                  <a
                    href={`mailto:${partner.contact_email}`}
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Mail size={14} />
                    {partner.contact_email}
                  </a>
                )}
                {partner.contact_website && (
                  <a
                    href={
                      partner.contact_website.startsWith("http")
                        ? partner.contact_website
                        : `https://${partner.contact_website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Globe size={14} />
                    {partner.contact_website}
                  </a>
                )}
                {partner.instagram && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <Instagram size={14} />
                    {partner.instagram}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-zinc-400">
                Keine Kontaktdaten hinterlegt.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <img
            src={lightbox}
            alt="Vorschau"
            className="max-w-full max-h-[90vh] object-contain rounded-lg cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl my-8 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Partner bearbeiten
              </h2>
              <button
                onClick={() => setEditing(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {/* Grunddaten */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Partner Name *
                  </label>
                  <input
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                    value={editData.name || ""}
                    onChange={(e) => setE("name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Partner-Typ
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                    value={editData.partner_type || "Brand"}
                    onChange={(e) => setE("partner_type", e.target.value)}
                  >
                    {PARTNER_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
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
                    value={editData.category || "Sports"}
                    onChange={(e) => setE("category", e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                    value={editData.status || "Lead"}
                    onChange={(e) => setE("status", e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Zusammenarbeitsform */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Zusammenarbeitsform
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLLABORATION_TYPES.map((ct) => {
                    const active = (editData.collaboration_types || []).includes(ct);
                    return (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => toggleEditCollab(ct)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          active
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                        }`}
                      >
                        {ct}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kontaktperson */}
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  value={editData.contact_first_name || ""}
                  onChange={(e) => setE("contact_first_name", e.target.value)}
                  placeholder="Vorname"
                />
                <input
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  value={editData.contact_last_name || ""}
                  onChange={(e) => setE("contact_last_name", e.target.value)}
                  placeholder="Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  value={editData.contact_position || ""}
                  onChange={(e) => setE("contact_position", e.target.value)}
                  placeholder="Position"
                />
                <input
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  type="email"
                  value={editData.contact_email || ""}
                  onChange={(e) => setE("contact_email", e.target.value)}
                  placeholder="E-Mail"
                />
              </div>
              <input
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                value={editData.contact_website || ""}
                onChange={(e) => setE("contact_website", e.target.value)}
                placeholder="Webseite"
              />

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Instagram
                  </label>
                  <input
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                    value={editData.instagram || ""}
                    onChange={(e) => setE("instagram", e.target.value)}
                    placeholder="@brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Quelle
                  </label>
                  <input
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                    value={editData.source || ""}
                    onChange={(e) => setE("source", e.target.value)}
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
                    value={editData.value || ""}
                    onChange={(e) => setE("value", e.target.value)}
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
                    value={editData.follow_up_date || ""}
                    onChange={(e) =>
                      setE("follow_up_date", e.target.value || null)
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Letzter Kontakt
                  </label>
                  <input
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                    type="date"
                    value={editData.last_contact || ""}
                    onChange={(e) =>
                      setE("last_contact", e.target.value || null)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Status Datum
                  </label>
                  <input
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                    type="date"
                    value={editData.status_date || ""}
                    onChange={(e) =>
                      setE("status_date", e.target.value || null)
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                    Potenzial
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                    value={editData.potenzial || ""}
                    onChange={(e) => setE("potenzial", e.target.value || null)}
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
                    value={editData.fit || ""}
                    onChange={(e) => setE("fit", e.target.value || null)}
                  >
                    <option value="">– Nicht gesetzt –</option>
                    {FIT_LEVELS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bemerkungen */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Bemerkungen
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white min-h-[80px]"
                  value={editData.notes || ""}
                  onChange={(e) => setE("notes", e.target.value)}
                  placeholder="Deal-Details, nächste Schritte…"
                />
              </div>

              {/* Anhänge im Edit */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Neue Anhänge
                </label>
                <div
                  className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg p-4 text-center cursor-pointer hover:border-zinc-400 transition-colors"
                  onClick={() => {
                    const inp = document.createElement("input");
                    inp.type = "file";
                    inp.onchange = () => {
                      const file = inp.files?.[0];
                      if (file) setPendingFiles((prev) => [...prev, file]);
                    };
                    inp.click();
                  }}
                >
                  <Upload size={16} className="mx-auto text-zinc-400 mb-1" />
                  <div className="text-xs text-zinc-500">
                    Klicken zum Hochladen
                  </div>
                </div>
                {pendingFiles.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {pendingFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800 rounded text-xs"
                      >
                        <span className="flex-1 truncate">{file.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingFiles((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                    value={tagIn}
                    onChange={(e) => setTagIn(e.target.value)}
                    placeholder="Tag…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addEditTag();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addEditTag}
                    className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm hover:bg-zinc-200 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(editData.tags || []).map((t) => (
                    <span
                      key={t}
                      onClick={() =>
                        setE(
                          "tags",
                          (editData.tags || []).filter((x) => x !== t)
                        )
                      }
                      className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-xs cursor-pointer hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      {t} &times;
                    </span>
                  ))}
                </div>
                {allTags.filter((t) => !(editData.tags || []).includes(t)).length > 0 && (
                  <div className="mt-2">
                    <div className="text-[10px] text-zinc-400 mb-1">Vorhandene Tags:</div>
                    <div className="flex flex-wrap gap-1">
                      {allTags
                        .filter((t) => !(editData.tags || []).includes(t))
                        .filter((t) => !tagIn || t.toLowerCase().includes(tagIn.toLowerCase()))
                        .map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setE("tags", [...(editData.tags || []), t])}
                            className="px-2 py-0.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 rounded text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors border border-zinc-200 dark:border-zinc-700"
                          >
                            + {t}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={!editData.name?.trim()}
                className="px-5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Speichern
              </button>
            </div>
          </div>
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
