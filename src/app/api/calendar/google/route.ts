import { NextRequest, NextResponse } from "next/server";

/* ── Types ─────────────────────────────────────────────── */

interface ParsedEvent {
  uid: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string; // YYYY-MM-DDTHH:MM:SS  (no TZ → treated as local by client)
  endAt: string;
  allDay: boolean;
  rrule: string | null;
  exdates: string[]; // YYYY-MM-DD
}

interface GoogleCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
}

/* ── Cache ─────────────────────────────────────────────── */

const CACHE_TTL = 5 * 60 * 1000; // 5 min
let cache: { data: ParsedEvent[]; ts: number } | null = null; // merged cache for all feeds

/* ── iCal Parser ───────────────────────────────────────── */

function unfold(ical: string): string[] {
  // iCal lines starting with space/tab are continuations
  return ical.replace(/\r\n[ \t]/g, "").split(/\r?\n/);
}

function unescape(str: string): string {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\\\/g, "\\")
    .replace(/\\;/g, ";");
}

/**
 * Parse an iCal datetime string.
 * Returns ISO-like string without timezone (treated as local time by client).
 * UTC dates (ending in Z) are kept with Z so the client converts them.
 */
function parseICalDT(
  value: string,
  params: string
): { dt: string; allDay: boolean } {
  // All-day: YYYYMMDD
  if (params.includes("VALUE=DATE") || (value.length === 8 && !value.includes("T"))) {
    const y = value.slice(0, 4);
    const m = value.slice(4, 6);
    const d = value.slice(6, 8);
    return { dt: `${y}-${m}-${d}T00:00:00`, allDay: true };
  }

  // Datetime: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  const y = value.slice(0, 4);
  const mo = value.slice(4, 6);
  const d = value.slice(6, 8);
  const h = value.slice(9, 11);
  const mi = value.slice(11, 13);
  const s = value.slice(13, 15) || "00";

  if (value.endsWith("Z")) {
    return { dt: `${y}-${mo}-${d}T${h}:${mi}:${s}Z`, allDay: false };
  }

  // TZID-based or bare local time → keep as local
  return { dt: `${y}-${mo}-${d}T${h}:${mi}:${s}`, allDay: false };
}

