"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { getWeekNumber, formatDateRange, getWeekRange } from "./calendarHelpers";

interface CalendarHeaderProps {
  currentDate: Date;
  view: "week" | "month";
  onViewChange: (v: "week" | "month") => void;
  onNavigate: (dir: -1 | 0 | 1) => void;
}

export function CalendarHeader({ currentDate, view, onViewChange, onNavigate }: CalendarHeaderProps) {
  const { start, end } = getWeekRange(currentDate);
  const weekNum = getWeekNumber(currentDate);

  const label =
    view === "week"
      ? `KW ${weekNum} · ${formatDateRange(start, end)}`
      : currentDate.toLocaleDateString("de-CH", { month: "long", year: "numeric" });

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNavigate(-1)}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => onNavigate(1)}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={() => onNavigate(0)}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors"
        >
          Heute
        </button>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">{label}</h1>
      </div>

      <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
        {(["week", "month"] as const).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              view === v
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {v === "week" ? "Woche" : "Monat"}
          </button>
        ))}
      </div>
    </div>
  );
}
