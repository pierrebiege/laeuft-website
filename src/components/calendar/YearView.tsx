"use client";

import { useState, useRef } from "react";
import type { CalendarDisplayEvent } from "@/lib/supabase";
import { getMiniMonthGrid, isToday, isSameDay, getEventsForDayMulti } from "./calendarHelpers";
import { EventTooltip } from "./EventTooltip";

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April",
  "Mai", "Juni", "Juli", "August",
  "September", "Oktober", "November", "Dezember",
];

interface YearViewProps {
  currentDate: Date;
  events: CalendarDisplayEvent[];
  onDayClick: (date: Date) => void;
  onMonthClick: (date: Date) => void;
}

export function YearView({ currentDate, events, onDayClick, onMonthClick }: YearViewProps) {
  const year = currentDate.getFullYear();
  const [tooltip, setTooltip] = useState<{
    events: CalendarDisplayEvent[];
    position: { x: number; y: number };
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDayHover = (day: Date, e: React.MouseEvent) => {
    const dayEvents = getEventsForDayMulti(events, day);
    if (dayEvents.length === 0) {
      setTooltip(null);
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (rect) {
      setTooltip({
        events: dayEvents,
        position: {
          x: targetRect.left - rect.left + targetRect.width / 2,
          y: targetRect.bottom - rect.top + 4,
        },
      });
    }
  };

  return (
    <div ref={containerRef} className="relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {MONTHS.map((monthName, monthIndex) => {
          const weeks = getMiniMonthGrid(year, monthIndex);
          const isCurrentMonth =
            new Date().getFullYear() === year && new Date().getMonth() === monthIndex;

          return (
            <div key={monthIndex} className="min-w-0">
              {/* Month name */}
              <button
                onClick={() => onMonthClick(new Date(year, monthIndex, 1))}
                className={`text-sm font-semibold mb-2 block hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                  isCurrentMonth
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-zinc-900 dark:text-white"
                }`}
              >
                {monthName}
              </button>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-0.5">
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[9px] font-medium text-zinc-400 leading-tight"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7">
                  {week.map((day, di) => {
                    if (!day) {
                      return <div key={di} className="h-6" />;
                    }

                    const dayEvents = getEventsForDayMulti(events, day);
                    const today = isToday(day);

                    return (
                      <button
                        key={di}
                        onClick={() => onDayClick(day)}
                        onMouseEnter={(e) => handleDayHover(day, e)}
                        onMouseLeave={() => setTooltip(null)}
                        className={`h-6 flex flex-col items-center justify-start pt-0.5 rounded-md text-[10px] transition-colors relative ${
                          today
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <span className="leading-none">{day.getDate()}</span>
                        {/* Event dots */}
                        {dayEvents.length > 0 && (
                          <div className="flex gap-px mt-px">
                            {dayEvents.slice(0, 3).map((ev, i) => (
                              <div
                                key={i}
                                className="w-1 h-1 rounded-full"
                                style={{ backgroundColor: ev.color }}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <EventTooltip events={tooltip.events} position={tooltip.position} />
      )}
    </div>
  );
}
