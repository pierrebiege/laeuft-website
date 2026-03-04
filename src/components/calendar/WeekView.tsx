"use client";

import { useEffect, useState } from "react";
import type { CalendarDisplayEvent } from "@/lib/supabase";
import { EventBlock } from "./EventBlock";
import {
  getWeekDays,
  isToday,
  isSameDay,
  formatDateShort,
  getEventPosition,
  getCurrentTimePosition,
  getEventsForDay,
  detectOverlaps,
} from "./calendarHelpers";
import { HOUR_START, HOUR_END, HOUR_HEIGHT } from "./calendarConstants";

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

interface WeekViewProps {
  currentDate: Date;
  events: CalendarDisplayEvent[];
  onEventClick: (event: CalendarDisplayEvent) => void;
  onSlotClick: (date: Date, hour: number) => void;
}

export function WeekView({ currentDate, events, onEventClick, onSlotClick }: WeekViewProps) {
  const weekDays = getWeekDays(currentDate);
  const [timeLineTop, setTimeLineTop] = useState(getCurrentTimePosition());

  // Update current time line every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLineTop(getCurrentTimePosition());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const gridHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* All-day row */}
      {(() => {
        const allDayEvents = weekDays.map((day) => getEventsForDay(events, day).allDay);
        const hasAllDay = allDayEvents.some((e) => e.length > 0);
        if (!hasAllDay) return null;
        return (
          <div className="grid border-b border-zinc-200 dark:border-zinc-800" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
            <div className="px-2 py-2 text-[10px] text-zinc-400 text-right border-r border-zinc-100 dark:border-zinc-800">
              ganztag
            </div>
            {weekDays.map((day, di) => (
              <div
                key={di}
                className={`px-1 py-1 space-y-0.5 min-h-[32px] border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 ${
                  isToday(day) ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                }`}
              >
                {allDayEvents[di].map((ev) => (
                  <EventBlock key={ev.id} event={ev} compact onClick={() => onEventClick(ev)} />
                ))}
              </div>
            ))}
          </div>
        );
      })()}

      {/* Header row */}
      <div
        className="grid border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10"
        style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}
      >
        <div className="border-r border-zinc-100 dark:border-zinc-800" />
        {weekDays.map((day, i) => {
          const today = isToday(day);
          return (
            <div
              key={i}
              className={`text-center py-2 border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 ${
                today ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
              }`}
            >
              <div className="text-[10px] font-medium text-zinc-400 uppercase">{DAYS[i]}</div>
              <div
                className={`text-sm font-semibold ${
                  today
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-900 dark:text-white"
                }`}
              >
                {day.getDate()}
              </div>
              <div className="text-[10px] text-zinc-400">
                {formatDateShort(day).split(" ")[1]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 240px)" }}>
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: "60px repeat(7, 1fr)",
            height: gridHeight,
          }}
        >
          {/* Time labels */}
          <div className="relative border-r border-zinc-100 dark:border-zinc-800">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-2 text-[10px] text-zinc-400 -translate-y-1/2"
                style={{ top: (h - HOUR_START) * HOUR_HEIGHT }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, di) => {
            const { timed } = getEventsForDay(events, day);
            const overlaps = detectOverlaps(timed);
            const today = isToday(day);

            return (
              <div
                key={di}
                className={`relative border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 ${
                  today ? "bg-blue-50/30 dark:bg-blue-900/5" : ""
                }`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const hour = Math.floor(y / HOUR_HEIGHT) + HOUR_START;
                  onSlotClick(day, hour);
                }}
              >
                {/* Hour grid lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-zinc-100 dark:border-zinc-800"
                    style={{ top: (h - HOUR_START) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Current time line */}
                {today && timeLineTop > 0 && timeLineTop < gridHeight && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: timeLineTop }}
                  >
                    <div className="relative">
                      <div className="absolute -left-1 -top-[4px] w-2 h-2 bg-red-500 rounded-full" />
                      <div className="h-[2px] bg-red-500 w-full" />
                    </div>
                  </div>
                )}

                {/* Events */}
                {timed.map((ev) => {
                  const pos = getEventPosition(ev.start_at, ev.end_at);
                  const overlap = overlaps.get(ev.id) || { column: 0, totalColumns: 1 };
                  const width = `${100 / overlap.totalColumns}%`;
                  const left = `${(overlap.column / overlap.totalColumns) * 100}%`;

                  return (
                    <div
                      key={ev.id}
                      className="absolute z-10 px-0.5"
                      style={{
                        top: pos.top,
                        height: pos.height,
                        left,
                        width,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EventBlock
                        event={ev}
                        style={{ height: "100%" }}
                        onClick={() => onEventClick(ev)}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
