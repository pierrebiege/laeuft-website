"use client";

import { useState, useRef } from "react";
import type { CalendarDisplayEvent } from "@/lib/supabase";
import { EventBlock } from "./EventBlock";
import { getMonthGrid, isToday, isSameDay, isMultiDay, getEventDateRange } from "./calendarHelpers";
import { EventTooltip } from "./EventTooltip";

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MAX_VISIBLE = 3;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface MonthViewProps {
  currentDate: Date;
  events: CalendarDisplayEvent[];
  onEventClick: (event: CalendarDisplayEvent) => void;
  onDayClick: (date: Date) => void;
}

interface MultiDayBar {
  event: CalendarDisplayEvent;
  startCol: number;
  span: number;
  row: number;
}

function getMultiDayBarsForWeek(
  week: Date[],
  events: CalendarDisplayEvent[]
): MultiDayBar[] {
  const multiDayEvents = events.filter((ev) => isMultiDay(ev));
  const bars: MultiDayBar[] = [];
  const usedRows: Map<number, Set<number>>[] = week.map(() => new Map());

  for (const ev of multiDayEvents) {
    const eventDates = getEventDateRange(ev);

    // Find which columns of this week the event overlaps
    let startCol = -1;
    let endCol = -1;
    for (let col = 0; col < 7; col++) {
      const matchesDay = eventDates.some((d) => isSameDay(d, week[col]));
      if (matchesDay) {
        if (startCol === -1) startCol = col;
        endCol = col;
      }
    }

    if (startCol === -1) continue;

    // Find first available row
    let row = 0;
    while (true) {
      let rowFree = true;
      for (let col = startCol; col <= endCol; col++) {
        if (usedRows[col].has(row)) {
          rowFree = false;
          break;
        }
      }
      if (rowFree) break;
      row++;
    }

    // Mark row as used for these columns
    for (let col = startCol; col <= endCol; col++) {
      usedRows[col].set(row, new Set());
    }

    bars.push({
      event: ev,
      startCol,
      span: endCol - startCol + 1,
      row,
    });
  }

  return bars;
}

export function MonthView({ currentDate, events, onEventClick, onDayClick }: MonthViewProps) {
  const weeks = getMonthGrid(currentDate);
  const currentMonth = currentDate.getMonth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    events: CalendarDisplayEvent[];
    position: { x: number; y: number };
  } | null>(null);

  function getEventsForDay(day: Date): CalendarDisplayEvent[] {
    return events.filter((ev) => {
      if (isMultiDay(ev)) return false; // Multi-day events rendered as bars
      return isSameDay(new Date(ev.start_at), day);
    });
  }

  function getAllEventsForDay(day: Date): CalendarDisplayEvent[] {
    return events.filter((ev) => {
      if (isMultiDay(ev)) {
        return getEventDateRange(ev).some((d) => isSameDay(d, day));
      }
      return isSameDay(new Date(ev.start_at), day);
    });
  }

  const handleEventHover = (ev: CalendarDisplayEvent, e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (rect) {
      setTooltip({
        events: [ev],
        position: {
          x: targetRect.left - rect.left,
          y: targetRect.bottom - rect.top + 4,
        },
      });
    }
  };

  return (
    <div ref={containerRef} className="relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
        {DAYS.map((d) => (
          <div key={d} className="text-center py-2 text-[10px] font-medium text-zinc-400 uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => {
        const multiDayBars = getMultiDayBarsForWeek(week, events);
        const maxBarRow = multiDayBars.length > 0 ? Math.max(...multiDayBars.map((b) => b.row)) + 1 : 0;

        return (
          <div key={wi} className="relative border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
            {/* Multi-day bars */}
            {multiDayBars.length > 0 && (
              <div className="grid grid-cols-7" style={{ minHeight: maxBarRow * 22 + 28 }}>
                {/* Day numbers */}
                {week.map((day, di) => {
                  const isCurrentMonth = day.getMonth() === currentMonth;
                  const today = isToday(day);
                  return (
                    <div
                      key={`num-${di}`}
                      className={`px-1 pt-1 ${!isCurrentMonth ? "opacity-40" : ""}`}
                    >
                      <div
                        className={`text-xs font-medium px-1 ${
                          today
                            ? "text-blue-600 dark:text-blue-400 font-bold"
                            : "text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    </div>
                  );
                })}

                {/* Bar overlays */}
                {multiDayBars.map((bar) => {
                  const leftPercent = (bar.startCol / 7) * 100;
                  const widthPercent = (bar.span / 7) * 100;
                  const isStart = isSameDay(new Date(bar.event.start_at), week[bar.startCol]);
                  const isEnd = (() => {
                    const endDate = new Date(bar.event.end_at);
                    return isSameDay(endDate, week[bar.startCol + bar.span - 1]);
                  })();

                  return (
                    <button
                      key={bar.event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(bar.event);
                      }}
                      onMouseEnter={(e) => handleEventHover(bar.event, e)}
                      onMouseLeave={() => setTooltip(null)}
                      className={`absolute h-[18px] cursor-pointer hover:opacity-80 transition-opacity text-[10px] font-medium truncate px-1.5 flex items-center ${
                        isStart ? "rounded-l-md" : ""
                      } ${isEnd ? "rounded-r-md" : ""}`}
                      style={{
                        left: `calc(${leftPercent}% + 2px)`,
                        width: `calc(${widthPercent}% - 4px)`,
                        top: 24 + bar.row * 20,
                        backgroundColor: hexToRgba(bar.event.color, 0.2),
                        color: bar.event.color,
                        borderLeft: isStart ? `3px solid ${bar.event.color}` : undefined,
                      }}
                    >
                      {bar.event.title}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Day cells with single-day events */}
            <div className="grid grid-cols-7">
              {week.map((day, di) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = day.getMonth() === currentMonth;
                const today = isToday(day);
                const overflow = dayEvents.length - MAX_VISIBLE;

                return (
                  <div
                    key={di}
                    className={`min-h-[80px] p-1 border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                      today ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                    } ${!isCurrentMonth ? "opacity-40" : ""}`}
                    onClick={() => onDayClick(day)}
                  >
                    {/* Show day number only if no multi-day bars (otherwise shown above) */}
                    {multiDayBars.length === 0 && (
                      <div
                        className={`text-xs font-medium mb-1 px-1 ${
                          today
                            ? "text-blue-600 dark:text-blue-400 font-bold"
                            : "text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    )}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, MAX_VISIBLE).map((ev) => (
                        <div
                          key={ev.id}
                          onMouseEnter={(e) => handleEventHover(ev, e)}
                          onMouseLeave={() => setTooltip(null)}
                        >
                          <EventBlock
                            event={ev}
                            compact
                            onClick={() => onEventClick(ev)}
                          />
                        </div>
                      ))}
                      {overflow > 0 && (
                        <div className="text-[10px] text-zinc-400 px-1">+{overflow} mehr</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Tooltip */}
      {tooltip && (
        <EventTooltip events={tooltip.events} position={tooltip.position} />
      )}
    </div>
  );
}
