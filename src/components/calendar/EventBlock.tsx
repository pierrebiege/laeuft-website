"use client";

import type { CalendarDisplayEvent } from "@/lib/supabase";
import { EVENT_TYPE_MAP, VIRTUAL_EVENT_CONFIG } from "./calendarConstants";
import { formatTime } from "./calendarHelpers";

interface EventBlockProps {
  event: CalendarDisplayEvent;
  style?: React.CSSProperties;
  compact?: boolean;
  onClick: () => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function EventBlock({ event, style, compact, onClick }: EventBlockProps) {
  const isVirtual = event._virtual;
  const color = event.color;

  const typeConfig = isVirtual
    ? VIRTUAL_EVENT_CONFIG[event.source as keyof typeof VIRTUAL_EVENT_CONFIG]
    : EVENT_TYPE_MAP[event.event_type];

  const timeStr = !event.all_day
    ? `${formatTime(event.start_at)} – ${formatTime(event.end_at)}`
    : null;

  return (
    <button
      onClick={onClick}
      style={{
        ...style,
        backgroundColor: hexToRgba(color, 0.12),
        borderLeftColor: color,
      }}
      className={`
        block w-full text-left rounded-md px-2 py-1 border-l-[3px] cursor-pointer
        hover:opacity-80 transition-opacity overflow-hidden
        ${isVirtual ? "border-dashed" : ""}
        ${compact ? "py-0.5" : ""}
      `}
    >
      <div className={`font-medium truncate ${compact ? "text-[10px]" : "text-xs"}`} style={{ color }}>
        {event.title}
      </div>
      {timeStr && !compact && (
        <div className="text-[10px] text-zinc-500 truncate">{timeStr}</div>
      )}
      {!isVirtual && !compact && typeConfig && (
        <div className="text-[10px] text-zinc-400 truncate">{typeConfig.label}</div>
      )}
    </button>
  );
}
