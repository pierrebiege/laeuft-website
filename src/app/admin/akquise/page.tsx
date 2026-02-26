"use client";

import { useEffect, useState } from "react";
import { supabase, Prospect, ProspectStatus } from "@/lib/supabase";
import {
  Plus,
  Mail,
  Trash2,
  ExternalLink,
  Check,
  X,
  RefreshCw,
} from "lucide-react";

type FilterTab = "alle" | "neu" | "follow_up" | "geantwortet" | "kein_interesse";

const STATUS_CONFIG: Record<
  ProspectStatus,
  { label: string; color: string }
> = {
  neu: {
    label: "Neu",
    color: "text-zinc-700 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800",
  },
  kontaktiert: {
    label: "Kontaktiert",
    color: "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30",
  },
  follow_up_1: {
    label: "Follow-up 1",
    color: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30",
  },
  follow_up_2: {
    label: "Follow-up 2",
    color: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-900/30",
  },
  geantwortet: {
    label: "Geantwortet",
    color: "text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/30",
  },
  kein_interesse: {
    label: "Kein Interesse",
    color: "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/30",
  },
  kunde: {
    label: "Kunde",
    color: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/30",
  },
};

export default function AkquisePage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("alle");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company: "",
    contact_name: "",
    email: "",
    website: "",
    notes: "",
  });

  useEffect(() => {
    loadProspects();
  }, []);

  async function loadProspects() {
    const { data, error } = await supabase
      .from("prospects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading prospects:", error);
    } else {
      setProspects(data || []);
    }
    setLoading(false);
  }

  const filtered = prospects.filter((p) => {
    switch (filter) {
      case "neu":
        return p.status === "neu";
      case "follow_up":
        return ["kontaktiert", "follow_up_1", "follow_up_2"].includes(p.status);
      case "geantwortet":
        return p.status === "geantwortet" || p.status === "kunde";
      case "kein_interesse":
        return p.status === "kein_interesse";
      default:
        return true;
    }
  });

  const stats = {
    total: prospects.length,
    neu: prospects.filter((p) => p.status === "neu").length,
    offen: prospects.filter((p) =>
      ["kontaktiert", "follow_up_1", "follow_up_2"].includes(p.status)
    ).length,
    geantwortet: prospects.filter((p) => p.status === "geantwortet").length,
  };

  async function saveProspect() {
    if (!form.company || !form.contact_name || !form.email) {
      alert("Firma, Kontakt und E-Mail sind Pflichtfelder.");
      return;
    }
    setSaving(true);

    const { error } = await supabase.from("prospects").insert({
      company: form.company,
      contact_name: form.contact_name,
      email: form.email,
      website: form.website || null,
      notes: form.notes || null,
    });

    if (error) {
      console.error("Error saving prospect:", error);
      alert("Fehler beim Speichern");
    } else {
      setForm({ company: "", contact_name: "", email: "", website: "", notes: "" });
      setShowForm(false);
      loadProspects();
    }
    setSaving(false);
  }

  async function sendEmail(prospect: Prospect, emailNumber: 1 | 2 | 3) {
    const labels: Record<number, string> = {
      1: "Erstmail",
      2: "Follow-up 1",
      3: "Follow-up 2",
    };
    if (!confirm(`${labels[emailNumber]} an ${prospect.company} senden?`)) return;

    setSendingId(prospect.id);
    try {
      const res = await fetch("/api/send-prospect-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: prospect.id, emailNumber }),
      });

      if (res.ok) {
        loadProspects();
      } else {
        const data = await res.json();
        alert(data.error || "Fehler beim Senden");
      }
    } catch {
      alert("Verbindungsfehler");
    }
    setSendingId(null);
  }

  async function markStatus(prospectId: string, status: ProspectStatus) {
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "geantwortet") {
      updates.responded_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("prospects")
      .update(updates)
      .eq("id", prospectId);

    if (error) {
      alert("Fehler beim Aktualisieren");
    } else {
      loadProspects();
    }
  }

  async function deleteProspect(prospectId: string) {
    if (!confirm("Prospect unwiderruflich löschen?")) return;

    const { error } = await supabase
      .from("prospects")
      .delete()
      .eq("id", prospectId);

    if (error) {
      alert("Fehler beim Löschen");
    } else {
      loadProspects();
    }
  }

  function getLastEmail(p: Prospect): string {
    if (p.email_3_sent_at) return formatDate(p.email_3_sent_at);
    if (p.email_2_sent_at) return formatDate(p.email_2_sent_at);
    if (p.email_1_sent_at) return formatDate(p.email_1_sent_at);
    return "-";
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: "alle", label: "Alle" },
    { key: "neu", label: "Neu" },
    { key: "follow_up", label: "Braucht Follow-up" },
    { key: "geantwortet", label: "Geantwortet" },
    { key: "kein_interesse", label: "Kein Interesse" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Akquise
          </h1>
          <p className="text-zinc-500 mt-1">
            {stats.total} Prospects · {stats.neu} neu · {stats.offen} offen ·{" "}
            {stats.geantwortet} geantwortet
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          <Plus size={18} />
          Prospect erfassen
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Neuer Prospect
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Firma *
              </label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                placeholder="Firmenname"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Kontaktperson *
              </label>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) =>
                  setForm({ ...form, contact_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                placeholder="Vor- und Nachname"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                E-Mail *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                placeholder="email@firma.ch"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Website
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                placeholder="https://firma.ch"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Notizen
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                placeholder="z.B. veraltete Website, kein Responsive Design..."
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={saveProspect}
              disabled={saving}
              className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              {saving ? "Speichern..." : "Speichern"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.key
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Laden...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 mb-4">
            {filter === "alle"
              ? "Noch keine Prospects erfasst"
              : "Keine Prospects in dieser Kategorie"}
          </p>
          {filter === "alle" && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 text-zinc-900 dark:text-white font-medium hover:underline"
            >
              <Plus size={16} />
              Ersten Prospect erfassen
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">
                  Firma
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">
                  Kontakt
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">
                  Website
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">
                  Letztes Mail
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-500">
                  Aktion
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((prospect) => {
                const status = STATUS_CONFIG[prospect.status];
                return (
                  <tr
                    key={prospect.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {prospect.company}
                      </div>
                      {prospect.notes && (
                        <div className="text-xs text-zinc-400 mt-0.5 truncate max-w-[200px]">
                          {prospect.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-900 dark:text-white">
                        {prospect.contact_name}
                      </div>
                      <div className="text-sm text-zinc-500">
                        {prospect.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {prospect.website ? (
                        <a
                          href={prospect.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                          <ExternalLink size={14} />
                          <span className="truncate max-w-[150px]">
                            {prospect.website.replace(/^https?:\/\//, "")}
                          </span>
                        </a>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {getLastEmail(prospect)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Contextual action buttons based on status */}
                        {prospect.status === "neu" && (
                          <button
                            onClick={() => sendEmail(prospect, 1)}
                            disabled={sendingId === prospect.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Mail size={14} />
                            {sendingId === prospect.id
                              ? "Sende..."
                              : "Erstmail"}
                          </button>
                        )}
                        {prospect.status === "kontaktiert" && (
                          <button
                            onClick={() => sendEmail(prospect, 2)}
                            disabled={sendingId === prospect.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <RefreshCw size={14} />
                            {sendingId === prospect.id
                              ? "Sende..."
                              : "Follow-up 1"}
                          </button>
                        )}
                        {prospect.status === "follow_up_1" && (
                          <button
                            onClick={() => sendEmail(prospect, 3)}
                            disabled={sendingId === prospect.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <RefreshCw size={14} />
                            {sendingId === prospect.id
                              ? "Sende..."
                              : "Follow-up 2"}
                          </button>
                        )}
                        {prospect.status === "follow_up_2" && (
                          <>
                            <button
                              onClick={() =>
                                markStatus(prospect.id, "geantwortet")
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            >
                              <Check size={14} />
                              Geantwortet
                            </button>
                            <button
                              onClick={() =>
                                markStatus(prospect.id, "kein_interesse")
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <X size={14} />
                              Kein Interesse
                            </button>
                          </>
                        )}
                        {/* Geantwortet / kontaktiert / follow_up statuses can also be marked manually */}
                        {["kontaktiert", "follow_up_1"].includes(
                          prospect.status
                        ) && (
                          <button
                            onClick={() =>
                              markStatus(prospect.id, "geantwortet")
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {/* Delete button - always visible */}
                        <button
                          onClick={() => deleteProspect(prospect.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
