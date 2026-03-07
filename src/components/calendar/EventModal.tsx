"use client";

import { useState, useEffect } from "react";
import { X, Trash2, ExternalLink } from "lucide-react";
import type { CalendarDisplayEvent, CalendarEvent, CalendarEventType, RecurrenceRule } from "@/lib/supabase";
import { EVENT_TYPES, COLOR_PRESETS, RECURRENCE_OPTIONS } from "./calendarConstants";
import { VIRTUAL_EVENT_CONFIG } from "./calendarConstants";
import { toDateStr, toTimeStr } from "./calendarHelpers";
import { supabase } from "@/lib/supabase";

interface EventModalProps {
  event: CalendarDisplayEvent | null; // null = new event
  defaultDate?: Date;
  defaultHour?: number;
  onClose: () => void;
  onSaved: () => void;
}

type LinkType = "" | "partner" | "client" | "mandate" | "invoice";

export function EventModal({ event, defaultDate, defaultHour, onClose, onSaved }: EventModalProps) {
  const isVirtual = event?._virtual;
  const isEdit = event && !isVirtual;

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<CalendarEventType>("work");
  const [color, setColor] = useState("#3b82f6");
  const [date, setDate] = useState(toDateStr(defaultDate || new Date()));
  const [endDate, setEndDate] = useState(toDateStr(defaultDate || new Date()));
  const [startTime, setStartTime] = useState(defaultHour != null ? `${String(defaultHour).padStart(2, "0")}:00` : "09:00");
  const [endTime, setEndTime] = useState(defaultHour != null ? `${String(defaultHour + 1).padStart(2, "0")}:00` : "10:00");
  const [allDay, setAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceRule | "">("");
  const [recurrenceEnd, setRecurrenceEnd] = useState("");
  const [linkType, setLinkType] = useState<LinkType>("");
  const [linkId, setLinkId] = useState("");
  const [saving, setSaving] = useState(false);

  // Link entities (still loaded via anon client — these are read-only lookups for dropdowns)
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [mandates, setMandates] = useState<{ id: string; title: string }[]>([]);
  const [invoices, setInvoices] = useState<{ id: string; invoice_number: string }[]>([]);

  // Load existing event data
  useEffect(() => {
    if (isEdit) {
      const ev = event as CalendarEvent & { _virtual: false };
      setTitle(ev.title);
      setDescription(ev.description || "");
      setEventType(ev.event_type);
      setColor(ev.color);
      const start = new Date(ev.start_at);
      const end = new Date(ev.end_at);
      setDate(toDateStr(start));
      setEndDate(toDateStr(end));
      setStartTime(toTimeStr(start));
      setEndTime(toTimeStr(end));
      setAllDay(ev.all_day);
      setRecurrence(ev.recurrence_rule || "");
      setRecurrenceEnd(ev.recurrence_end || "");
      if (ev.partner_id) { setLinkType("partner"); setLinkId(ev.partner_id); }
      else if (ev.client_id) { setLinkType("client"); setLinkId(ev.client_id); }
      else if (ev.mandate_id) { setLinkType("mandate"); setLinkId(ev.mandate_id); }
      else if (ev.invoice_id) { setLinkType("invoice"); setLinkId(ev.invoice_id); }
    }
  }, [event]);

  // Load link entities when type changes
  useEffect(() => {
    if (linkType === "partner" && partners.length === 0) {
      supabase.from("partners").select("id, name").order("name").then(({ data }) => setPartners(data || []));
    }
    if (linkType === "client" && clients.length === 0) {
      supabase.from("clients").select("id, name").order("name").then(({ data }) => setClients(data || []));
    }
    if (linkType === "mandate" && mandates.length === 0) {
      supabase.from("mandates").select("id, title").order("title").then(({ data }) => setMandates(data || []));
    }
    if (linkType === "invoice" && invoices.length === 0) {
      supabase.from("invoices").select("id, invoice_number").order("invoice_number", { ascending: false }).then(({ data }) => setInvoices(data || []));
    }
  }, [linkType]);

  // Auto-set color when type changes
  const handleTypeChange = (t: CalendarEventType) => {
    setEventType(t);
    const cfg = EVENT_TYPES.find((et) => et.value === t);
    if (cfg) setColor(cfg.color);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const startAt = allDay ? `${date}T00:00:00` : `${date}T${startTime}:00`;
    const endAt = allDay ? `${endDate}T23:59:59` : `${date}T${endTime}:00`;

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      start_at: startAt,
      end_at: endAt,
      all_day: allDay,
      event_type: eventType,
      color,
      partner_id: linkType === "partner" ? linkId || null : null,
      client_id: linkType === "client" ? linkId || null : null,
      mandate_id: linkType === "mandate" ? linkId || null : null,
      invoice_id: linkType === "invoice" ? linkId || null : null,
      recurrence_rule: recurrence || null,
      recurrence_end: recurrence && recurrenceEnd ? recurrenceEnd : null,
    };

    if (isEdit) {
      // Handle recurring event instance IDs (e.g., "uuid-2026-03-04")
      const realId = (event as CalendarEvent).id.split("-").length > 5
        ? (event as CalendarEvent).id.split("-").slice(0, 5).join("-")
        : (event as CalendarEvent).id;
      await fetch("/api/calendar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: realId, ...payload }),
      });
    } else {
      await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    onSaved();
  };

  const handleDelete = async () => {
    if (!isEdit || !confirm("Termin löschen?")) return;
    const realId = (event as CalendarEvent).id.split("-").length > 5
      ? (event as CalendarEvent).id.split("-").slice(0, 5).join("-")
      : (event as CalendarEvent).id;
    await fetch(`/api/calendar?id=${realId}`, { method: "DELETE" });
    onSaved();
  };

  // Virtual event → read-only view
  if (isVirtual && event) {
    const source = event.source as keyof typeof VIRTUAL_EVENT_CONFIG;
    const cfg = VIRTUAL_EVENT_CONFIG[source];
    const linkHref =
      source === "partner_followup" ? `/admin/partners/${event.sourceId}` :
      source === "invoice_due" ? `/admin/rechnungen` :
      `/admin/mandate`;

    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="text-xs font-medium text-zinc-500">{cfg.label}</span>
            </div>
            <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="p-5 space-y-3">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{event.title}</h3>
            <p className="text-sm text-zinc-500">{event.sourceName}</p>
            <p className="text-sm text-zinc-500">
              {new Date(event.start_at).toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <a
              href={linkHref}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              <ExternalLink size={14} />
              Zur Quelle
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {isEdit ? "Termin bearbeiten" : "Neuer Termin"}
          </h3>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <input
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
            placeholder="Titel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          {/* Type + Color */}
          <div className="flex items-center gap-3">
            <select
              className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              value={eventType}
              onChange={(e) => handleTypeChange(e.target.value as CalendarEventType)}
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <div className="flex gap-1">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-zinc-900 dark:ring-white dark:ring-offset-zinc-900" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Date + Time + All-day */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="date"
                className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
              />
              {allDay && (
                <>
                  <span className="text-zinc-400 text-sm">–</span>
                  <input
                    type="date"
                    className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                    value={endDate}
                    min={date}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </>
              )}
              <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => {
                    setAllDay(e.target.checked);
                    if (e.target.checked) setEndDate(date);
                  }}
                  className="rounded border-zinc-300 dark:border-zinc-600"
                />
                Ganztägig
              </label>
            </div>
            {!allDay && (
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  step="900"
                />
                <span className="text-zinc-400 text-sm">–</span>
                <input
                  type="time"
                  className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  step="900"
                />
              </div>
            )}
          </div>

          {/* Recurrence */}
          <div className="flex items-center gap-3">
            <select
              className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceRule | "")}
            >
              {RECURRENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {recurrence && (
              <input
                type="date"
                className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                placeholder="Bis"
                value={recurrenceEnd}
                onChange={(e) => setRecurrenceEnd(e.target.value)}
              />
            )}
          </div>

          {/* Link */}
          <div className="flex items-center gap-3">
            <select
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              value={linkType}
              onChange={(e) => { setLinkType(e.target.value as LinkType); setLinkId(""); }}
            >
              <option value="">Keine Verknüpfung</option>
              <option value="partner">Partner</option>
              <option value="client">Kunde</option>
              <option value="mandate">Mandat</option>
              <option value="invoice">Rechnung</option>
            </select>
            {linkType && (
              <select
                className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                value={linkId}
                onChange={(e) => setLinkId(e.target.value)}
              >
                <option value="">– Wählen –</option>
                {linkType === "partner" && partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                {linkType === "client" && clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                {linkType === "mandate" && mandates.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                {linkType === "invoice" && invoices.map((i) => <option key={i.id} value={i.id}>{i.invoice_number}</option>)}
              </select>
            )}
          </div>

          {/* Notes */}
          <textarea
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white min-h-[60px]"
            placeholder="Notizen…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-200 dark:border-zinc-800">
          {isEdit ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={14} />
              Löschen
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="px-4 py-2 text-sm font-medium bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
            >
              {saving ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
