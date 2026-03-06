"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { CalendarEvent, CalendarDisplayEvent, VirtualCalendarEvent } from "@/lib/supabase";
import { expandRecurrence } from "./calendarHelpers";
import { VIRTUAL_EVENT_CONFIG } from "./calendarConstants";

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarDisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
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

    // Google Calendar events
    const googleEvents = (googleRes || []) as { id: string; title: string; description: string | null; location: string | null; start_at: string; end_at: string; all_day: boolean }[];
    for (const g of googleEvents) {
      const ve: VirtualCalendarEvent = {
        id: g.id,
        title: g.title,
        start_at: g.start_at,
        end_at: g.end_at,
        all_day: g.all_day,
        source: "google_calendar",
        color: VIRTUAL_EVENT_CONFIG.google_calendar.color,
        sourceId: g.id,
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

    setEvents(all);
    setLoading(false);
  }, []);

  return { events, loading, loadEvents };
}
