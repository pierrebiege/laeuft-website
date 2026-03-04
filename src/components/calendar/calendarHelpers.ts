import type { CalendarEvent, VirtualCalendarEvent, CalendarDisplayEvent } from "@/lib/supabase";
import { HOUR_START, HOUR_HEIGHT } from "./calendarConstants";

// ── Week helpers (Monday-based) ────────────────────────────────

export function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getWeekDays(date: Date): Date[] {
  const { start } = getWeekRange(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const yearStart = new Date(d.getFullYear(), 0, 4);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ── Month helpers ──────────────────────────────────────────────

export function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function getMonthGrid(date: Date): Date[][] {
  const { start, end } = getMonthRange(date);
  const startDay = start.getDay() === 0 ? 6 : start.getDay() - 1; // Monday-based
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startDay);

  const weeks: Date[][] = [];
  const cursor = new Date(gridStart);
  while (cursor <= end || weeks.length < 5) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (weeks.length >= 6) break;
  }
  return weeks;
}

// ── Date helpers ───────────────────────────────────────────────

export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("de-CH", { day: "numeric", month: "short" });
}

export function formatDateRange(start: Date, end: Date): string {
  const s = start.toLocaleDateString("de-CH", { day: "numeric", month: "long" });
  const e = end.toLocaleDateString("de-CH", { day: "numeric", month: "long", year: "numeric" });
  return `${s} – ${e}`;
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

export function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function toTimeStr(date: Date): string {
  return date.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

// ── Positioning for week view ──────────────────────────────────

export function getEventPosition(
  startAt: string,
  endAt: string
): { top: number; height: number } {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const top = ((startMinutes - HOUR_START * 60) / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 20);
  return { top, height };
}

export function getCurrentTimePosition(): number {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return ((minutes - HOUR_START * 60) / 60) * HOUR_HEIGHT;
}

// ── Recurrence expansion ───────────────────────────────────────

export function expandRecurrence(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  if (!event.recurrence_rule) return [event];

  const instances: CalendarEvent[] = [];
  const eventStart = new Date(event.start_at);
  const eventEnd = new Date(event.end_at);
  const duration = eventEnd.getTime() - eventStart.getTime();
  const recEnd = event.recurrence_end ? new Date(event.recurrence_end) : null;

  // Cap at 6 months
  const maxEnd = new Date(rangeEnd);
  maxEnd.setMonth(maxEnd.getMonth() + 6);
  const effectiveEnd = recEnd && recEnd < maxEnd ? recEnd : maxEnd;

  const cursor = new Date(eventStart);

  while (cursor <= effectiveEnd) {
    if (cursor >= rangeStart && cursor <= rangeEnd) {
      const isWeekday = cursor.getDay() >= 1 && cursor.getDay() <= 5;
      if (event.recurrence_rule !== "weekdays" || isWeekday) {
        const instanceEnd = new Date(cursor.getTime() + duration);
        instances.push({
          ...event,
          id: `${event.id}-${toDateStr(cursor)}`,
          start_at: cursor.toISOString(),
          end_at: instanceEnd.toISOString(),
        });
      }
    }

    // Advance cursor
    switch (event.recurrence_rule) {
      case "daily":
      case "weekdays":
        cursor.setDate(cursor.getDate() + 1);
        break;
      case "weekly":
        cursor.setDate(cursor.getDate() + 7);
        break;
      case "monthly":
        cursor.setMonth(cursor.getMonth() + 1);
        break;
    }
  }

  return instances;
}

// ── Overlap detection ──────────────────────────────────────────

export function detectOverlaps(
  events: CalendarDisplayEvent[]
): Map<string, { column: number; totalColumns: number }> {
  const result = new Map<string, { column: number; totalColumns: number }>();
  if (events.length === 0) return result;

  const sorted = [...events].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
  );

  const groups: CalendarDisplayEvent[][] = [];
  let currentGroup: CalendarDisplayEvent[] = [sorted[0]];
  let groupEnd = new Date(sorted[0].end_at).getTime();

  for (let i = 1; i < sorted.length; i++) {
    const evStart = new Date(sorted[i].start_at).getTime();
    if (evStart < groupEnd) {
      currentGroup.push(sorted[i]);
      groupEnd = Math.max(groupEnd, new Date(sorted[i].end_at).getTime());
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
      groupEnd = new Date(sorted[i].end_at).getTime();
    }
  }
  groups.push(currentGroup);

  for (const group of groups) {
    const total = group.length;
    group.forEach((ev, idx) => {
      result.set(ev.id, { column: idx, totalColumns: total });
    });
  }

  return result;
}

// ── Get events for a specific day ──────────────────────────────

export function getEventsForDay(
  events: CalendarDisplayEvent[],
  day: Date
): { allDay: CalendarDisplayEvent[]; timed: CalendarDisplayEvent[] } {
  const allDay: CalendarDisplayEvent[] = [];
  const timed: CalendarDisplayEvent[] = [];

  for (const ev of events) {
    const evStart = new Date(ev.start_at);
    if (!isSameDay(evStart, day)) continue;
    if (ev.all_day) {
      allDay.push(ev);
    } else {
      timed.push(ev);
    }
  }

  return { allDay, timed };
}
