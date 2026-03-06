"use client";

import type { CalendarSource } from "./useCalendarEvents";

interface CalendarFiltersProps {
  sources: CalendarSource[];
  disabled: Set<string>;
  onToggle: (sourceId: string) => void;
}

export function CalendarFilters({ sources, disabled, onToggle }: CalendarFiltersProps) {
  if (sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {sources.map((s) => {
        const isEnabled = !disabled.has(s.id);
        return (
          <button
            key={s.id}
            onClick={() => onToggle(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
              isEnabled
                ? "border-transparent text-white"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-400 bg-transparent"
            }`}
            style={
              isEnabled
                ? { backgroundColor: s.color }
                : undefined
            }
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isEnabled ? "bg-white/60" : ""
              }`}
              style={!isEnabled ? { backgroundColor: s.color, opacity: 0.4 } : undefined}
            />
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
