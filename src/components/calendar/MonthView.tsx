"use client";

import type { CalendarDisplayEvent } from "@/lib/supabase";
import { EventBlock } from "./EventBlock";
import { getMonthGrid, isToday, isSameDay } from "./calendarHelpers";

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MAX_VISIBLE = 3;

interface MonthViewProps {
  currentDate: Date;
  events: CalendarDisplayEvent[];
  onEventClick: (event: CalendarDisplayEvent) => void;
  onDayClick: (date: Date) => void;
}

export function MonthView({ currentDate, events, onEventClick, onDayClick }: MonthViewProps) {
  const weeks = getMonthGrid(currentDate);
  const currentMonth = currentDate.getMonth();

  function getEventsForDay(day: Date): CalendarDisplayEvent[] {
    return events.filter((ev) => isSameDay(new Date(ev.start_at), day));
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
        {DAYS.map((d) => (
          <div key={d} className="text-center py-2 text-[10px] font-medium text-zinc-400 uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
          {week.map((day, di) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = day.getMonth() === currentMonth;
            const today = isToday(day);
            const overflow = dayEvents.length - MAX_VISIBLE;

            return (
              <div
                key={di}
                className={`min-h-[100px] p-1 border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                  today ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                } ${!isCurrentMonth ? "opacity-40" : ""}`}
                onClick={() => onDayClick(day)}
              >
                <div
                  className={`text-xs font-medium mb-1 px-1 ${
                    today
                      ? "text-blue-600 dark:text-blue-400 font-bold"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, MAX_VISIBLE).map((ev) => (
                    <EventBlock
                      key={ev.id}
                      event={ev}
                      compact
                      onClick={() => onEventClick(ev)}
                    />
                  ))}
                  {overflow > 0 && (
                    <div className="text-[10px] text-zinc-400 px-1">+{overflow} mehr</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