function parseICal(ical: string): ParsedEvent[] {
  const lines = unfold(ical);
  const events: ParsedEvent[] = [];
  let props: Map<string, { value: string; params: string }> | null = null;
  let exdates: string[] = [];

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      props = new Map();
      exdates = [];
      continue;
    }

    if (line === "END:VEVENT" && props) {
      const dtStart = props.get("DTSTART");
      const dtEnd = props.get("DTEND");
      const summary = props.get("SUMMARY");

      if (dtStart && summary) {
        const start = parseICalDT(dtStart.value, dtStart.params);
        const end = dtEnd
          ? parseICalDT(dtEnd.value, dtEnd.params)
          : start.allDay
            ? { dt: start.dt.replace("T00:00:00", "T23:59:59"), allDay: true }
            : {
                dt: addHoursToIso(start.dt, 1),
                allDay: false,
              };

        // For all-day events, Google sets DTEND to the next day (exclusive).
        // Adjust to inclusive end.
        let endDt = end.dt;
        if (start.allDay && end.allDay) {
          const endDate = isoToComponents(end.dt);
          const adjusted = advanceDays(
            `${endDate.y}-${endDate.m}-${endDate.d}T00:00:00`,
            -1
          );
          endDt = adjusted + "T23:59:59";
        }

        const uid = props.get("UID")?.value || `evt-${events.length}`;

        events.push({
          uid,
          title: unescape(summary.value),
          description: props.get("DESCRIPTION")
            ? unescape(props.get("DESCRIPTION")!.value)
            : null,
          location: props.get("LOCATION")
            ? unescape(props.get("LOCATION")!.value)
            : null,
          startAt: start.dt,
          endAt: endDt,
          allDay: start.allDay,
          rrule: props.get("RRULE")?.value || null,
          exdates,
        });
      }
      props = null;
      continue;
    }

    if (!props) continue;

    // Handle EXDATE specially (can appear multiple times)
    if (line.startsWith("EXDATE")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        const vals = line.slice(colonIdx + 1).split(",");
        for (const v of vals) {
          // Extract date portion YYYYMMDD → YYYY-MM-DD
          const dateStr = `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
          exdates.push(dateStr);
        }
      }
      continue;
    }

    // Parse property
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const keyPart = line.slice(0, colonIdx);
      const value = line.slice(colonIdx + 1);
      const semiIdx = keyPart.indexOf(";");
      const key = semiIdx > 0 ? keyPart.slice(0, semiIdx) : keyPart;
      const params = semiIdx > 0 ? keyPart.slice(semiIdx + 1) : "";
      props.set(key, { value, params });
    }
  }

  return events;
}

/* ── Date utilities (UTC-safe, no timezone shifting) ───── */

function isoToComponents(iso: string) {
  return {
    y: iso.slice(0, 4),
    m: iso.slice(5, 7),
    d: iso.slice(8, 10),
    h: iso.slice(11, 13),
    mi: iso.slice(14, 16),
    s: iso.slice(17, 19),
  };
}

/** Advance an ISO string by N days using UTC to avoid TZ issues */
function advanceDays(iso: string, days: number): string {
  const d = new Date(iso + "Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 19);
}

function addHoursToIso(iso: string, hours: number): string {
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  d.setUTCHours(d.getUTCHours() + hours);
  return d.toISOString().slice(0, 19) + (iso.endsWith("Z") ? "Z" : "");
}

/** Get date portion YYYY-MM-DD */
function dateOf(iso: string): string {
  return iso.slice(0, 10);
}

/** Compare date strings (YYYY-MM-DD) */
function dateGte(a: string, b: string): boolean {
  return a >= b;
}
function dateLte(a: string, b: string): boolean {
  return a <= b;
}

/* ── RRULE Expansion ───────────────────────────────────── */

const WEEKDAY_MAP: Record<string, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};

interface RRule {
  freq: string;
  interval: number;
  until: string | null; // YYYY-MM-DD
  count: number | null;
  byday: number[]; // JS weekday numbers (0=Sun)
}

function parseRRule(rule: string): RRule {
  const result: RRule = { freq: "", interval: 1, until: null, count: null, byday: [] };
  for (const part of rule.split(";")) {
    const [key, val] = part.split("=");
    switch (key) {
      case "FREQ":
        result.freq = val;
        break;
      case "INTERVAL":
        result.interval = parseInt(val) || 1;
        break;
      case "UNTIL": {
        const v = val.replace(/[TZ]/g, "");
        result.until = `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
        break;
      }
      case "COUNT":
        result.count = parseInt(val);
        break;
      case "BYDAY":
        result.byday = val.split(",").map((d) => {
          const name = d.replace(/[^A-Z]/g, ""); // strip ordinals like "2TU"
          return WEEKDAY_MAP[name] ?? -1;
        }).filter((n) => n >= 0);
        break;
    }
  }
  return result;
}

function expandEvent(
  event: ParsedEvent,
  rangeStartStr: string,
  rangeEndStr: string,
): GoogleCalendarEvent[] {
  const results: GoogleCalendarEvent[] = [];

  // Non-recurring → just return if in range
  if (!event.rrule) {
    const evDate = dateOf(event.startAt);
    if (dateGte(evDate, rangeStartStr) && dateLte(evDate, rangeEndStr)) {
      results.push(toOutput(event, event.startAt, event.endAt));
    }
    return results;
  }

  const rrule = parseRRule(event.rrule);
  const duration = computeDurationMs(event.startAt, event.endAt);
  const maxDate = rrule.until && rrule.until < rangeEndStr ? rrule.until : rangeEndStr;
  const maxCount = rrule.count || 500;
  let count = 0;

  if (rrule.freq === "WEEKLY" && rrule.byday.length > 0) {
    // WEEKLY with BYDAY: iterate week by week, emit for each matching day
    const startDate = new Date(dateOf(event.startAt) + "T12:00:00Z");
    const timeStr = event.startAt.slice(11, 19); // HH:MM:SS
    const isZ = event.startAt.endsWith("Z");

    // Find Monday of the start week
    let current = new Date(startDate);
    const dow = current.getUTCDay();
    current.setUTCDate(current.getUTCDate() - ((dow + 6) % 7)); // go to Monday

    while (count < maxCount) {
      for (const dayNum of rrule.byday) {
        const offset = dayNum === 0 ? 6 : dayNum - 1; // offset from Monday
        const d = new Date(current);
        d.setUTCDate(d.getUTCDate() + offset);
        const ds = d.toISOString().slice(0, 10);

        if (ds < dateOf(event.startAt)) continue;
        if (ds > maxDate) break;
        if (event.exdates.includes(ds)) continue;

        count++;
        if (count > maxCount) break;

        if (ds >= rangeStartStr && ds <= rangeEndStr) {
          const sAt = event.allDay ? `${ds}T00:00:00` : `${ds}T${timeStr}${isZ ? "Z" : ""}`;
          const eAt = event.allDay
            ? `${ds}T23:59:59`
            : addMsToIso(sAt, duration);
          results.push(toOutput(event, sAt, eAt, ds));
        }
      }
      if (dateOf(current.toISOString()) > maxDate) break;
      current.setUTCDate(current.getUTCDate() + 7 * rrule.interval);
    }
    return results;
  }

  // Simple recurring: DAILY, WEEKLY (no BYDAY), MONTHLY, YEARLY
  const startDate = new Date(dateOf(event.startAt) + "T12:00:00Z");
  const timeStr = event.startAt.slice(11, 19);
  const isZ = event.startAt.endsWith("Z");
  let current = new Date(startDate);

  while (count < maxCount) {
    const ds = current.toISOString().slice(0, 10);
    if (ds > maxDate) break;

    if (!event.exdates.includes(ds)) {
      count++;
      if (ds >= rangeStartStr && ds <= rangeEndStr) {
        const sAt = event.allDay ? `${ds}T00:00:00` : `${ds}T${timeStr}${isZ ? "Z" : ""}`;
        const eAt = event.allDay ? `${ds}T23:59:59` : addMsToIso(sAt, duration);
        results.push(toOutput(event, sAt, eAt, ds));
      }
    }

    // Advance
    switch (rrule.freq) {
      case "DAILY":
        current.setUTCDate(current.getUTCDate() + rrule.interval);
        break;
      case "WEEKLY":
        current.setUTCDate(current.getUTCDate() + 7 * rrule.interval);
        break;
      case "MONTHLY":
        current.setUTCMonth(current.getUTCMonth() + rrule.interval);
        break;
      case "YEARLY":
        current.setUTCFullYear(current.getUTCFullYear() + rrule.interval);
        break;
      default:
        count = maxCount; // unknown freq → stop
    }
  }

  return results;
}

