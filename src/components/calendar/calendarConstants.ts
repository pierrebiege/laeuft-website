import {
  Briefcase,
  Users,
  Dumbbell,
  Palmtree,
  AlertCircle,
  Coffee,
  Plane,
  CalendarClock,
  Receipt,
  Handshake,
} from "lucide-react";

export type CalendarEventType =
  | "work"
  | "meeting"
  | "training"
  | "holiday"
  | "deadline"
  | "personal"
  | "travel";

export type RecurrenceRule = "daily" | "weekly" | "monthly" | "weekdays";

export const EVENT_TYPES: {
  value: CalendarEventType;
  label: string;
  color: string;
  icon: typeof Briefcase;
}[] = [
  { value: "work", label: "Arbeit", color: "#3b82f6", icon: Briefcase },
  { value: "meeting", label: "Meeting", color: "#8b5cf6", icon: Users },
  { value: "training", label: "Training", color: "#22c55e", icon: Dumbbell },
  { value: "holiday", label: "Ferien", color: "#f59e0b", icon: Palmtree },
  { value: "deadline", label: "Deadline", color: "#ef4444", icon: AlertCircle },
  { value: "personal", label: "Persönlich", color: "#06b6d4", icon: Coffee },
  { value: "travel", label: "Reise", color: "#f97316", icon: Plane },
];

export const EVENT_TYPE_MAP = Object.fromEntries(
  EVENT_TYPES.map((t) => [t.value, t])
);

export const VIRTUAL_EVENT_CONFIG = {
  partner_followup: { label: "Partner Follow-up", color: "#a855f7", icon: CalendarClock },
  invoice_due: { label: "Rechnung fällig", color: "#ef4444", icon: Receipt },
  mandate_billing: { label: "Mandat-Abrechnung", color: "#f59e0b", icon: Handshake },
};

export const RECURRENCE_OPTIONS: { value: RecurrenceRule | ""; label: string }[] = [
  { value: "", label: "Keine" },
  { value: "daily", label: "Täglich" },
  { value: "weekly", label: "Wöchentlich" },
  { value: "monthly", label: "Monatlich" },
  { value: "weekdays", label: "Werktage (Mo–Fr)" },
];

export const COLOR_PRESETS = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
];

export const HOUR_START = 6;
export const HOUR_END = 22;
export const HOUR_HEIGHT = 60; // px per hour
