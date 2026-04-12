"use client";

import { useState, useCallback } from "react";
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

    const res = await fetch(`/api/calendar?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`);
    if (!res.ok) {
      setLoading(false);
      return;
    }

    const { events: rawEvents, partners, invoices, mandates, todos } = await res.json();

    // Expand real events (including recurrence)
    const realEvents: CalendarDisplayEvent[] = [];
    for (const ev of (rawEvents || []) as CalendarEvent[]) {
      const expanded = expandRecurrence(ev, rangeStart, rangeEnd);
      for (const inst of expanded) {
        realEvents.push({ ...inst, _virtual: false as const });
      }
    }

    // Build virtual events
    const virtual: CalendarDisplayEvent[] = [];

    for (const p of partners || []) {
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

    for (const inv of invoices || []) {
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

    for (const m of mandates || []) {
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

    // Todos as virtual events
    for (const t of todos || []) {
      if (!t.due_date) continue;
      const priorityColors: Record<string, string> = {
        urgent: '#ef4444',
        high: '#f97316',
        normal: '#22c55e',
        low: '#a1a1aa',
      };
      const ve: VirtualCalendarEvent = {
        id: `vt-${t.id}`,
        title: `☑ ${t.title}`,
        start_at: `${t.due_date}T00:00:00`,
        end_at: `${t.due_date}T23:59:59`,
        all_day: true,
        source: 'partner_followup' as const,
        color: priorityColors[t.priority] || '#22c55e',
        sourceId: t.id,
        sourceName: t.title,
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
