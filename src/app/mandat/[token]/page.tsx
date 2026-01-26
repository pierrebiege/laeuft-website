"use client";

import { useEffect, useState, use } from "react";
import { supabase, Mandate, MandatePricingPhase, MandateSection, MandateOption, Client } from "@/lib/supabase";
import { Check, Printer } from "lucide-react";

type MandateWithDetails = Mandate & {
  client: Client;
  pricing_phases: MandatePricingPhase[];
  sections: (MandateSection & { items: { id: string; title: string; detail: string | null }[] })[];
  options: MandateOption[];
};

export default function MandatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [mandate, setMandate] = useState<MandateWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    loadMandate();
  }, [token]);

  async function loadMandate() {
    // Load mandate with all related data
    const { data: mandateData, error: mandateError } = await supabase
      .from("mandates")
      .select(`
        *,
        client:clients(*),
        pricing_phases:mandate_pricing_phases(*),
        sections:mandate_sections(*, items:mandate_section_items(*)),
        options:mandate_options(*)
      `)
      .eq("unique_token", token)
      .single();

    if (mandateError || !mandateData) {
      setError("Mandat nicht gefunden");
      setLoading(false);
      return;
    }

    // Sort data
    mandateData.pricing_phases = mandateData.pricing_phases?.sort((a: MandatePricingPhase, b: MandatePricingPhase) => a.sort_order - b.sort_order) || [];
    mandateData.sections = mandateData.sections?.sort((a: MandateSection, b: MandateSection) => a.sort_order - b.sort_order) || [];
    mandateData.sections.forEach((section: MandateSection & { items: { sort_order: number }[] }) => {
      section.items = section.items?.sort((a, b) => a.sort_order - b.sort_order) || [];
    });
    mandateData.options = mandateData.options?.sort((a: MandateOption, b: MandateOption) => a.sort_order - b.sort_order) || [];

    setMandate(mandateData);
    if (mandateData.accepted_option_id) {
      setSelectedOption(mandateData.accepted_option_id);
      setAccepted(true);
    }
    setLoading(false);
  }

  async function handleAccept() {
    if (!selectedOption || !mandate) return;

    setAccepting(true);

    const { error } = await supabase
      .from("mandates")
      .update({
        accepted_option_id: selectedOption,
        accepted_at: new Date().toISOString(),
        status: mandate.options.find(o => o.id === selectedOption)?.is_rejection ? "rejected" : "accepted",
      })
      .eq("id", mandate.id);

    if (error) {
      alert("Fehler beim Speichern der Auswahl");
    } else {
      setAccepted(true);
      loadMandate();
    }

    setAccepting(false);
  }

  function handlePrint() {
    window.print();
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("de-CH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function getCurrentMonth() {
    return new Date().toLocaleDateString("de-CH", { month: "long", year: "numeric" });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-zinc-500">Laden...</div>
      </div>
    );
  }

  if (error || !mandate) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Mandat nicht gefunden</h1>
          <p className="text-zinc-500">Der Link ist ungültig oder das Mandat existiert nicht mehr.</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-zinc-100 text-zinc-600",
    sent: "bg-blue-50 text-blue-600",
    accepted: "bg-green-50 text-green-600",
    rejected: "bg-red-50 text-red-600",
    active: "bg-emerald-50 text-emerald-600",
  };

  const statusLabels: Record<string, string> = {
    draft: "Entwurf",
    sent: "Offen",
    accepted: "Angenommen",
    rejected: "Abgelehnt",
    active: "Aktiv",
  };

  return (
    <div className="min-h-screen bg-[#e0e0e0] py-8 print:bg-white print:py-0">
      {/* Action buttons - hidden on print */}
      <div className="max-w-[210mm] mx-auto px-4 mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
        >
          <Printer size={16} />
          Drucken
        </button>
      </div>

      {/* Page 1 */}
      <div className="page max-w-[210mm] mx-auto bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] mb-8 print:shadow-none print:mb-0">
        <div className="p-[25mm_28mm] print:p-[25mm_28mm]">
          {/* Header */}
          <header className="flex justify-between items-start mb-[20mm]">
            <div className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
              Läuft.
            </div>
            <div className="text-right text-[9pt] text-zinc-500">
              Pierre Biege<br />
              Tschangaladongastrasse 3<br />
              3955 Albinen<br /><br />
              {getCurrentMonth()}
            </div>
          </header>

          {/* Hero */}
          <div className="mb-[18mm]">
            <h1 className="text-[32pt] font-semibold leading-tight mb-[6mm]" style={{ fontFamily: "Georgia, serif", letterSpacing: "-1px" }}>
              {mandate.title.split(" ").slice(0, -1).join(" ")}<br />
              {mandate.title.split(" ").slice(-1)}
            </h1>
            {mandate.subtitle && (
              <p className="text-[12pt] text-zinc-500 max-w-[80%]">
                Für {mandate.client.company || mandate.client.name}. {mandate.introduction}
              </p>
            )}
            {!mandate.subtitle && mandate.introduction && (
              <p className="text-[12pt] text-zinc-500 max-w-[80%]">{mandate.introduction}</p>
            )}
            <p className="text-[9pt] text-zinc-500 mt-[6mm] pt-[4mm] border-t border-zinc-100">
              <strong>Läuft.</strong> arbeitet mit maximal drei Partnern. Keine Agentur, kein Massengeschäft – dafür echte Verfügbarkeit und Fokus.
            </p>
          </div>

          {/* Status Badge (if accepted/rejected) */}
          {(mandate.status === "accepted" || mandate.status === "rejected") && (
            <div className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium mb-6 ${statusColors[mandate.status]}`}>
              {statusLabels[mandate.status]}
            </div>
          )}

          {/* Pricing */}
          {mandate.pricing_phases.length > 0 && (
            <div className="mb-[12mm]">
              <div className="text-[9pt] uppercase tracking-[1.5px] text-zinc-500 mb-[4mm] font-medium">
                Preismodell
              </div>
              <div className="grid grid-cols-2 gap-[8mm] mt-[6mm] mb-[12mm]">
                {mandate.pricing_phases.map((phase, index) => (
                  <div
                    key={phase.id}
                    className={`pt-[6mm] border-t-2 ${phase.is_primary ? "border-black" : "border-zinc-300"}`}
                  >
                    <div className="text-[9pt] uppercase tracking-[1px] text-zinc-500 mb-[2mm]">
                      {phase.label}
                    </div>
                    <div className="text-[28pt] font-bold tracking-tight">
                      {formatAmount(phase.amount)}.–
                    </div>
                    {phase.description && (
                      <div className="text-[9pt] text-zinc-500 mt-[2mm]">{phase.description}</div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[9pt] text-zinc-500 -mt-[6mm]">
                Die Preise stehen in Relation zum effektiven Aufwand. Falls sich der Umfang ändert, passen wir das Angebot gemeinsam an.
              </p>
            </div>
          )}

          {/* Sections */}
          {mandate.sections.map((section, sIndex) => (
            <div key={section.id}>
              {sIndex > 0 && <hr className="border-t border-zinc-100 my-[10mm]" />}
              <div className="mb-[12mm]">
                <div className="text-[9pt] uppercase tracking-[1.5px] text-zinc-500 mb-[4mm] font-medium">
                  {section.label}
                </div>
                {section.description && (
                  <p className="text-zinc-500 mb-[3mm]">{section.description}</p>
                )}
                <ul className="list-none">
                  {(section.items || []).map((item) => (
                    <li
                      key={item.id}
                      className="py-[2mm] border-b border-zinc-100 last:border-0 flex justify-between items-center"
                    >
                      <span>{item.title}</span>
                      {item.detail && (
                        <span className="text-[9pt] text-zinc-500">{item.detail}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {/* Conditions */}
          <div className="mb-[12mm]">
            <div className="text-[9pt] uppercase tracking-[1.5px] text-zinc-500 mb-[4mm] font-medium">
              Konditionen
            </div>
            <div className="grid grid-cols-3 gap-[6mm] mt-[6mm]">
              <div className="pt-[5mm] border-t border-zinc-300">
                <strong className="block text-[13pt] font-semibold mb-[1mm]">{mandate.cancellation_period}</strong>
                <span className="text-[9pt] text-zinc-500">Kündigungsfrist (beidseitig)</span>
              </div>
              <div className="pt-[5mm] border-t border-zinc-300">
                <strong className="block text-[13pt] font-semibold mb-[1mm]">Pause möglich</strong>
                <span className="text-[9pt] text-zinc-500">{formatAmount(mandate.pause_fee)}.–/Mt Haltegebühr</span>
              </div>
              <div className="pt-[5mm] border-t border-zinc-300">
                <strong className="block text-[13pt] font-semibold mb-[1mm]">Monatlich</strong>
                <span className="text-[9pt] text-zinc-500">Abrechnung im Voraus</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page 2 - Selection */}
      <div className="page max-w-[210mm] mx-auto bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] print:shadow-none">
        <div className="p-[25mm_28mm] print:p-[25mm_28mm]">
          {/* Header */}
          <header className="flex justify-between items-start mb-[20mm]">
            <div className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
              Läuft.
            </div>
            <div className="text-right text-[9pt] text-zinc-500">
              {mandate.title}<br />
              Seite 2
            </div>
          </header>

          {/* Options Section */}
          <div className="mb-[12mm]">
            <div className="text-[9pt] uppercase tracking-[1.5px] text-zinc-500 mb-[4mm] font-medium">
              Auswahl
            </div>
            <div className="mt-[5mm] space-y-0">
              {mandate.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start gap-[3mm] py-[4mm] border-b border-zinc-100 cursor-pointer transition-colors ${
                    accepted ? "pointer-events-none" : "hover:bg-zinc-50"
                  } ${selectedOption === option.id ? "bg-zinc-50" : ""}`}
                >
                  <div className="relative mt-1">
                    <input
                      type="radio"
                      name="mandate-option"
                      value={option.id}
                      checked={selectedOption === option.id}
                      onChange={() => setSelectedOption(option.id)}
                      disabled={accepted}
                      className="w-5 h-5 appearance-none border-2 border-zinc-300 rounded-sm checked:border-black checked:bg-black cursor-pointer disabled:cursor-default"
                    />
                    {selectedOption === option.id && (
                      <Check
                        size={14}
                        className="absolute top-0.5 left-0.5 text-white pointer-events-none"
                      />
                    )}
                  </div>
                  <div>
                    <strong className="block">{option.title}</strong>
                    {option.description && (
                      <span className="text-[9pt] text-zinc-500">{option.description}</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Accept Button (not shown on print) */}
          {!accepted && selectedOption && (
            <div className="print:hidden mt-8">
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full py-4 bg-black text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {accepting ? "Wird gespeichert..." : "Auswahl bestätigen"}
              </button>
            </div>
          )}

          {/* Accepted Confirmation */}
          {accepted && (
            <div className="mt-8 p-6 bg-green-50 rounded-lg print:bg-transparent print:border print:border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center print:bg-green-50">
                  <Check className="text-green-600" size={18} />
                </div>
                <div>
                  <div className="font-semibold text-green-800">Auswahl bestätigt</div>
                  <div className="text-sm text-green-600">
                    {mandate.accepted_at && `Am ${new Date(mandate.accepted_at).toLocaleDateString("de-CH")}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Signature Area (for print) */}
          <div className="mt-[20mm] grid grid-cols-2 gap-[20mm]">
            <div className="pt-[15mm] border-t border-black text-[9pt] text-zinc-500">
              Ort, Datum
            </div>
            <div className="pt-[15mm] border-t border-black text-[9pt] text-zinc-500">
              {mandate.client.company || mandate.client.name}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .page {
            width: 210mm;
            min-height: 297mm;
            page-break-after: always;
          }
          .page:last-child {
            page-break-after: avoid;
          }
        }
      `}</style>
    </div>
  );
}
