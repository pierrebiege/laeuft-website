import type { CalendarEvent, CalendarDisplayEvent } from "@/lib/supabase";

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

// ── Year helpers ──────────────────────────────────────────────

export function getYearRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start, end };
}

export function getMiniMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday-based

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  // Fill empty slots before the first day
  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null);
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    currentWeek.push(new Date(year, month, d));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill remaining slots in last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

// ── Multi-day event helpers ───────────────────────────────────

export function isMultiDay(event: { start_at: string; end_at: string }): boolean {
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);
  return start.getFullYear() !== end.getFullYear() ||
    start.getMonth() !== end.getMonth() ||
    start.getDate() !== end.getDate();
}

export function getEventDateRange(event: { start_at: string; end_at: string }): Date[] {
  const start = new Date(event.start_at);
  start.setHours(0, 0, 0, 0);
  const end = new Date(event.end_at);
  end.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function getEventsForDayMulti(
  events: CalendarDisplayEvent[],
  day: Date
): CalendarDisplayEvent[] {
  return events.filter((ev) => {
    if (isMultiDay(ev)) {
      const dates = getEventDateRange(ev);
      return dates.some((d) => isSameDay(d, day));
    }
    return isSameDay(new Date(ev.start_at), day);
  });
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

