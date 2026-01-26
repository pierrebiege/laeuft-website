"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, Client } from "@/lib/supabase";
import { Plus, X, Save, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";

interface PricingPhase {
  id?: string;
  label: string;
  amount: number;
  description: string;
  is_primary: boolean;
}

interface SectionItem {
  id?: string;
  title: string;
  detail: string;
}

interface Section {
  id?: string;
  label: string;
  description: string;
  items: SectionItem[];
  collapsed?: boolean;
}

interface MandateOption {
  id?: string;
  title: string;
  description: string;
  monthly_amount: number | null;
  is_rejection: boolean;
}

export default function NewMandatePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("Mandat-Offerte IT-Betreuung");
  const [subtitle, setSubtitle] = useState("");
  const [introduction, setIntroduction] = useState("Ein Vorschlag, wie wir die IT-Betreuung weiterführen können – fair, flexibel, und ohne dass Wissen verloren geht.");
  const [validUntil, setValidUntil] = useState("");
  const [cancellationPeriod, setCancellationPeriod] = useState("3 Monate");
  const [pauseFee, setPauseFee] = useState(1000);

  // Pricing phases
  const [pricingPhases, setPricingPhases] = useState<PricingPhase[]>([
    { label: "Februar – April 2026", amount: 4500, description: "Projekte abschliessen + laufende Betreuung", is_primary: true },
    { label: "Ab Mai 2026", amount: 3500, description: "Wartung, Support & Weiterentwicklung", is_primary: false },
  ]);

  // Sections
  const [sections, setSections] = useState<Section[]>([
    {
      label: "Projekte bis Ende April",
      description: "Diese Projekte werden in den ersten 3 Monaten abgeschlossen:",
      items: [
        { title: "Webseiten-Fertigstellung", detail: "inkl." },
        { title: "Abomodell Implementation", detail: "inkl." },
      ],
    },
    {
      label: "Was drin ist",
      description: "Alles, was auf Bestehendem aufbaut:",
      items: [
        { title: "Systeme am Laufen halten", detail: "Bugs, Updates, Troubleshooting" },
        { title: "Bestehende Seiten pflegen & optimieren", detail: "inkl." },
        { title: "Kleine Anpassungen & neue Features", detail: "inkl." },
      ],
    },
    {
      label: "Wie es läuft",
      description: "",
      items: [
        { title: "Reaktionszeit normal", detail: "48h" },
        { title: "Reaktionszeit Notfall", detail: "24h" },
        { title: "Telefonisch erreichbar", detail: "jederzeit" },
      ],
    },
  ]);

  // Options
  const [options, setOptions] = useState<MandateOption[]>([
    { title: "Mandat ab Februar 2026", description: "Nahtloser Übergang. Feb–Apr: 4'500.–/Mt, ab Mai: 3'500.–/Mt", monthly_amount: 4500, is_rejection: false },
    { title: "Mandat ab Mai 2026", description: "Nach Kündigungsfrist. 3'500.–/Mt", monthly_amount: 3500, is_rejection: false },
    { title: "Kein Mandat", description: "Sucht intern/extern. Ich unterstütze die Übergabe.", monthly_amount: null, is_rejection: true },
  ]);

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("company");
    setClients(data || []);
    setLoading(false);
  }

  // Pricing phase handlers
  function addPricingPhase() {
    setPricingPhases([...pricingPhases, { label: "", amount: 0, description: "", is_primary: false }]);
  }

  function updatePricingPhase(index: number, field: keyof PricingPhase, value: string | number | boolean) {
    const updated = [...pricingPhases];
    updated[index] = { ...updated[index], [field]: value };
    setPricingPhases(updated);
  }

  function removePricingPhase(index: number) {
    setPricingPhases(pricingPhases.filter((_, i) => i !== index));
  }

  // Section handlers
  function addSection() {
    setSections([...sections, { label: "", description: "", items: [], collapsed: false }]);
  }

  function updateSection(index: number, field: keyof Section, value: string | boolean) {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  }

  function removeSection(index: number) {
    setSections(sections.filter((_, i) => i !== index));
  }

  function toggleSectionCollapse(index: number) {
    const updated = [...sections];
    updated[index].collapsed = !updated[index].collapsed;
    setSections(updated);
  }

  function addSectionItem(sectionIndex: number) {
    const updated = [...sections];
    updated[sectionIndex].items.push({ title: "", detail: "" });
    setSections(updated);
  }

  function updateSectionItem(sectionIndex: number, itemIndex: number, field: keyof SectionItem, value: string) {
    const updated = [...sections];
    updated[sectionIndex].items[itemIndex] = { ...updated[sectionIndex].items[itemIndex], [field]: value };
    setSections(updated);
  }

  function removeSectionItem(sectionIndex: number, itemIndex: number) {
    const updated = [...sections];
    updated[sectionIndex].items = updated[sectionIndex].items.filter((_, i) => i !== itemIndex);
    setSections(updated);
  }

  // Option handlers
  function addOption() {
    setOptions([...options, { title: "", description: "", monthly_amount: null, is_rejection: false }]);
  }

  function updateOption(index: number, field: keyof MandateOption, value: string | number | boolean | null) {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    setOptions(updated);
  }

  function removeOption(index: number) {
    setOptions(options.filter((_, i) => i !== index));
  }

  async function saveMandate(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !title) {
      alert("Bitte Kunde und Titel ausfüllen");
      return;
    }

    setSaving(true);

    try {
      // Create mandate
      const { data: mandate, error: mandateError } = await supabase
        .from("mandates")
        .insert({
          client_id: clientId,
          title,
          subtitle: subtitle || null,
          introduction: introduction || null,
          valid_until: validUntil || null,
          cancellation_period: cancellationPeriod,
          pause_fee: pauseFee,
          status: "draft",
        })
        .select()
        .single();

      if (mandateError || !mandate) {
        throw new Error("Fehler beim Erstellen des Mandats");
      }

      // Insert pricing phases
      if (pricingPhases.length > 0) {
        const phases = pricingPhases.map((p, i) => ({
          mandate_id: mandate.id,
          label: p.label,
          amount: p.amount,
          description: p.description || null,
          is_primary: p.is_primary,
          sort_order: i,
        }));
        await supabase.from("mandate_pricing_phases").insert(phases);
      }

      // Insert sections and items
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const { data: sectionData, error: sectionError } = await supabase
          .from("mandate_sections")
          .insert({
            mandate_id: mandate.id,
            label: section.label,
            description: section.description || null,
            section_type: "list",
            page_number: 1,
            sort_order: i,
          })
          .select()
          .single();

        if (sectionError || !sectionData) continue;

        if (section.items.length > 0) {
          const items = section.items.map((item, j) => ({
            section_id: sectionData.id,
            title: item.title,
            detail: item.detail || null,
            sort_order: j,
          }));
          await supabase.from("mandate_section_items").insert(items);
        }
      }

      // Insert options
      if (options.length > 0) {
        const opts = options.map((o, i) => ({
          mandate_id: mandate.id,
          title: o.title,
          description: o.description || null,
          monthly_amount: o.monthly_amount,
          is_rejection: o.is_rejection,
          sort_order: i,
        }));
        await supabase.from("mandate_options").insert(opts);
      }

      router.push("/admin/mandate");
    } catch (error) {
      console.error("Error saving mandate:", error);
      alert("Fehler beim Speichern");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-zinc-500">Laden...</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Neues Mandat</h1>
          <p className="text-zinc-500 mt-1">Partner-Offerte mit monatlicher Abrechnung erstellen</p>
        </div>
      </div>

      <form onSubmit={saveMandate} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Grunddaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Kunde *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              >
                <option value="">Kunde auswählen...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company || client.name} {client.company ? `(${client.name})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Titel *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Für [Firma]. Ein Vorschlag..."
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Einleitung
              </label>
              <textarea
                value={introduction}
                onChange={(e) => setIntroduction(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
          </div>
        </div>

        {/* Pricing Phases */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Preismodell</h2>
            <button
              type="button"
              onClick={addPricingPhase}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1"
            >
              <Plus size={14} />
              Phase hinzufügen
            </button>
          </div>
          <div className="space-y-4">
            {pricingPhases.map((phase, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={phase.label}
                    onChange={(e) => updatePricingPhase(index, "label", e.target.value)}
                    placeholder="Februar – April 2026"
                    className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    value={phase.amount}
                    onChange={(e) => updatePricingPhase(index, "amount", parseFloat(e.target.value) || 0)}
                    placeholder="4500"
                    className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    value={phase.description}
                    onChange={(e) => updatePricingPhase(index, "description", e.target.value)}
                    placeholder="Beschreibung"
                    className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm md:col-span-2"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={phase.is_primary}
                    onChange={(e) => updatePricingPhase(index, "is_primary", e.target.checked)}
                    className="rounded"
                  />
                  Primär
                </label>
                <button
                  type="button"
                  onClick={() => removePricingPhase(index)}
                  className="p-1 text-zinc-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Sektionen</h2>
            <button
              type="button"
              onClick={addSection}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1"
            >
              <Plus size={14} />
              Sektion hinzufügen
            </button>
          </div>
          <div className="space-y-4">
            {sections.map((section, sIndex) => (
              <div key={sIndex} className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800 cursor-pointer"
                  onClick={() => toggleSectionCollapse(sIndex)}
                >
                  <div className="flex items-center gap-3">
                    {section.collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    <input
                      type="text"
                      value={section.label}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateSection(sIndex, "label", e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Sektion Label"
                      className="px-2 py-1 bg-transparent border-0 font-medium focus:outline-none focus:ring-1 focus:ring-zinc-400 rounded"
                    />
                    <span className="text-xs text-zinc-500">({section.items.length} Items)</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSection(sIndex);
                    }}
                    className="p-1 text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {!section.collapsed && (
                  <div className="p-4 space-y-3">
                    <input
                      type="text"
                      value={section.description}
                      onChange={(e) => updateSection(sIndex, "description", e.target.value)}
                      placeholder="Beschreibung (optional)"
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                    />

                    {section.items.map((item, iIndex) => (
                      <div key={iIndex} className="flex items-center gap-2">
                        <GripVertical size={14} className="text-zinc-400" />
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateSectionItem(sIndex, iIndex, "title", e.target.value)}
                          placeholder="Item Titel"
                          className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                        />
                        <input
                          type="text"
                          value={item.detail}
                          onChange={(e) => updateSectionItem(sIndex, iIndex, "detail", e.target.value)}
                          placeholder="Detail (inkl., 48h, etc.)"
                          className="w-40 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeSectionItem(sIndex, iIndex)}
                          className="p-1 text-zinc-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addSectionItem(sIndex)}
                      className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Item hinzufügen
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Auswahloptionen</h2>
            <button
              type="button"
              onClick={addOption}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1"
            >
              <Plus size={14} />
              Option hinzufügen
            </button>
          </div>
          <div className="space-y-4">
            {options.map((option, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={option.title}
                      onChange={(e) => updateOption(index, "title", e.target.value)}
                      placeholder="Mandat ab Februar 2026"
                      className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      value={option.monthly_amount || ""}
                      onChange={(e) => updateOption(index, "monthly_amount", e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="Monatsbetrag (leer für Ablehnung)"
                      className="px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                    />
                    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <input
                        type="checkbox"
                        checked={option.is_rejection}
                        onChange={(e) => updateOption(index, "is_rejection", e.target.checked)}
                        className="rounded"
                      />
                      Ablehnung (kein Mandat)
                    </label>
                  </div>
                  <input
                    type="text"
                    value={option.description}
                    onChange={(e) => updateOption(index, "description", e.target.value)}
                    placeholder="Beschreibung"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="p-1 text-zinc-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Konditionen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Kündigungsfrist
              </label>
              <input
                type="text"
                value={cancellationPeriod}
                onChange={(e) => setCancellationPeriod(e.target.value)}
                placeholder="3 Monate"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Haltegebühr (Pause)
              </label>
              <input
                type="number"
                value={pauseFee}
                onChange={(e) => setPauseFee(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Gültig bis
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push("/admin/mandate")}
            className="px-6 py-2 text-zinc-600 hover:text-zinc-900 font-medium"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Speichern..." : "Mandat speichern"}
          </button>
        </div>
      </form>
    </div>
  );
}
