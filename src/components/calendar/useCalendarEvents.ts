"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CalendarEvent, CalendarDisplayEvent, VirtualCalendarEvent } from "@/lib/supabase";
import { expandRecurrence } from "./calendarHelpers";
import { VIRTUAL_EVENT_CONFIG } from "./calendarConstants";

/* ── Source management ─────────────────────────────────── */

const GOOGLE_FEED_COLORS = ["#4285f4", "#0f9d58", "#db4437", "#f4b400", "#ab47bc"];

export interface CalendarSource {
  id: string;
  name: string;
  color: string;
}

const STORAGE_KEY = "calendar-disabled-sources";

function loadDisabled(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDisabled(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

/* ── Static sources ────────────────────────────────────── */

const STATIC_SOURCES: CalendarSource[] = [
  { id: "real", name: "Eigene Termine", color: "#3b82f6" },
  { id: "partner_followup", name: "Partner Follow-ups", color: VIRTUAL_EVENT_CONFIG.partner_followup.color },
  { id: "invoice_due", name: "Rechnungen", color: VIRTUAL_EVENT_CONFIG.invoice_due.color },
  { id: "mandate_billing", name: "Mandate", color: VIRTUAL_EVENT_CONFIG.mandate_billing.color },
];

/* ── Hook ──────────────────────────────────────────────── */

export function useCalendarEvents() {
  const [allEvents, setAllEvents] = useState<CalendarDisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<CalendarSource[]>(STATIC_SOURCES);
  const [disabled, setDisabled] = useState<Set<string>>(new Set());

  // Load disabled state from localStorage on mount
  useEffect(() => {
    setDisabled(loadDisabled());
  }, []);

  const toggleSource = useCallback((sourceId: string) => {
    setDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      saveDisabled(next);
      return next;
    });
  }, []);

  // Filtered events based on enabled sources
  const events = allEvents.filter((ev) => {
    if (ev._virtual) {
      // Google Calendar events have source "google_calendar" but we need feedId for toggling
      if (ev.source === "google_calendar") {
        // feedId is stored in the id prefix: gcal-feed-0, gcal-feed-1 etc.
        const feedId = ev.sourceId.match(/^gcal-feed-\d+/)?.[0];
        return feedId ? !disabled.has(feedId) : !disabled.has("google_calendar");
      }
      return !disabled.has(ev.source);
    }
    return !disabled.has("real");
  });

  const loadEvents = useCallback(async (rangeStart: Date, rangeEnd: Date) => {
    setLoading(true);

    const startISO = rangeStart.toISOString();
    const endISO = rangeEnd.toISOString();
    const startStr = rangeStart.toISOString().split("T")[0];
    const endStr = rangeEnd.toISOString().split("T")[0];

    // Load real events, also load recurring events that started before the range
    const [realRes, partnerRes, invoiceRes, mandateRes, googleRes] = await Promise.all([
      supabase
        .from("calendar_events")
        .select("*")
        .or(`and(start_at.gte.${startISO},start_at.lte.${endISO}),recurrence_rule.not.is.null`)
        .order("start_at", { ascending: true }),

      // Partner follow-ups
      supabase
        .from("partners")
        .select("id, name, follow_up_date, status")
        .not("follow_up_date", "is", null)
        .not("status", "in", '("Closed","Declined")')
        .gte("follow_up_date", startStr)
        .lte("follow_up_date", endStr),

      // Invoice due dates
      supabase
        .from("invoices")
        .select("id, invoice_number, due_date, status, client:clients(name)")
        .not("due_date", "is", null)
        .in("status", ["sent", "overdue"])
        .gte("due_date", startStr)
        .lte("due_date", endStr),

      // Mandate billing dates
      supabase
        .from("mandates")
        .select("id, title, next_invoice_date, status, client:clients(name)")
        .not("next_invoice_date", "is", null)
        .in("status", ["active"])
        .gte("next_invoice_date", startStr)
        .lte("next_invoice_date", endStr),

      // Google Calendar events
      fetch(`/api/calendar/google?start=${startISO}&end=${endISO}`)
        .then((r) => (r.ok ? r.json() : { feeds: [], events: [] }))
        .catch(() => ({ feeds: [], events: [] })),
    ]);

    // Expand real events (including recurrence)
    const realEvents: CalendarDisplayEvent[] = [];
    for (const ev of (realRes.data || []) as CalendarEvent[]) {
      const expanded = expandRecurrence(ev, rangeStart, rangeEnd);
      for (const inst of expanded) {
        realEvents.push({ ...inst, _virtual: false as const });
      }
    }

    // Build virtual events
    const virtual: CalendarDisplayEvent[] = [];

    for (const p of partnerRes.data || []) {
      const ve: VirtualCalendarEvent = {
        id: `vp-${p.id}`,
        title: `Follow-up: ${p.name}`,
        start_at: `${p.follow_up_date}T00:00:00`,
        end_at: `${p.follow_up_date}T23:59:59`,
        all_day: true,
        source: "partner_followup",
        color: VIRTUAL_EVENT_CONFIG.partner_followup.color,
        sourceId: p.id,
        sourceName: p.name,
      };
      virtual.push({ ...ve, _virtual: true as const });
    }

    for (const inv of invoiceRes.data || []) {
      const clientName = (inv.client as unknown as { name: string } | null)?.name || "";
      const ve: VirtualCalendarEvent = {
        id: `vi-${inv.id}`,
        title: `Rechnung fällig: ${inv.invoice_number}`,
        start_at: `${inv.due_date}T00:00:00`,
        end_at: `${inv.due_date}T23:59:59`,
        all_day: true,
        source: "invoice_due",
        color: VIRTUAL_EVENT_CONFIG.invoice_due.color,
        sourceId: inv.id,
        sourceName: `${inv.invoice_number} – ${clientName}`,
      };
      virtual.push({ ...ve, _virtual: true as const });
    }

    for (const m of mandateRes.data || []) {
      const clientName = (m.client as unknown as { name: string } | null)?.name || "";
      const ve: VirtualCalendarEvent = {
        id: `vm-${m.id}`,
        title: `Abrechnung: ${m.title}`,
        start_at: `${m.next_invoice_date}T00:00:00`,
        end_at: `${m.next_invoice_date}T23:59:59`,
        all_day: true,
        source: "mandate_billing",
        color: VIRTUAL_EVENT_CONFIG.mandate_billing.color,
        sourceId: m.id,
        sourceName: `${m.title} – ${clientName}`,
      };
      virtual.push({ ...ve, _virtual: true as const });
    }

    // Google Calendar events — build sources + events from structured response
    const gcalData = googleRes as { feeds: { id: string; name: string }[]; events: { id: string; title: string; description: string | null; location: string | null; start_at: string; end_at: string; all_day: boolean; feedId: string; feedName: string }[] };
    const googleFeeds = gcalData.feeds || [];
    const googleEvents = gcalData.events || [];

    // Build Google sources
    const googleSources: CalendarSource[] = googleFeeds.map((f, i) => ({
      id: f.id,
      name: f.name,
      color: GOOGLE_FEED_COLORS[i % GOOGLE_FEED_COLORS.length],
    }));
    setSources([...STATIC_SOURCES, ...googleSources]);

    for (const g of googleEvents) {
      const feedColor = GOOGLE_FEED_COLORS[
        googleFeeds.findIndex((f) => f.id === g.feedId) % GOOGLE_FEED_COLORS.length
      ] || VIRTUAL_EVENT_CONFIG.google_calendar.color;

      const ve: VirtualCalendarEvent = {
        id: g.id,
        title: g.title,
        start_at: g.start_at,
        end_at: g.end_at,
        all_day: g.all_day,
        source: "google_calendar",
        color: feedColor,
        sourceId: g.feedId, // feed ID for filtering
        sourceName: g.title,
        description: g.description || undefined,
        location: g.location || undefined,
      };
      virtual.push({ ...ve, _virtual: true as const });
    }

    // Merge and sort
    const all = [...realEvents, ...virtual].sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    );

    setAllEvents(all);
    setLoading(false);
  }, []);

  return { events, loading, loadEvents, sources, disabled, toggleSource };
}
