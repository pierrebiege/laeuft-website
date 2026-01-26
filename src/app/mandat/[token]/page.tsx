"use client";

import { useEffect, useState, use } from "react";
import { supabase, Mandate, MandatePricingPhase, MandateSection, MandateOption, Client } from "@/lib/supabase";
import { Check, Printer, Download } from "lucide-react";

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

  async function handleDownloadPDF() {
    // For now, use print dialog - could add server-side PDF generation later
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
        <div className="text-zinc-600">Laden...</div>
      </div>
    );
  }

  if (error || !mandate) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Mandat nicht gefunden</h1>
          <p className="text-zinc-600">Der Link ist ungültig oder das Mandat existiert nicht mehr.</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-zinc-100 text-zinc-700",
    sent: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    active: "bg-emerald-100 text-emerald-700",
  };

  const statusLabels: Record<string, string> = {
    draft: "Entwurf",
    sent: "Offen",
    accepted: "Angenommen",
    rejected: "Abgelehnt",
    active: "Aktiv",
  };

  return (
    <>
      {/* Global print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-zinc-200 py-6 md:py-8 print:bg-white print:py-0">
        {/* Action buttons - hidden on print */}
        <div className="max-w-3xl lg:max-w-[210mm] mx-auto px-4 md:px-6 mb-4 print:hidden flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            <Download size={16} />
            PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            <Printer size={16} />
            Drucken
          </button>
        </div>

        {/* Page 1 */}
        <div className="mandate-page max-w-3xl lg:max-w-[210mm] mx-auto bg-white shadow-xl mb-6 md:mb-8 print:shadow-none print:mb-0 print:max-w-none">
          <div className="p-6 md:p-10 lg:p-[25mm_28mm] print:p-[20mm_25mm]">
            {/* Header */}
            <header className="flex justify-between items-start mb-10 md:mb-16 print:mb-[20mm]">
              <div className="text-2xl md:text-3xl font-semibold tracking-tight text-black" style={{ fontFamily: "Georgia, serif" }}>
                Läuft.
              </div>
              <div className="text-right text-xs md:text-sm text-zinc-600 print:text-black">
                Pierre Biege<br />
                Tschangaladongastrasse 3<br />
                3955 Albinen<br /><br />
                {getCurrentMonth()}
              </div>
            </header>

            {/* Hero */}
            <div className="mb-10 md:mb-16 print:mb-[18mm]">
              <h1 className="text-3xl md:text-4xl lg:text-[32pt] font-semibold leading-tight mb-4 md:mb-6 text-black print:text-black" style={{ fontFamily: "Georgia, serif", letterSpacing: "-0.5px" }}>
                {mandate.title}
              </h1>
              {mandate.subtitle && (
                <p className="text-base md:text-lg text-zinc-700 max-w-[90%] print:text-black">
                  Für {mandate.client.company || mandate.client.name}. {mandate.introduction}
                </p>
              )}
              {!mandate.subtitle && mandate.introduction && (
                <p className="text-base md:text-lg text-zinc-700 max-w-[90%] print:text-black">{mandate.introduction}</p>
              )}
              <p className="text-xs md:text-sm text-zinc-600 mt-6 pt-4 border-t border-zinc-200 print:text-black print:border-zinc-400">
                <strong className="text-black">Läuft.</strong> arbeitet mit maximal drei Partnern. Keine Agentur, kein Massengeschäft – dafür echte Verfügbarkeit und Fokus.
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
              <div className="mb-10 md:mb-12 print:mb-[12mm]">
                <div className="text-xs uppercase tracking-widest text-zinc-600 mb-4 font-semibold print:text-black">
                  Preismodell
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 mb-8 print:grid-cols-2 print:gap-[8mm]">
                  {mandate.pricing_phases.map((phase) => (
                    <div
                      key={phase.id}
                      className={`pt-4 md:pt-6 border-t-2 ${phase.is_primary ? "border-black" : "border-zinc-300"} print:pt-[6mm]`}
                    >
                      <div className="text-xs uppercase tracking-wide text-zinc-600 mb-2 print:text-black">
                        {phase.label}
                      </div>
                      <div className="text-3xl md:text-4xl font-bold tracking-tight text-black">
                        {formatAmount(phase.amount)}.–
                      </div>
                      {phase.description && (
                        <div className="text-xs md:text-sm text-zinc-600 mt-2 print:text-black">{phase.description}</div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs md:text-sm text-zinc-600 print:text-black">
                  Die Preise stehen in Relation zum effektiven Aufwand. Falls sich der Umfang ändert, passen wir das Angebot gemeinsam an.
                </p>
              </div>
            )}

            {/* Sections */}
            {mandate.sections.map((section, sIndex) => (
              <div key={section.id}>
                {sIndex > 0 && <hr className="border-t border-zinc-200 my-8 md:my-10 print:my-[10mm] print:border-zinc-300" />}
                <div className="mb-8 md:mb-10 print:mb-[12mm]">
                  <div className="text-xs uppercase tracking-widest text-zinc-600 mb-4 font-semibold print:text-black">
                    {section.label}
                  </div>
                  {section.description && (
                    <p className="text-zinc-700 mb-4 print:text-black">{section.description}</p>
                  )}
                  <ul className="list-none">
                    {(section.items || []).map((item) => (
                      <li
                        key={item.id}
                        className="py-2 md:py-3 border-b border-zinc-100 last:border-0 flex justify-between items-center text-black print:border-zinc-200"
                      >
                        <span>{item.title}</span>
                        {item.detail && (
                          <span className="text-xs md:text-sm text-zinc-600 print:text-black">{item.detail}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            {/* Conditions */}
            <div className="mb-8 print:mb-[12mm]">
              <div className="text-xs uppercase tracking-widest text-zinc-600 mb-4 font-semibold print:text-black">
                Konditionen
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mt-6 print:grid-cols-3 print:gap-[6mm]">
                <div className="pt-4 md:pt-5 border-t border-zinc-300 print:pt-[5mm]">
                  <strong className="block text-base md:text-lg font-semibold mb-1 text-black">{mandate.cancellation_period}</strong>
                  <span className="text-xs md:text-sm text-zinc-600 print:text-black">Kündigungsfrist (beidseitig)</span>
                </div>
                <div className="pt-4 md:pt-5 border-t border-zinc-300 print:pt-[5mm]">
                  <strong className="block text-base md:text-lg font-semibold mb-1 text-black">Pause möglich</strong>
                  <span className="text-xs md:text-sm text-zinc-600 print:text-black">{formatAmount(mandate.pause_fee)}.–/Mt Haltegebühr</span>
                </div>
                <div className="pt-4 md:pt-5 border-t border-zinc-300 print:pt-[5mm]">
                  <strong className="block text-base md:text-lg font-semibold mb-1 text-black">Monatlich</strong>
                  <span className="text-xs md:text-sm text-zinc-600 print:text-black">Abrechnung im Voraus</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2 - Selection */}
        <div className="mandate-page max-w-3xl lg:max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:max-w-none">
          <div className="p-6 md:p-10 lg:p-[25mm_28mm] print:p-[20mm_25mm]">
            {/* Header */}
            <header className="flex justify-between items-start mb-10 md:mb-16 print:mb-[20mm]">
              <div className="text-2xl md:text-3xl font-semibold tracking-tight text-black" style={{ fontFamily: "Georgia, serif" }}>
                Läuft.
              </div>
              <div className="text-right text-xs md:text-sm text-zinc-600 print:text-black">
                {mandate.title}<br />
                Seite 2
              </div>
            </header>

            {/* Options Section */}
            <div className="mb-8 md:mb-10 print:mb-[12mm]">
              <div className="text-xs uppercase tracking-widest text-zinc-600 mb-4 font-semibold print:text-black">
                Auswahl
              </div>
              <div className="mt-5 space-y-0">
                {mandate.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-start gap-3 md:gap-4 py-4 border-b border-zinc-100 cursor-pointer transition-colors print:border-zinc-200 ${
                      accepted ? "pointer-events-none" : "hover:bg-zinc-50"
                    } ${selectedOption === option.id ? "bg-zinc-50 print:bg-zinc-100" : ""}`}
                  >
                    <div className="relative mt-0.5 flex-shrink-0">
                      <input
                        type="radio"
                        name="mandate-option"
                        value={option.id}
                        checked={selectedOption === option.id}
                        onChange={() => setSelectedOption(option.id)}
                        disabled={accepted}
                        className="w-5 h-5 appearance-none border-2 border-zinc-400 rounded-sm checked:border-black checked:bg-black cursor-pointer disabled:cursor-default print:border-black"
                      />
                      {selectedOption === option.id && (
                        <Check
                          size={14}
                          className="absolute top-0.5 left-0.5 text-white pointer-events-none"
                        />
                      )}
                    </div>
                    <div>
                      <strong className="block text-black">{option.title}</strong>
                      {option.description && (
                        <span className="text-sm text-zinc-600 print:text-black">{option.description}</span>
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
              <div className="mt-8 p-4 md:p-6 bg-green-50 rounded-lg print:bg-white print:border-2 print:border-green-600">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center print:bg-green-600">
                    <Check className="text-green-600 print:text-white" size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-green-800 print:text-black">Auswahl bestätigt</div>
                    <div className="text-sm text-green-700 print:text-black">
                      {mandate.accepted_at && `Am ${new Date(mandate.accepted_at).toLocaleDateString("de-CH")}`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Signature Area (for print) */}
            <div className="mt-16 md:mt-20 grid grid-cols-2 gap-10 md:gap-20 print:mt-[20mm] print:gap-[20mm]">
              <div className="pt-12 md:pt-16 border-t border-black text-xs md:text-sm text-zinc-600 print:pt-[15mm] print:text-black">
                Ort, Datum
              </div>
              <div className="pt-12 md:pt-16 border-t border-black text-xs md:text-sm text-zinc-600 print:pt-[15mm] print:text-black">
                {mandate.client.company || mandate.client.name}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .mandate-page {
            width: 210mm;
            min-height: 297mm;
            page-break-after: always;
            box-shadow: none !important;
          }
          .mandate-page:last-child {
            page-break-after: avoid;
          }
        }
      `}</style>
    </>
  );
}
