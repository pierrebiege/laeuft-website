"use client";

import { useEffect, useState, use } from "react";
import { supabase, Mandate, MandatePricingPhase, MandateSection, MandateOption, Client, Invoice, MandateInvoice, MandateSystem } from "@/lib/supabase";
import { Check, Printer, Download, XCircle, AlertTriangle, PlayCircle, FileText, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

type MandateWithDetails = Mandate & {
  client: Client;
  pricing_phases: MandatePricingPhase[];
  sections: (MandateSection & { items: { id: string; title: string; detail: string | null }[] })[];
  options: MandateOption[];
  mandate_invoices?: (MandateInvoice & { invoice: Invoice })[];
  systems?: MandateSystem[];
};

export default function MandatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [mandate, setMandate] = useState<MandateWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
        options:mandate_options(*),
        mandate_invoices(*, invoice:invoices(*)),
        systems:mandate_systems(*)
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
    mandateData.systems = mandateData.systems?.sort((a: MandateSystem, b: MandateSystem) => a.sort_order - b.sort_order) || [];

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
        start_date: new Date().toISOString().split('T')[0],
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

  async function handleCancel() {
    if (!mandate) return;

    setActionLoading(true);

    // Calculate effective date based on cancellation period
    const monthsMatch = mandate.cancellation_period.match(/(\d+)/);
    const months = monthsMatch ? parseInt(monthsMatch[1]) : 3;
    const effectiveDate = new Date();
    effectiveDate.setMonth(effectiveDate.getMonth() + months);

    const { error } = await supabase
      .from("mandates")
      .update({
        status: "cancelling",
        cancelled_at: new Date().toISOString(),
        cancellation_effective_date: effectiveDate.toISOString().split('T')[0],
      })
      .eq("id", mandate.id);

    if (error) {
      alert("Fehler beim Kündigen");
    } else {
      setShowCancelDialog(false);
      loadMandate();
    }

    setActionLoading(false);
  }

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPDF() {
    window.print();
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("de-CH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  // Check if mandate is in an actionable state
  const isActive = mandate?.status === "active" || mandate?.status === "accepted";
  const isCancelling = mandate?.status === "cancelling";

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
    paused: "bg-amber-100 text-amber-700",
    cancelling: "bg-orange-100 text-orange-700",
    cancelled: "bg-zinc-100 text-zinc-700",
    ended: "bg-zinc-100 text-zinc-700",
  };

  const statusLabels: Record<string, string> = {
    draft: "Entwurf",
    sent: "Offen",
    accepted: "Angenommen",
    rejected: "Abgelehnt",
    active: "Aktiv",
    paused: "Pausiert",
    cancelling: "Gekündigt",
    cancelled: "Beendet",
    ended: "Beendet",
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

        {/* Status Banner for Active Mandates */}
        {(isActive || isCancelling) && (
          <div className="max-w-3xl lg:max-w-[210mm] mx-auto px-4 md:px-6 mb-4 print:hidden">
            <div className={`rounded-xl p-4 md:p-6 ${
              isCancelling ? "bg-orange-50 border border-orange-200" : "bg-emerald-50 border border-emerald-200"
            }`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isCancelling ? (
                      <AlertTriangle className="text-orange-600" size={20} />
                    ) : (
                      <PlayCircle className="text-emerald-600" size={20} />
                    )}
                    <span className={`font-semibold ${
                      isCancelling ? "text-orange-800" : "text-emerald-800"
                    }`}>
                      {isCancelling ? "Kündigung eingereicht" : "Mandat aktiv"}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    isCancelling ? "text-orange-700" : "text-emerald-700"
                  }`}>
                    {isCancelling && mandate.cancellation_effective_date && (
                      <>Letzter Tag der Zusammenarbeit: {formatDate(mandate.cancellation_effective_date)}</>
                    )}
                    {isActive && mandate.start_date && (
                      <>Aktiv seit {formatDate(mandate.start_date)}</>
                    )}
                    {isActive && !mandate.start_date && mandate.accepted_at && (
                      <>Aktiv seit {formatDate(mandate.accepted_at)}</>
                    )}
                  </p>
                </div>

                {isActive && (
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    <XCircle size={16} />
                    Kündigen
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Invoices Section */}
        {mandate.mandate_invoices && mandate.mandate_invoices.length > 0 && (
          <div className="max-w-3xl lg:max-w-[210mm] mx-auto px-4 md:px-6 mb-4 print:hidden">
            <div className="bg-white rounded-xl border border-zinc-200 p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-zinc-600" size={20} />
                <h3 className="font-semibold text-zinc-900">Rechnungen</h3>
              </div>
              <div className="space-y-2">
                {mandate.mandate_invoices
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((mi) => (
                    <a
                      key={mi.id}
                      href={`/rechnung/${mi.invoice?.unique_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-zinc-900">
                          {mi.invoice?.invoice_number}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {new Date(mi.period_start).toLocaleDateString("de-CH", { month: "long", year: "numeric" })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-medium text-zinc-900">
                            CHF {formatAmount(mi.amount)}.–
                          </div>
                          <div className={`text-xs font-medium ${
                            mi.invoice?.status === "paid" ? "text-green-600" :
                            mi.invoice?.status === "overdue" ? "text-red-600" :
                            mi.invoice?.status === "sent" ? "text-blue-600" :
                            "text-zinc-500"
                          }`}>
                            {mi.invoice?.status === "paid" ? "Bezahlt" :
                             mi.invoice?.status === "overdue" ? "Überfällig" :
                             mi.invoice?.status === "sent" ? "Offen" :
                             mi.invoice?.status === "draft" ? "Entwurf" : ""}
                          </div>
                        </div>
                        <ExternalLink size={16} className="text-zinc-400" />
                      </div>
                    </a>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Cancel Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="text-red-600" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900">Mandat kündigen</h3>
              </div>
              <p className="text-zinc-600 mb-4">
                Möchtest du das Mandat wirklich kündigen? Die Kündigungsfrist beträgt <strong>{mandate.cancellation_period}</strong>.
              </p>
              <p className="text-sm text-zinc-500 mb-6">
                Das Mandat läuft bis zum Ende der Kündigungsfrist weiter. Offene Arbeiten werden abgeschlossen.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1 px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg font-medium hover:bg-zinc-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "Wird gekündigt..." : "Kündigung bestätigen"}
                </button>
              </div>
            </div>
          </div>
        )}

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
                        {formatAmount(phase.amount)}.–<span className="text-lg font-normal text-zinc-500">/Mt</span>
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

            {/* Systems */}
            {mandate.systems && mandate.systems.length > 0 && (
              <>
                <hr className="border-t border-zinc-200 my-8 md:my-10 print:my-[10mm] print:border-zinc-300" />
                <div className="mb-8 md:mb-10 print:mb-[12mm]">
                  <div className="text-xs uppercase tracking-widest text-zinc-600 mb-4 font-semibold print:text-black">
                    Systeme
                  </div>
                  <ul className="list-none">
                    {mandate.systems.map((system) => (
                      <li
                        key={system.id}
                        className="py-2 md:py-3 border-b border-zinc-100 last:border-0 flex justify-between items-center text-black print:border-zinc-200"
                      >
                        <span>{system.name}</span>
                        {system.technology && (
                          <span className="text-xs md:text-sm text-zinc-600 print:text-black">{system.technology}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

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
                  <strong className="block text-base md:text-lg font-semibold mb-1 text-black">Garantiert</strong>
                  <span className="text-xs md:text-sm text-zinc-600 print:text-black">Verfügbarkeit durch Stellvertretung</span>
                </div>
                <div className="pt-4 md:pt-5 border-t border-zinc-300 print:pt-[5mm]">
                  <strong className="block text-base md:text-lg font-semibold mb-1 text-black">Monatlich</strong>
                  <span className="text-xs md:text-sm text-zinc-600 print:text-black">Rechnung am Tag des Vertragsabschlusses</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2 - Terms & Selection */}
        <div className="mandate-page max-w-3xl lg:max-w-[210mm] mx-auto bg-white shadow-xl print:shadow-none print:max-w-none print:pt-[20mm]">
          <div className="p-6 md:p-10 lg:p-[25mm_28mm] print:p-[0_25mm_20mm_25mm]">
            {/* Header */}
            <header className="flex justify-between items-start mb-10 md:mb-12 print:mb-[15mm]">
              <div className="text-2xl md:text-3xl font-semibold tracking-tight text-black" style={{ fontFamily: "Georgia, serif" }}>
                Läuft.
              </div>
              <div className="text-right text-xs md:text-sm text-zinc-600 print:text-black">
                {mandate.title}<br />
                Seite 2
              </div>
            </header>

            {/* Explanatory Notes */}
            <div className="mb-8 md:mb-10 print:mb-[10mm]">
              <div className="text-xs uppercase tracking-widest text-zinc-600 mb-4 font-semibold print:text-black">
                Hinweise zu den Konditionen
              </div>
              <div className="space-y-3 text-sm text-zinc-700 print:text-black">
                <p>
                  <strong className="text-black">Kündigungsfrist:</strong> Das Mandat kann von beiden Seiten mit einer Frist von {mandate.cancellation_period} gekündigt werden. Die Kündigung kann jederzeit online über diesen Link erfolgen. Nach Ablauf der Frist endet die Zusammenarbeit, offene Arbeiten werden abgeschlossen.
                </p>
                <p>
                  <strong className="text-black">Verfügbarkeit:</strong> Ferien und geplante Abwesenheiten werden im Voraus kommuniziert. In dieser Zeit wird die Arbeit durch einen qualifizierten Stellvertreter oder Freelancer sichergestellt. Der Kontakt läuft weiterhin über Pierre.
                </p>
                <p>
                  <strong className="text-black">Leistungsumfang:</strong> Das Mandat umfasst alle Arbeiten an bestehenden Systemen. Komplett neue Projekte, grössere Migrationen oder Arbeiten mit externen Partnern werden separat offeriert – zu fairen Partner-Konditionen.
                </p>
                <p>
                  <strong className="text-black">Abrechnung:</strong> Die Rechnung wird monatlich im Voraus gestellt, jeweils am Tag des Vertragsabschlusses. Zahlungsziel: 30 Tage.
                </p>
              </div>
            </div>

            <hr className="border-t border-zinc-200 my-6 md:my-8 print:my-[8mm] print:border-zinc-300" />

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

            {/* QR Code for Print - Online Acceptance */}
            {!accepted && (
              <div className="hidden print:block mt-12 pt-8 border-t-2 border-dashed border-zinc-300">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <QRCodeSVG
                      value={typeof window !== "undefined" ? window.location.href : `https://laeuft.ch/mandat/${token}`}
                      size={80}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-black mb-1">Online annehmen oder ablehnen</div>
                    <p className="text-xs text-zinc-600">
                      Scanne den QR-Code oder besuche den Link, um deine Auswahl digital zu bestätigen.
                    </p>
                    <p className="text-xs text-zinc-500 mt-2 font-mono">
                      laeuft.ch/mandat/{token.substring(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .mandate-page {
            width: 210mm;
            min-height: 297mm;
            page-break-after: always;
            page-break-inside: avoid;
            box-shadow: none !important;
          }
          .mandate-page:last-child {
            page-break-after: avoid;
          }
          .mandate-page:nth-child(2) {
            padding-top: 20mm !important;
          }
        }
      `}</style>
    </>
  );
}
