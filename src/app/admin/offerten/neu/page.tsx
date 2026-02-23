"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase, Client, Service } from "@/lib/supabase";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

interface OfferItem {
  id: string;
  title: string;
  description: string;
  amount: number;
}

function NewOfferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClient = searchParams.get("client");
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState(preselectedClient || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<OfferItem[]>([
    { id: crypto.randomUUID(), title: "", description: "", amount: 0 },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [clientsRes, servicesRes] = await Promise.all([
      supabase.from("clients").select("*").order("company"),
      supabase.from("services").select("*").order("name"),
    ]);

    setClients(clientsRes.data || []);
    setServices(servicesRes.data || []);
    setLoading(false);
  }

  function addItem() {
    setItems([
      ...items,
      { id: crypto.randomUUID(), title: "", description: "", amount: 0 },
    ]);
  }

  function removeItem(id: string) {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  }

  function updateItem(id: string, field: keyof OfferItem, value: string | number) {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  function applyService(service: Service) {
    setTitle(service.name);
    setDescription(service.description || "");

    const features = service.features as string[] || [];
    setItems([
      {
        id: crypto.randomUUID(),
        title: service.name,
        description: features.join("\n"),
        amount: Number(service.default_amount),
      },
    ]);
  }

  function getTotalAmount() {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }

  async function saveOffer() {
    if (!selectedClientId || !title || items.length === 0) {
      alert("Bitte fülle alle Pflichtfelder aus");
      return;
    }

    setSaving(true);

    // Create offer as draft
    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .insert({
        client_id: selectedClientId,
        title,
        description,
        status: "draft",
        valid_until: validUntil || null,
        total_amount: getTotalAmount(),
      })
      .select()
      .single();

    if (offerError) {
      console.error("Error creating offer:", offerError);
      alert("Fehler beim Erstellen der Offerte");
      setSaving(false);
      return;
    }

    // Create offer items
    const offerItems = items.map((item, index) => ({
      offer_id: offer.id,
      title: item.title,
      description: item.description,
      amount: Number(item.amount) || 0,
      sort_order: index,
    }));

    const { error: itemsError } = await supabase
      .from("offer_items")
      .insert(offerItems);

    if (itemsError) {
      console.error("Error creating offer items:", itemsError);
    }

    setSaving(false);
    router.push("/admin");
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
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
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft size={16} />
          Zurück
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Neue Offerte
        </h1>
      </div>

      {/* Quick Templates */}
      {services.length > 0 && (
        <div className="mb-8">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Vorlage verwenden
          </label>
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => applyService(service)}
                className="px-4 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
              >
                {service.name} – {formatAmount(Number(service.default_amount))}
              </button>
            ))}
          </div>
        </div>
      )}

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
            Titel *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. IT-Betreuung Partner"
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
            rows={3}
            placeholder="Einleitungstext für die Offerte..."
            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white resize-none"
          />
        </div>

        {/* Valid Until */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Gültig bis
          </label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
          />
        </div>

        {/* Items */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Positionen
          </label>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(item.id, "title", e.target.value)}
                    placeholder="Positionstitel"
                    className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
                  />
                  <input
                    type="number"
                    value={item.amount || ""}
                    onChange={(e) => updateItem(item.id, "amount", Number(e.target.value))}
                    placeholder="Betrag"
                    className="w-32 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
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
                  placeholder="Beschreibung / Features (eine pro Zeile)"
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white resize-none"
                />
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
            onClick={() => saveOffer()}
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

export default function NewOfferPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-zinc-500">Laden...</div>}>
      <NewOfferContent />
    </Suspense>
  );
}
