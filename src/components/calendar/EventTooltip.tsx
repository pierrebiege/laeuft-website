"use client";

import type { CalendarDisplayEvent } from "@/lib/supabase";
import { EVENT_TYPE_MAP, VIRTUAL_EVENT_CONFIG } from "./calendarConstants";
import { formatTime, isMultiDay } from "./calendarHelpers";

interface EventTooltipProps {
  events: CalendarDisplayEvent[];
  position?: { x: number; y: number };
}

export function EventTooltip({ events, position }: EventTooltipProps) {
  if (events.length === 0) return null;

  return (
    <div
      className="absolute z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl p-2 min-w-[180px] max-w-[260px] pointer-events-none"
      style={
        position
          ? { left: position.x, top: position.y }
          : {}
      }
    >
      <div className="space-y-1.5">
        {events.slice(0, 6).map((ev) => {
          const isVirtual = ev._virtual;
          const typeConfig = isVirtual
            ? VIRTUAL_EVENT_CONFIG[ev.source as keyof typeof VIRTUAL_EVENT_CONFIG]
            : EVENT_TYPE_MAP[(ev as { event_type: string }).event_type];

          const timeStr =
            !ev.all_day && !isMultiDay(ev)
              ? `${formatTime(ev.start_at)} – ${formatTime(ev.end_at)}`
              : isMultiDay(ev)
                ? `${new Date(ev.start_at).toLocaleDateString("de-CH", { day: "numeric", month: "short" })} – ${new Date(ev.end_at).toLocaleDateString("de-CH", { day: "numeric", month: "short" })}`
                : null;

          return (
            <div key={ev.id} className="flex items-start gap-2">
              <div
                className="w-2 h-2 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: ev.color }}
              />
              <div className="min-w-0">
                <div className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                  {ev.title}
                </div>
                {timeStr && (
                  <div className="text-[10px] text-zinc-500 truncate">{timeStr}</div>
                )}
                {typeConfig && (
                  <div className="text-[10px] text-zinc-400">{typeConfig.label}</div>
                )}
              </div>
            </div>
          );
        })}
        {events.length > 6 && (
          <div className="text-[10px] text-zinc-400 text-center">
            +{events.length - 6} weitere
          </div>
        )}
      </div>
    </div>
  );
}
