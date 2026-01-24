"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, Client, Offer } from "@/lib/supabase";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

interface InvoiceItem {
  id: string;
  title: string;
  description: string;
  quantity: number;
  unit_price: number;
}

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromOfferId = searchParams.get("from_offer");

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [linkedOfferId, setLinkedOfferId] = useState<string | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: crypto.randomUUID(), title: "", description: "", quantity: 1, unit_price: 0 },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: clientsData } = await supabase
      .from("clients")
      .select("*")
      .order("company");

    setClients(clientsData || []);

    // If coming from an offer, load offer data
    if (fromOfferId) {
      const { data: offer } = await supabase
        .from("offers")
        .select(`*, items:offer_items(*)`)
        .eq("id", fromOfferId)
        .single();

      if (offer) {
        setSelectedClientId(offer.client_id);
        setTitle(offer.title);
        setDescription(offer.description || "");
        setLinkedOfferId(offer.id);

        if (offer.items && offer.items.length > 0) {
          setItems(
            offer.items.map((item: { id: string; title: string; description: string; amount: number }) => ({
              id: crypto.randomUUID(),
              title: item.title,
              description: item.description || "",
              quantity: 1,
              unit_price: item.amount,
            }))
          );
        }
      }
    }

    // Set default due date (30 days from now)
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 30);
    setDueDate(defaultDue.toISOString().split("T")[0]);

    setLoading(false);
  }

  function addItem() {
    setItems([
      ...items,
      { id: crypto.randomUUID(), title: "", description: "", quantity: 1, unit_price: 0 },
    ]);
  }

  function removeItem(id: string) {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  }

  function updateItem(id: string, field: keyof InvoiceItem, value: string | number) {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  function getItemAmount(item: InvoiceItem) {
    return (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
  }

  function getTotalAmount() {
    return items.reduce((sum, item) => sum + getItemAmount(item), 0);
  }

  async function saveInvoice() {
    if (!selectedClientId || !title || items.length === 0) {
      alert("Bitte fülle alle Pflichtfelder aus");
      return;
    }

    setSaving(true);

    // Create invoice as draft
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        client_id: selectedClientId,
        offer_id: linkedOfferId,
        title,
        description,
        status: "draft",
        due_date: dueDate || null,
        total_amount: getTotalAmount(),
        notes,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
      alert("Fehler beim Erstellen der Rechnung");
      setSaving(false);
      return;
    }

    // Create invoice items
    const invoiceItems = items.map((item, index) => ({
      invoice_id: invoice.id,
      title: item.title,
      description: item.description,
      quantity: Number(item.quantity) || 1,
      unit_price: Number(item.unit_price) || 0,
      amount: getItemAmount(item),
      sort_order: index,
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(invoiceItems);

    if (itemsError) {
      console.error("Error creating invoice items:", itemsError);
    }

    setSaving(false);
    router.push("/admin/rechnungen");
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  if (loading) {
    return <div className="text-center py-12 text-zinc-500">Laden...</div>;
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/rechnungen"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft size={16} />
          Zurück
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Neue Rechnung
        </h1>
        {linkedOfferId && (
          <p className="text-sm text-zinc-500 mt-1">
            Basierend auf Offerte
          </p>
        )}
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Kunde *
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
          >
            <option value="">Kunde wählen...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company ? `${client.company} (${client.name})` : client.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Titel / Betreff *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Website Entwicklung"
            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optionale Beschreibung..."
            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white resize-none"
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Fällig am
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
          />
        </div>

        {/* Items */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Positionen
          </label>
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              >
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(item.id, "title", e.target.value)}
                    placeholder="Bezeichnung"
                    className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <textarea
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  placeholder="Beschreibung (optional)"
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white resize-none mb-3"
                />
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-zinc-500 mb-1">Menge</label>
                    <input
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                      min="0"
                      step="0.5"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-zinc-500 mb-1">Einheitspreis</label>
                    <input
                      type="number"
                      value={item.unit_price || ""}
                      onChange={(e) => updateItem(item.id, "unit_price", Number(e.target.value))}
                      min="0"
                      step="0.05"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-zinc-500 mb-1">Betrag</label>
                    <div className="px-3 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium">
                      {formatAmount(getItemAmount(item))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addItem}
            className="mt-3 flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <Plus size={16} />
            Position hinzufügen
          </button>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Bemerkungen
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Zahlungshinweise, Konditionen, etc."
            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white resize-none"
          />
        </div>

        {/* Total */}
        <div className="flex items-center justify-between py-4 border-t border-zinc-200 dark:border-zinc-700">
          <span className="text-lg font-medium text-zinc-900 dark:text-white">Total</span>
          <span className="text-2xl font-bold text-zinc-900 dark:text-white">
            {formatAmount(getTotalAmount())}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={() => saveInvoice()}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-zinc-500">Laden...</div>}>
      <NewInvoiceContent />
    </Suspense>
  );
}
