"use client";

import { useEffect, useState, use } from "react";
import { supabase, Invoice, InvoiceItem, Client } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";
import { Check, Printer } from "lucide-react";

type InvoiceWithDetails = Invoice & {
  client: Client;
  items: InvoiceItem[];
};

type QRBillData = {
  qrData: string;
  creditor: {
    name: string;
    iban: string;
    address: string;
    location: string;
  };
};

export default function InvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [invoice, setInvoice] = useState<InvoiceWithDetails | null>(null);
  const [qrBill, setQrBill] = useState<QRBillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoice();
  }, [token]);

  async function loadInvoice() {
    // Load invoice
    const { data, error: invoiceError } = await supabase
      .from("invoices")
      .select(`*, client:clients(*), items:invoice_items(*)`)
      .eq("unique_token", token)
      .single();

    if (invoiceError || !data) {
      setError("Rechnung nicht gefunden");
      setLoading(false);
      return;
    }

    // Sort items by sort_order
    data.items = data.items?.sort((a: InvoiceItem, b: InvoiceItem) => a.sort_order - b.sort_order) || [];
    setInvoice(data);

    // Load QR bill data from API
    try {
      const res = await fetch(`/api/qr-bill?token=${token}`);
      if (res.ok) {
        const qrData = await res.json();
        setQrBill(qrData);
      }
    } catch (e) {
      console.error("Failed to load QR bill data:", e);
    }

    setLoading(false);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500">Laden...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
            Rechnung nicht gefunden
          </h1>
          <p className="text-zinc-500">
            Der Link ist ungültig oder die Rechnung existiert nicht mehr.
          </p>
        </div>
      </div>
    );
  }

  const statusColors = {
    draft: "bg-zinc-100 text-zinc-600",
    sent: "bg-blue-50 text-blue-600",
    paid: "bg-green-50 text-green-600",
    overdue: "bg-red-50 text-red-600",
    cancelled: "bg-zinc-100 text-zinc-500",
  };

  const statusLabels = {
    draft: "Entwurf",
    sent: "Offen",
    paid: "Bezahlt",
    overdue: "Überfällig",
    cancelled: "Storniert",
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 py-8 print:bg-white print:py-0">
      {/* Print button - hidden on print */}
      <div className="max-w-3xl mx-auto px-4 mb-4 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
        >
          <Printer size={16} />
          Drucken / PDF
        </button>
      </div>

      {/* Invoice */}
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 shadow-sm print:shadow-none">
        <div className="p-8 md:p-12 print:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                Läuft<span className="text-zinc-400">.</span>
              </h1>
              <p className="text-sm text-zinc-500 mt-1">Digital Systems & Branding</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-500">Rechnung</div>
              <div className="text-xl font-bold text-zinc-900 dark:text-white">
                {invoice.invoice_number}
              </div>
              {invoice.status !== "draft" && (
                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${statusColors[invoice.status]}`}>
                  {statusLabels[invoice.status]}
                </span>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <div className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Von</div>
              <div className="text-sm text-zinc-700 dark:text-zinc-300">
                <div className="font-medium">Pierre-Laurent Biege</div>
                <div>Tschangaladongastrasse 3</div>
                <div>3955 Albinen</div>
                <div className="mt-2">pierre@laeuft.ch</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-400 uppercase tracking-wide mb-2">An</div>
              <div className="text-sm text-zinc-700 dark:text-zinc-300">
                {invoice.client.company && (
                  <div className="font-medium">{invoice.client.company}</div>
                )}
                <div className={invoice.client.company ? "" : "font-medium"}>
                  {invoice.client.name}
                </div>
                <div className="mt-2">{invoice.client.email}</div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="flex gap-8 mb-8 text-sm">
            <div>
              <span className="text-zinc-500">Rechnungsdatum:</span>{" "}
              <span className="text-zinc-900 dark:text-white">{formatDate(invoice.issue_date)}</span>
            </div>
            {invoice.due_date && (
              <div>
                <span className="text-zinc-500">Fällig am:</span>{" "}
                <span className="text-zinc-900 dark:text-white font-medium">{formatDate(invoice.due_date)}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {invoice.title}
            </h2>
            {invoice.description && (
              <p className="text-zinc-600 dark:text-zinc-400 mt-2">{invoice.description}</p>
            )}
          </div>

          {/* Items Table */}
          <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden mb-8">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Beschreibung
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide w-20">
                    Menge
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide w-28">
                    Preis
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide w-28">
                    Betrag
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr
                    key={item.id}
                    className={index !== invoice.items.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800" : ""}
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-zinc-900 dark:text-white">{item.title}</div>
                      {item.description && (
                        <div className="text-sm text-zinc-500 mt-1 whitespace-pre-line">{item.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right text-zinc-600 dark:text-zinc-400">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 text-right text-zinc-600 dark:text-zinc-400">
                      {formatAmount(item.unit_price)}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-zinc-900 dark:text-white">
                      {formatAmount(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-3 border-t-2 border-zinc-900 dark:border-white">
                <span className="text-lg font-semibold text-zinc-900 dark:text-white">Total</span>
                <span className="text-lg font-bold text-zinc-900 dark:text-white">
                  {formatAmount(invoice.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">{invoice.notes}</div>
            </div>
          )}

          {/* Paid Badge */}
          {invoice.status === "paid" && (
            <div className="mb-8 flex items-center justify-center gap-3 py-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Check className="text-green-600" size={24} />
              <span className="text-green-700 dark:text-green-400 font-semibold text-lg">
                Bezahlt am {invoice.paid_at ? formatDate(invoice.paid_at) : ""}
              </span>
            </div>
          )}

          {/* Swiss QR Bill Section - only show if not paid and QR data available */}
          {invoice.status !== "paid" && invoice.status !== "cancelled" && qrBill && (
            <div className="border-t-2 border-dashed border-zinc-300 dark:border-zinc-700 pt-8 mt-8">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  Zahlteil / Payment Part
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Swiss QR Code nach SIX Standard</p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-zinc-900">
                    <QRCodeSVG
                      value={qrBill.qrData}
                      size={160}
                      level="M"
                      includeMargin={false}
                    />
                    {/* Swiss Cross */}
                    <div className="flex justify-center mt-2">
                      <div className="w-7 h-7 bg-white border border-zinc-900 flex items-center justify-center">
                        <div className="relative w-4 h-4">
                          <div className="absolute top-1/2 left-0 w-full h-1 bg-red-600 -translate-y-1/2"></div>
                          <div className="absolute left-1/2 top-0 w-1 h-full bg-red-600 -translate-x-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="text-sm space-y-4">
                  <div>
                    <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Konto / Zahlbar an</div>
                    <div className="text-zinc-900 dark:text-white font-mono">{qrBill.creditor.iban}</div>
                    <div className="text-zinc-700 dark:text-zinc-300">{qrBill.creditor.name}</div>
                    <div className="text-zinc-700 dark:text-zinc-300">{qrBill.creditor.address}</div>
                    <div className="text-zinc-700 dark:text-zinc-300">{qrBill.creditor.location}</div>
                  </div>

                  <div>
                    <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Zahlbar durch</div>
                    {invoice.client.company && (
                      <div className="text-zinc-700 dark:text-zinc-300">{invoice.client.company}</div>
                    )}
                    <div className="text-zinc-700 dark:text-zinc-300">{invoice.client.name}</div>
                  </div>

                  <div>
                    <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Betrag</div>
                    <div className="text-xl font-bold text-zinc-900 dark:text-white">
                      CHF {invoice.total_amount.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Mitteilung</div>
                    <div className="text-zinc-700 dark:text-zinc-300">Rechnung {invoice.invoice_number}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center text-sm text-zinc-500">
            <p>
              Pierre-Laurent Biege | Digital Systems & Branding | Tschangaladongastrasse 3 | 3955 Albinen
            </p>
            <p className="mt-1">
              079 853 36 72 | pierre@laeuft.ch | laeuft.ch
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
