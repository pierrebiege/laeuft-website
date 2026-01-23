"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, Offer, Client } from "@/lib/supabase";
import { Plus, Send, Check, X, Clock, ExternalLink } from "lucide-react";

type OfferWithClient = Offer & { client: Client };

export default function AdminPage() {
  const [offers, setOffers] = useState<OfferWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOffers();
  }, []);

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
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-500">Link</th>
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
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/angebot/${offer.unique_token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                      >
                        <ExternalLink size={14} />
                        Öffnen
                      </a>
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
