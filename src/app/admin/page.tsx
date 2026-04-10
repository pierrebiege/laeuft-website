"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, Offer, Client } from "@/lib/supabase";
import { useAdminRole } from "@/components/admin/AdminRoleContext";
import { Plus, Send, Check, X, Clock, ExternalLink, Mail, Copy, Receipt, Trash2, CheckCircle, Pencil, FlagTriangleRight } from "lucide-react";

type OfferWithClient = Offer & { client: Client };

export default function AdminPage() {
  const [offers, setOffers] = useState<OfferWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const role = useAdminRole();
  const isAdmin = role === "admin";

  useEffect(() => {
    loadOffers();
  }, []);

  async function sendOffer(offerId: string) {
    if (!confirm("Offerte per E-Mail senden?")) return;

    setSendingId(offerId);
    try {
      const res = await fetch("/api/send-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      if (res.ok) {
        loadOffers();
      } else {
        const data = await res.json();
        alert(data.error || "Fehler beim Senden");
      }
    } catch {
      alert("Verbindungsfehler");
    }
    setSendingId(null);
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/angebot/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function deleteOffer(offerId: string) {
    if (!confirm("Offerte unwiderruflich löschen?")) return;

    const { error } = await supabase
      .from("offers")
      .delete()
      .eq("id", offerId);

    if (error) {
      console.error("Error deleting offer:", error);
      alert("Fehler beim Löschen");
    } else {
      loadOffers();
    }
  }

  async function acceptInternally(offerId: string) {
    if (!confirm("Offerte annehmen? Die Anzahlung (50%) wird automatisch erstellt und per E-Mail versendet.")) return;

    try {
      const res = await fetch("/api/accept-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.invoiceSent) {
          alert("Offerte angenommen. Anzahlungsrechnung (50%) wurde erstellt und versendet.");
        } else if (data.invoiceCreated) {
          alert("Offerte angenommen. Rechnung erstellt, E-Mail-Versand fehlgeschlagen.");
        } else {
          alert("Offerte angenommen, aber Rechnung konnte nicht erstellt werden.");
        }
        loadOffers();
      } else {
        const data = await res.json();
        alert(data.error || "Fehler beim Annehmen");
      }
    } catch {
      alert("Verbindungsfehler");
    }
  }

  async function completeOffer(offerId: string) {
    if (!confirm("Projekt abschliessen? Die Schlussrechnung (50%) wird automatisch erstellt und per E-Mail versendet.")) return;

    try {
      const res = await fetch("/api/complete-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.invoiceSent) {
          alert("Schlussrechnung (50%) wurde erstellt und versendet.");
        } else {
          alert("Schlussrechnung erstellt, E-Mail-Versand fehlgeschlagen.");
        }
        loadOffers();
      } else {
        const data = await res.json();
        alert(data.error || "Fehler beim Abschliessen");
      }
    } catch {
      alert("Verbindungsfehler");
    }
  }

  async function loadOffers() {
    const { data, error } = await supabase
      .from("offers")
      .select(`*, client:clients(*)`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading offers:", error);
    } else {
      setOffers(data || []);
    }
    setLoading(false);
  }

  const statusConfig = {
    draft: { label: "Entwurf", icon: Clock, color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800" },
    sent: { label: "Gesendet", icon: Send, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30" },
    accepted: { label: "Angenommen", icon: Check, color: "text-green-600 bg-green-50 dark:bg-green-900/30" },
    rejected: { label: "Abgelehnt", icon: X, color: "text-red-600 bg-red-50 dark:bg-red-900/30" },
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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Offerten</h1>
          <p className="text-zinc-500 mt-1">Verwalte deine Offerten</p>
        </div>
        <Link
          href="/admin/offerten/neu"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          <Plus size={18} />
          Neue Offerte
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Laden...</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 mb-4">Noch keine Offerten</p>
          <Link
            href="/admin/offerten/neu"
            className="inline-flex items-center gap-2 text-zinc-900 dark:text-white font-medium hover:underline"
          >
            <Plus size={16} />
            Erste Offerte erstellen
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Kunde</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Titel</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Betrag</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Erstellt</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-500">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => {
                const status = statusConfig[offer.status];
                const StatusIcon = status.icon;
                return (
                  <tr
                    key={offer.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {offer.client?.company || offer.client?.name}
                      </div>
                      <div className="text-sm text-zinc-500">{offer.client?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-900 dark:text-white">{offer.title}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                      {formatAmount(offer.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                      >
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{formatDate(offer.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {offer.status === "draft" && (
                          <>
                            <Link
                              href={`/admin/offerten/${offer.id}`}
                              title="Bearbeiten"
                              className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                              <Pencil size={15} />
                            </Link>
                            {isAdmin && (
                              <button
                                onClick={() => sendOffer(offer.id)}
                                disabled={sendingId === offer.id}
                                title="Per E-Mail senden"
                                className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Mail size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => acceptInternally(offer.id)}
                              title="Annehmen"
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            >
                              <CheckCircle size={15} />
                            </button>
                          </>
                        )}
                        {offer.status === "accepted" && (
                          <>
                            <button
                              onClick={() => completeOffer(offer.id)}
                              title="Projekt abschliessen"
                              className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                            >
                              <FlagTriangleRight size={15} />
                            </button>
                            <Link
                              href={`/admin/rechnungen/neu?from_offer=${offer.id}`}
                              title="Rechnung erstellen"
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            >
                              <Receipt size={15} />
                            </Link>
                          </>
                        )}
                        <button
                          onClick={() => copyLink(offer.unique_token)}
                          title="Link kopieren"
                          className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          {copiedId === offer.unique_token ? (
                            <Check size={15} className="text-green-500" />
                          ) : (
                            <Copy size={15} />
                          )}
                        </button>
                        <a
                          href={`/angebot/${offer.unique_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Offerte öffnen"
                          className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <ExternalLink size={15} />
                        </a>
                        <button
                          onClick={() => deleteOffer(offer.id)}
                          title="Löschen"
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
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
