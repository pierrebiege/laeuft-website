"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Copy, ExternalLink, Trash2, Check, Clock, Send, CheckCircle, Archive, MessageCircle } from "lucide-react";
import type { TrainingPlan, Client } from "@/lib/supabase";

type PlanWithClient = TrainingPlan & { client: Client };

const statusConfig = {
  draft: { label: "Entwurf", icon: Clock, color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800" },
  sent: { label: "Gesendet", icon: Send, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30" },
  active: { label: "Aktiv", icon: CheckCircle, color: "text-green-600 bg-green-50 dark:bg-green-900/30" },
  archived: { label: "Archiviert", icon: Archive, color: "text-zinc-500 bg-zinc-100 dark:bg-zinc-800" },
};

export default function TrainingListPage() {
  const [plans, setPlans] = useState<PlanWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const res = await fetch("/api/training");
      if (res.ok) {
        const data = await res.json();
        setPlans(data || []);
      }
    } catch (err) {
      console.error("Error loading plans:", err);
    }
    setLoading(false);
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/training/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function deletePlan(planId: string) {
    if (!confirm("Trainingsplan unwiderruflich loschen?")) return;

    try {
      const res = await fetch(`/api/training/${planId}`, { method: "DELETE" });
      if (res.ok) {
        loadPlans();
      } else {
        alert("Fehler beim Loschen");
      }
    } catch {
      alert("Verbindungsfehler");
    }
  }

  function sendWhatsApp(plan: PlanWithClient) {
    const phone = plan.client?.phone;
    if (!phone) { alert("Telefonnummer fehlt beim Client."); return; }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const planUrl = `${window.location.origin}/training/${plan.unique_token}`;
    const pinLine = plan.access_pin ? `\nPIN: ${plan.access_pin}` : "";
    const message = `Hey ${plan.client.name}! 👋\n\nDein neuer Trainingsplan "${plan.title}" ist bereit:\n${planUrl}\n${pinLine}\nViel Spass beim Training! 💪\n-- Pierre`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Trainingsplaner</h1>
          <p className="text-zinc-500 mt-1">Verwalte deine Trainingsplane</p>
        </div>
        <Link
          href="/admin/training/neu"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          <Plus size={18} />
          Neuer Trainingsplan
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Laden...</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 mb-4">Noch keine Trainingsplane</p>
          <Link
            href="/admin/training/neu"
            className="inline-flex items-center gap-2 text-zinc-900 dark:text-white font-medium hover:underline"
          >
            <Plus size={16} />
            Ersten Plan erstellen
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Client</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Titel</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Startdatum</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Status</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-500">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => {
                const status = statusConfig[plan.status];
                const StatusIcon = status.icon;
                return (
                  <tr
                    key={plan.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {plan.client?.company || plan.client?.name}
                      </div>
                      <div className="text-sm text-zinc-500">{plan.client?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-900 dark:text-white">{plan.title}</td>
                    <td className="px-6 py-4 text-zinc-500">{formatDate(plan.start_date)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                      >
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyLink(plan.unique_token)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          {copiedId === plan.unique_token ? (
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
                        <button
                          onClick={() => sendWhatsApp(plan)}
                          title={plan.client?.phone ? "Per WhatsApp senden" : "Telefonnummer fehlt"}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        >
                          <MessageCircle size={14} />
                        </button>
                        <Link
                          href={`/admin/training/${plan.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <ExternalLink size={14} />
                          Offnen
                        </Link>
                        <button
                          onClick={() => deletePlan(plan.id)}
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
