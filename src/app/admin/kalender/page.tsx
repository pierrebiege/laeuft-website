"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import type { CalendarDisplayEvent } from "@/lib/supabase";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { YearView } from "@/components/calendar/YearView";
import { MonthView } from "@/components/calendar/MonthView";
import { EventModal } from "@/components/calendar/EventModal";
import { useCalendarEvents } from "@/components/calendar/useCalendarEvents";
import { getYearRange, getMonthRange } from "@/components/calendar/calendarHelpers";

export default function KalenderPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"year" | "month">("year");
  const { events, loading, loadEvents } = useCalendarEvents();

  // Modal state
  const [modalEvent, setModalEvent] = useState<CalendarDisplayEvent | null | "new">(null);
  const [modalDate, setModalDate] = useState<Date | undefined>();
  const [modalHour, setModalHour] = useState<number | undefined>();

  const reload = useCallback(() => {
    const range = view === "year" ? getYearRange(currentDate) : getMonthRange(currentDate);
    loadEvents(range.start, range.end);
  }, [currentDate, view, loadEvents]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleNavigate = (dir: -1 | 0 | 1) => {
    if (dir === 0) {
      setCurrentDate(new Date());
      return;
    }
    const d = new Date(currentDate);
    if (view === "year") {
      d.setFullYear(d.getFullYear() + dir);
    } else {
      d.setMonth(d.getMonth() + dir);
    }
    setCurrentDate(d);
  };

  const handleEventClick = (event: CalendarDisplayEvent) => {
    setModalEvent(event);
    setModalDate(undefined);
    setModalHour(undefined);
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setView("month");
  };

  const handleMonthClick = (date: Date) => {
    setCurrentDate(date);
    setView("month");
  };

  const handleDayClickMonth = (date: Date) => {
    // In month view, clicking a day creates a new event
    setModalEvent("new");
    setModalDate(date);
    setModalHour(undefined);
  };

  const handleModalClose = () => {
    setModalEvent(null);
    setModalDate(undefined);
    setModalHour(undefined);
  };

  const handleModalSaved = () => {
    handleModalClose();
    reload();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onViewChange={setView}
          onNavigate={handleNavigate}
        />
        <button
          onClick={() => {
            setModalEvent("new");
            setModalDate(undefined);
            setModalHour(undefined);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          <Plus size={16} />
          Neuer Termin
        </button>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="text-center py-20 text-zinc-400">Laden…</div>
      ) : view === "year" ? (
        <YearView
          currentDate={currentDate}
          events={events}
          onDayClick={handleDayClick}
          onMonthClick={handleMonthClick}
        />
      ) : (
        <MonthView
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
          onDayClick={handleDayClickMonth}
        />
      )}

      {/* Event Modal */}
      {modalEvent && (
        <EventModal
          event={modalEvent === "new" ? null : modalEvent}
          defaultDate={modalDate}
          defaultHour={modalHour}
          onClose={handleModalClose}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
}