function computeDurationMs(startIso: string, endIso: string): number {
  const s = new Date(startIso.endsWith("Z") ? startIso : startIso + "Z");
  const e = new Date(endIso.endsWith("Z") ? endIso : endIso + "Z");
  return e.getTime() - s.getTime();
}

function addMsToIso(iso: string, ms: number): string {
  const isZ = iso.endsWith("Z");
  const d = new Date(isZ ? iso : iso + "Z");
  d.setTime(d.getTime() + ms);
  return d.toISOString().slice(0, 19) + (isZ ? "Z" : "");
}

function toOutput(
  event: ParsedEvent,
  startAt: string,
  endAt: string,
  dateSuffix?: string,
): GoogleCalendarEvent {
  return {
    id: dateSuffix ? `gcal-${event.uid}-${dateSuffix}` : `gcal-${event.uid}`,
    title: event.title,
    description: event.description,
    location: event.location,
    start_at: startAt,
    end_at: endAt,
    all_day: event.allDay,
  };
}

/* ── API Route ─────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  // Support multiple feeds: GOOGLE_CALENDAR_ICAL_URLS (comma-separated) or legacy single GOOGLE_CALENDAR_ICAL_URL
  const urlsRaw = process.env.GOOGLE_CALENDAR_ICAL_URLS || process.env.GOOGLE_CALENDAR_ICAL_URL || "";
  const urls = urlsRaw.split(",").map((u) => u.trim()).filter(Boolean);
  if (urls.length === 0) {
    return NextResponse.json([]);
  }

  const start = req.nextUrl.searchParams.get("start");
  const end = req.nextUrl.searchParams.get("end");
  if (!start || !end) {
    return NextResponse.json({ error: "start and end params required" }, { status: 400 });
  }

  try {
    // Fetch & cache all iCal feeds
    if (!cache || Date.now() - cache.ts > CACHE_TTL) {
      const allEvents: ParsedEvent[] = [];
      const results = await Promise.allSettled(
        urls.map((url) =>
          fetch(url, { signal: AbortSignal.timeout(10000) }).then((r) =>
            r.ok ? r.text() : ""
          )
        )
      );
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          allEvents.push(...parseICal(result.value));
        }
      }
      cache = { data: allEvents, ts: Date.now() };
    }

    // Expand and filter
    const rangeStart = start.slice(0, 10); // YYYY-MM-DD
    const rangeEnd = end.slice(0, 10);
    const events: GoogleCalendarEvent[] = [];

    for (const ev of cache.data) {
      events.push(...expandEvent(ev, rangeStart, rangeEnd));
    }

    // Sort by start time
    events.sort((a, b) => a.start_at.localeCompare(b.start_at));

    return NextResponse.json(events);
  } catch (err) {
    console.error("Google Calendar error:", err);
    return NextResponse.json([]);
  }
}
