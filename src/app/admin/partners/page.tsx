"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Partner, PartnerType, PartnerStatus } from "@/lib/supabase";
import {
  Plus,
  Search,
  Building2,
  User,
  Users,
  Landmark,
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
} from "lucide-react";

const STATUSES: PartnerStatus[] = [
  "Lead",
  "Negotiating",
  "Active",
  "Closed",
  "Declined",
];
const TYPES: PartnerType[] = ["Brand", "Athlete", "Team", "Verband"];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Lead: { bg: "bg-blue-50 dark:bg-blue-900/20", text: "text-blue-700 dark:text-blue-300" },
  Negotiating: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300" },
  Active: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300" },
  Closed: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-500 dark:text-zinc-400" },
  Declined: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300" },
};

const TYPE_ICONS: Record<string, typeof Building2> = {
  Brand: Building2,
  Athlete: User,
  Team: Users,
  Verband: Landmark,
};

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

interface ActionItem {
  icon: typeof AlertTriangle;
  color: string;
  label: string;
  partnerId: string;
  partnerName: string;
  detail: string;
  priority: number; // lower = more urgent
}

function computeActions(allPartners: Partner[]): ActionItem[] {
  const actions: ActionItem[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const p of allPartners) {
    if (p.status === "Closed" || p.status === "Declined") continue;

    // Follow-up überfällig
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

    // Lead/Negotiating ohne Kontakt seit > 7 Tagen
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

      // Kein Follow-up gesetzt
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

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [allPartners, setAllPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showActions, setShowActions] = useState(true);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Load all partners once (for action board)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("partners")
        .select("*")
        .order("updated_at", { ascending: false });
      setAllPartners((data || []) as Partner[]);
    })();
  }, []);

  const loadPartners = useCallback(async () => {
    let query = supabase
      .from("partners")
      .select("*, partner_attachments(id)")
      .order("updated_at", { ascending: false });

    if (statusFilter !== "All") query = query.eq("status", statusFilter);
    if (typeFilter !== "All") query = query.eq("partner_type", typeFilter);
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
  }, [statusFilter, typeFilter, search]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const activeCount = allPartners.filter((p) => p.status === "Active").length;
  const pipelineCount = allPartners.filter(
    (p) => p.status === "Lead" || p.status === "Negotiating"
  ).length;
  const actions = computeActions(allPartners);

  return (
    <div>
      {/* Header */}
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
        <div className="flex items-center gap-2">
          <Link
            href="/admin/partners/ai"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-violet-600 hover:to-indigo-700 transition-all"
          >
            <Sparkles size={16} />
            AI Erfassung
          </Link>
          <Link
            href="/admin/partners/neu"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            <Plus size={16} />
            Neuer Partner
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            {activeCount}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Aktiv</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            {pipelineCount}
          </div>
          <div className="text-xs text-zinc-500 mt-1">In Pipeline</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            {allPartners.filter((p) => p.partner_type === "Brand").length}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Brands</div>
        </div>
      </div>

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
            {(statusFilter !== "All" || typeFilter !== "All") && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 dark:bg-black/20 rounded text-xs">
                {(statusFilter !== "All" ? 1 : 0) + (typeFilter !== "All" ? 1 : 0)}
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
                  {(statusFilter !== "All" || typeFilter !== "All") && (
                    <button
                      onClick={() => {
                        setStatusFilter("All");
                        setTypeFilter("All");
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
              </div>
            </>
          )}
        </div>

        {/* Active filter chips */}
        {(statusFilter !== "All" || typeFilter !== "All") && (
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
              {partners.map((p) => {
                const TypeIcon = TYPE_ICONS[p.partner_type] || Building2;
                const sc = STATUS_COLORS[p.status] || STATUS_COLORS.Lead;
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
