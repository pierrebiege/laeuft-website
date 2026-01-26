"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, Mandate, Client } from "@/lib/supabase";
import { Plus, Send, Check, X, Clock, ExternalLink, Mail, Copy, Pause, Play, Trash2 } from "lucide-react";

type MandateWithClient = Mandate & { client: Client };

export default function MandatesPage() {
  const [mandates, setMandates] = useState<MandateWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadMandates();
  }, []);

  async function loadMandates() {
    const { data, error } = await supabase
      .from("mandates")
      .select(`*, client:clients(*)`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading mandates:", error);
    } else {
      setMandates(data || []);
    }
    setLoading(false);
  }

  async function sendMandate(mandateId: string) {
    if (!confirm("Mandat-Offerte per E-Mail senden?")) return;

    setSendingId(mandateId);
    try {
      const res = await fetch("/api/send-mandate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mandateId }),
      });

      if (res.ok) {
        loadMandates();
      } else {
        const data = await res.json();
        alert(data.error || "Fehler beim Senden");
      }
    } catch {
      alert("Verbindungsfehler");
    }
    setSendingId(null);
  }

  async function deleteMandate(mandateId: string) {
    if (!confirm("Mandat unwiderruflich löschen?")) return;

    const { error } = await supabase
      .from("mandates")
      .delete()
      .eq("id", mandateId);

    if (error) {
      console.error("Error deleting mandate:", error);
      alert("Fehler beim Löschen");
    } else {
      loadMandates();
    }
  }

  async function generateInvoice(mandateId: string) {
    if (!confirm("Monatliche Rechnung jetzt generieren?")) return;

    try {
      const res = await fetch("/api/generate-mandate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mandateId }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Rechnung ${data.invoice_number} erstellt!`);
        loadMandates();
      } else {
        const data = await res.json();
        alert(data.error || "Fehler beim Generieren");
      }
    } catch {
      alert("Verbindungsfehler");
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/mandat/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
    draft: { label: "Entwurf", icon: Clock, color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800" },
    sent: { label: "Gesendet", icon: Send, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30" },
    accepted: { label: "Angenommen", icon: Check, color: "text-green-600 bg-green-50 dark:bg-green-900/30" },
    rejected: { label: "Abgelehnt", icon: X, color: "text-red-600 bg-red-50 dark:bg-red-900/30" },
    active: { label: "Aktiv", icon: Play, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30" },
    paused: { label: "Pausiert", icon: Pause, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/30" },
    cancelled: { label: "Gekündigt", icon: X, color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800" },
    ended: { label: "Beendet", icon: Check, color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800" },
  };

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Mandate</h1>
          <p className="text-zinc-500 mt-1">Partner-Offerten mit monatlicher Abrechnung</p>
        </div>
        <Link
          href="/admin/mandate/neu"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          <Plus size={18} />
          Neues Mandat
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Laden...</div>
      ) : mandates.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 mb-4">Noch keine Mandate</p>
          <Link
            href="/admin/mandate/neu"
            className="inline-flex items-center gap-2 text-zinc-900 dark:text-white font-medium hover:underline"
          >
            <Plus size={16} />
            Erstes Mandat erstellen
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Kunde</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Titel</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Rechnungen</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-500">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {mandates.map((mandate) => {
                const status = statusConfig[mandate.status] || statusConfig.draft;
                const StatusIcon = status.icon;
                return (
                  <tr
                    key={mandate.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {mandate.client?.company || mandate.client?.name}
                      </div>
                      {mandate.client?.company && (
                        <div className="text-sm text-zinc-500">{mandate.client?.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-900 dark:text-white">{mandate.title}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                      >
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {mandate.invoices_generated > 0 ? (
                        <span>{mandate.invoices_generated} generiert</span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {mandate.status === "draft" && (
                          <button
                            onClick={() => sendMandate(mandate.id)}
                            disabled={sendingId === mandate.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Mail size={14} />
                            {sendingId === mandate.id ? "Sende..." : "Senden"}
                          </button>
                        )}
                        {(mandate.status === "active" || mandate.status === "accepted") && (
                          <button
                            onClick={() => generateInvoice(mandate.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                          >
                            <Plus size={14} />
                            Rechnung
                          </button>
                        )}
                        <button
                          onClick={() => copyLink(mandate.unique_token)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          {copiedId === mandate.unique_token ? (
                            <>
                              <Check size={14} className="text-green-500" />
                              Kopiert
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              Link
                            </>
                          )}
                        </button>
                        <a
                          href={`/mandat/${mandate.unique_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <ExternalLink size={14} />
                          Öffnen
                        </a>
                        <button
                          onClick={() => deleteMandate(mandate.id)}
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
