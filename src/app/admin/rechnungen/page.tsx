"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, Invoice, Client } from "@/lib/supabase";
import { useAdminRole } from "@/components/admin/AdminRoleContext";
import { Plus, Send, Check, X, Clock, ExternalLink, Mail, Copy, CreditCard, AlertCircle, Trash2, Bell, Download } from "lucide-react";

type InvoiceWithClient = Invoice & { client: Client };

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const role = useAdminRole();
  const isAdmin = role === "admin";

  useEffect(() => {
    loadInvoices();
  }, []);

  async function sendInvoice(invoiceId: string) {
    if (!confirm("Rechnung per E-Mail senden?")) return;

    setSendingId(invoiceId);
    try {
      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });

      if (res.ok) {
        loadInvoices();
      } else {
        const data = await res.json();
        alert(data.error || "Fehler beim Senden");
      }
    } catch {
      alert("Verbindungsfehler");
    }
    setSendingId(null);
  }

  async function markAsPaid(invoiceId: string) {
    if (!confirm("Zahlungseingang bestätigen? Die Rechnung wird als bezahlt markiert.")) return;

    const { error } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_amount: invoices.find(i => i.id === invoiceId)?.total_amount || 0,
      })
      .eq("id", invoiceId);

    if (error) {
      alert("Fehler beim Aktualisieren");
    } else {
      loadInvoices();
    }
  }

  async function sendReminder(invoiceId: string, level: number) {
    const levelText = level === 1 ? "Zahlungserinnerung" : level === 2 ? "2. Mahnung" : "Letzte Mahnung";
    if (!confirm(`${levelText} per E-Mail senden?`)) return;

    setRemindingId(invoiceId);
    try {
      const res = await fetch("/api/send-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, reminderNumber: level }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Mahnung gesendet");
        loadInvoices();
      } else {
        const data = await res.json();
        alert(data.error || "Fehler beim Senden");
      }
    } catch {
      alert("Verbindungsfehler");
    }
    setRemindingId(null);
  }

  function downloadPDF(token: string, invoiceNumber: string) {
    window.open(`/api/invoice-pdf?token=${token}`, '_blank');
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/rechnung/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function deleteInvoice(invoiceId: string) {
    if (!confirm("Rechnung unwiderruflich löschen?")) return;

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (error) {
      console.error("Error deleting invoice:", error);
      alert("Fehler beim Löschen");
    } else {
      loadInvoices();
    }
  }

  async function loadInvoices() {
    const { data, error } = await supabase
      .from("invoices")
      .select(`*, client:clients(*)`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading invoices:", error);
    } else {
      setInvoices(data || []);
    }
    setLoading(false);
  }

  const statusConfig = {
    draft: { label: "Entwurf", icon: Clock, color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800" },
    sent: { label: "Gesendet", icon: Send, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30" },
    paid: { label: "Bezahlt", icon: Check, color: "text-green-600 bg-green-50 dark:bg-green-900/30" },
    overdue: { label: "Überfällig", icon: AlertCircle, color: "text-red-600 bg-red-50 dark:bg-red-900/30" },
    cancelled: { label: "Storniert", icon: X, color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800" },
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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Rechnungen</h1>
          <p className="text-zinc-500 mt-1">Verwalte deine Rechnungen</p>
        </div>
        <Link
          href="/admin/rechnungen/neu"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          <Plus size={18} />
          Neue Rechnung
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Laden...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 mb-4">Noch keine Rechnungen</p>
          <Link
            href="/admin/rechnungen/neu"
            className="inline-flex items-center gap-2 text-zinc-900 dark:text-white font-medium hover:underline"
          >
            <Plus size={16} />
            Erste Rechnung erstellen
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Nr.</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Kunde</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Titel</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Betrag</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Fällig</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-500">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const status = statusConfig[invoice.status];
                const StatusIcon = status.icon;
                return (
                  <tr
                    key={invoice.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-sm text-zinc-600 dark:text-zinc-400">
                      {invoice.invoice_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {invoice.client?.company || invoice.client?.name}
                      </div>
                      <div className="text-sm text-zinc-500">{invoice.client?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-900 dark:text-white">{invoice.title}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                      {formatAmount(invoice.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                      >
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {invoice.due_date ? formatDate(invoice.due_date) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {invoice.status === "draft" && isAdmin && (
                          <button
                            onClick={() => sendInvoice(invoice.id)}
                            disabled={sendingId === invoice.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Mail size={14} />
                            {sendingId === invoice.id ? "Sende..." : "Senden"}
                          </button>
                        )}
                        {invoice.status === "sent" && (
                          <>
                            <button
                              onClick={() => markAsPaid(invoice.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                            >
                              <CreditCard size={14} />
                              Zahlung bestätigen
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => sendReminder(invoice.id, 1)}
                                disabled={remindingId === invoice.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Bell size={14} />
                                {remindingId === invoice.id ? "..." : "Erinnern"}
                              </button>
                            )}
                          </>
                        )}
                        {invoice.status === "overdue" && (
                          <>
                            <button
                              onClick={() => markAsPaid(invoice.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                            >
                              <CreditCard size={14} />
                              Bezahlt
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => sendReminder(invoice.id, 2)}
                                disabled={remindingId === invoice.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Bell size={14} />
                                {remindingId === invoice.id ? "..." : "Mahnung"}
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => downloadPDF(invoice.unique_token, invoice.invoice_number)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Download size={14} />
                          PDF
                        </button>
                        <button
                          onClick={() => copyLink(invoice.unique_token)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          {copiedId === invoice.unique_token ? (
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
                          href={`/rechnung/${invoice.unique_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <ExternalLink size={14} />
                          Öffnen
                        </a>
                        <button
                          onClick={() => deleteInvoice(invoice.id)}
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
