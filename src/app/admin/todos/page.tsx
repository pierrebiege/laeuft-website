"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Check,
  GripVertical,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronRight,
  Trash2,
  Building2,
  Target,
  Users,
} from "lucide-react";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  priority: "low" | "normal" | "high" | "urgent";
  client_id: string | null;
  partner_id: string | null;
  prospect_id: string | null;
  offer_id: string | null;
  mandate_id: string | null;
  invoice_id: string | null;
  created_at: string;
  client?: { id: string; name: string; company: string | null } | null;
  partner?: { id: string; name: string } | null;
  prospect?: { id: string; company: string } | null;
}

interface LinkOption {
  id: string;
  label: string;
  type: "client" | "partner" | "prospect";
}

const PRIORITY_CONFIG = {
  urgent: { label: "Dringend", color: "text-red-600", dot: "bg-red-500" },
  high: { label: "Hoch", color: "text-orange-600", dot: "bg-orange-500" },
  normal: { label: "Normal", color: "text-zinc-600", dot: "bg-blue-500" },
  low: { label: "Tief", color: "text-zinc-400", dot: "bg-zinc-400" },
};

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showOverdue, setShowOverdue] = useState(true);
  const [linkOptions, setLinkOptions] = useState<LinkOption[]>([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: new Date().toISOString().split("T")[0],
    priority: "normal" as Todo["priority"],
    link_type: "" as "" | "client" | "partner" | "prospect",
    link_id: "",
  });

  useEffect(() => {
    loadTodos();
    loadLinkOptions();
  }, []);

  async function loadTodos() {
    const { data, error } = await supabase
      .from("todos")
      .select("*, client:clients(id, name, company), partner:partners(id, name), prospect:prospects(id, company)")
      .order("completed", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Error loading todos:", error);
    } else {
      setTodos(data || []);
    }
    setLoading(false);
  }

  async function loadLinkOptions() {
    const [clients, partners, prospects] = await Promise.all([
      supabase.from("clients").select("id, name, company").order("company"),
      supabase.from("partners").select("id, name").order("name"),
      supabase.from("prospects").select("id, company").eq("status", "neu").order("company"),
    ]);

    const options: LinkOption[] = [
      ...(clients.data || []).map((c) => ({
        id: c.id,
        label: c.company ? `${c.company} (${c.name})` : c.name,
        type: "client" as const,
      })),
      ...(partners.data || []).map((p) => ({
        id: p.id,
        label: p.name,
        type: "partner" as const,
      })),
      ...(prospects.data || []).map((p) => ({
        id: p.id,
        label: p.company,
        type: "prospect" as const,
      })),
    ];

    setLinkOptions(options);
  }

  async function saveTodo() {
    if (!form.title.trim()) {
      alert("Titel ist Pflichtfeld");
      return;
    }
    setSaving(true);

    const insert: Record<string, unknown> = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.due_date || null,
      priority: form.priority,
    };

    if (form.link_type === "client" && form.link_id) insert.client_id = form.link_id;
    if (form.link_type === "partner" && form.link_id) insert.partner_id = form.link_id;
    if (form.link_type === "prospect" && form.link_id) insert.prospect_id = form.link_id;

    const { error } = await supabase.from("todos").insert(insert);

    if (error) {
      alert("Fehler beim Speichern");
      console.error(error);
    } else {
      setForm({ title: "", description: "", due_date: new Date().toISOString().split("T")[0], priority: "normal", link_type: "", link_id: "" });
      setShowForm(false);
      loadTodos();
    }
    setSaving(false);
  }

  async function toggleComplete(todoId: string, currentlyCompleted: boolean) {
    // Optimistic update
    setTodos(todos.map((t) =>
      t.id === todoId
        ? { ...t, completed: !currentlyCompleted, completed_at: currentlyCompleted ? null : new Date().toISOString() }
        : t
    ));

    const updates = currentlyCompleted
      ? { completed: false, completed_at: null }
      : { completed: true, completed_at: new Date().toISOString() };

    supabase.from("todos").update(updates).eq("id", todoId);
  }

  async function deleteTodo(todoId: string) {
    if (!confirm("Aufgabe löschen?")) return;
    const { error } = await supabase.from("todos").delete().eq("id", todoId);
    if (!error) loadTodos();
  }

  const today = new Date().toISOString().split("T")[0];

  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  const overdueTodos = activeTodos.filter((t) => t.due_date && t.due_date < today);
  const todayTodos = activeTodos.filter((t) => t.due_date === today);
  const upcomingTodos = activeTodos.filter((t) => t.due_date && t.due_date > today);
  const noDueTodos = activeTodos.filter((t) => !t.due_date);

  function formatDate(date: string) {
    return new Date(date + "T00:00:00").toLocaleDateString("de-CH", {
      day: "numeric",
      month: "short",
    });
  }

  function formatWeekday(date: string) {
    return new Date(date + "T00:00:00").toLocaleDateString("de-CH", { weekday: "long" });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const allActive = [...overdueTodos, ...todayTodos, ...upcomingTodos, ...noDueTodos];
    const oldIndex = allActive.findIndex((t) => t.id === active.id);
    const newIndex = allActive.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update — sofort im UI ändern
    const reordered = [...allActive];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    const updatedTodos = todos.map((t) => {
      const newIdx = reordered.findIndex((r) => r.id === t.id);
      return newIdx >= 0 ? { ...t, sort_order: newIdx } : t;
    });
    setTodos(updatedTodos);

    // DB-Updates im Hintergrund (parallel, nicht sequenziell)
    const updates = reordered.map((t, i) =>
      supabase.from("todos").update({ sort_order: i }).eq("id", t.id)
    );
    Promise.all(updates);
  }

  function SortableTodoItem({ todo }: { todo: Todo }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
    const prio = PRIORITY_CONFIG[todo.priority];
    const isOverdue = todo.due_date && todo.due_date < today;

    return (
      <div ref={setNodeRef} style={style}
        className="flex items-start gap-2 py-3 px-4 group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors"
      >
        <div {...attributes} {...listeners} className="mt-1 flex-shrink-0 cursor-grab active:cursor-grabbing text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400">
          <GripVertical size={14} />
        </div>
        <button
          onClick={() => toggleComplete(todo.id, todo.completed)}
          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors group/check ${
            todo.completed
              ? "border-green-500 bg-green-500"
              : "border-zinc-300 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-400"
          }`}
        >
          <Check size={12} className={todo.completed ? "text-white" : "text-zinc-300 opacity-0 group-hover/check:opacity-100 transition-opacity"} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className={`text-sm ${todo.completed ? "line-through text-zinc-400" : "text-zinc-900 dark:text-white"}`}>{todo.title}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {todo.priority !== "normal" && (
                <span className={`w-2 h-2 rounded-full ${prio.dot}`} title={prio.label} />
              )}
              <button
                onClick={() => deleteTodo(todo.id)}
                className="p-1 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {todo.due_date && (
              <span className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-500 font-medium" : "text-zinc-400"}`}>
                <Calendar size={11} />
                {formatDate(todo.due_date)}
              </span>
            )}
            {todo.client && (
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Users size={11} />
                {todo.client.company || todo.client.name}
              </span>
            )}
            {todo.partner && (
              <span className="flex items-center gap-1 text-xs text-violet-400">
                <Building2 size={11} />
                {todo.partner.name}
              </span>
            )}
            {todo.prospect && (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <Target size={11} />
                {todo.prospect.company}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderTodo(todo: Todo) {
    return <SortableTodoItem key={todo.id} todo={todo} />;
  }

  if (loading) {
    return <div className="text-center py-12 text-zinc-500">Laden...</div>;
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Heute</h1>
          <p className="text-zinc-500 mt-1">
            {todayTodos.length + overdueTodos.length} Aufgaben
            {overdueTodos.length > 0 && ` · ${overdueTodos.length} überfällig`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          <Plus size={18} />
          Aufgabe
        </button>
      </div>

      {/* Quick Add Form */}
      {showForm && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 mb-6">
          <div className="space-y-3">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Was muss erledigt werden?"
              autoFocus
              className="w-full px-3 py-2 bg-transparent text-zinc-900 dark:text-white text-sm border-b border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-400"
              onKeyDown={(e) => e.key === "Enter" && saveTodo()}
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Beschreibung (optional)"
              rows={2}
              className="w-full px-3 py-2 bg-transparent text-zinc-900 dark:text-white text-sm border-b border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-zinc-400 resize-none"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none"
              />
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Todo["priority"] })}
                className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none"
              >
                <option value="low">Tief</option>
                <option value="normal">Normal</option>
                <option value="high">Hoch</option>
                <option value="urgent">Dringend</option>
              </select>
              <select
                value={form.link_type}
                onChange={(e) => setForm({ ...form, link_type: e.target.value as typeof form.link_type, link_id: "" })}
                className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none"
              >
                <option value="">Keine Verknüpfung</option>
                <option value="client">Kunde</option>
                <option value="partner">Partner</option>
                <option value="prospect">Prospect</option>
              </select>
              {form.link_type && (
                <select
                  value={form.link_id}
                  onChange={(e) => setForm({ ...form, link_id: e.target.value })}
                  className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none"
                >
                  <option value="">Wählen...</option>
                  {linkOptions
                    .filter((o) => o.type === form.link_type)
                    .map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                </select>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={saveTodo}
                disabled={saving}
                className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-50"
              >
                {saving ? "Speichern..." : "Hinzufügen"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={[...overdueTodos, ...todayTodos, ...upcomingTodos, ...noDueTodos].map(t => t.id)} strategy={verticalListSortingStrategy}>

          {/* Overdue */}
          {overdueTodos.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowOverdue(!showOverdue)}
                className="flex items-center gap-2 mb-2 text-sm font-medium text-red-600"
              >
                {showOverdue ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <AlertTriangle size={14} />
                Überfällig ({overdueTodos.length})
              </button>
              {showOverdue && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-red-200 dark:border-red-900/30">
                  {overdueTodos.map(renderTodo)}
                </div>
              )}
            </div>
          )}

          {/* Today */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-medium text-zinc-900 dark:text-white">
                {formatDate(today)} · Heute · {formatWeekday(today)}
              </h2>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              {todayTodos.length > 0 ? (
                todayTodos.map(renderTodo)
              ) : (
                <div className="py-8 text-center text-zinc-400 text-sm">
                  Keine Aufgaben für heute
                </div>
              )}
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 border-t border-zinc-100 dark:border-zinc-800 transition-colors"
              >
                <Plus size={14} />
                Aufgabe hinzufügen
              </button>
            </div>
          </div>

          {/* Upcoming (next 7 days) */}
          {upcomingTodos.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-zinc-500 mb-2">Demnächst</h2>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                {upcomingTodos.slice(0, 10).map(renderTodo)}
              </div>
            </div>
          )}

        </SortableContext>
      </DndContext>

      {/* No due date */}
      {noDueTodos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-zinc-500 mb-2">Ohne Datum</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            {noDueTodos.map(renderTodo)}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedTodos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-zinc-400 mb-2">
            Erledigt ({completedTodos.length})
          </h2>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 opacity-60">
            {completedTodos.map(renderTodo)}
          </div>
        </div>
      )}
    </div>
  );
}
