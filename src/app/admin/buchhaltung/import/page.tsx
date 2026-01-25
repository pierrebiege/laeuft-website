"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Upload,
  ChevronLeft,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Loader2,
  ShoppingCart,
  Building2,
  ArrowRight,
} from "lucide-react";

type ImportType = "shopify" | "bank_raiffeisen" | null;

type ParsedRow = {
  date: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  reference?: string;
  customer?: string;
};

type ImportResult = {
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
};

export default function ImportPage() {
  const [importType, setImportType] = useState<ImportType>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<"select" | "preview" | "done">("select");

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    parseCSV(selectedFile);
  }

  async function parseCSV(file: File) {
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      alert("CSV scheint leer zu sein");
      return;
    }

    const parsed: ParsedRow[] = [];

    if (importType === "shopify") {
      // Shopify Orders Export format
      // Expected columns: Name, Email, Financial Status, Paid at, Total, ...
      const header = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
      const nameIdx = header.findIndex((h) => h.toLowerCase() === "name");
      const emailIdx = header.findIndex((h) => h.toLowerCase() === "email");
      const totalIdx = header.findIndex((h) => h.toLowerCase() === "total");
      const paidAtIdx = header.findIndex((h) => h.toLowerCase().includes("paid at"));
      const statusIdx = header.findIndex((h) => h.toLowerCase().includes("financial status"));

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < Math.max(nameIdx, totalIdx, paidAtIdx) + 1) continue;

        const status = statusIdx >= 0 ? values[statusIdx]?.toLowerCase() : "";
        if (status && status !== "paid") continue; // Only import paid orders

        const total = parseFloat(values[totalIdx]?.replace(/[^0-9.-]/g, "") || "0");
        if (total <= 0) continue;

        const paidAt = values[paidAtIdx] || new Date().toISOString().split("T")[0];
        const orderName = values[nameIdx] || `Order ${i}`;
        const email = emailIdx >= 0 ? values[emailIdx] : "";

        parsed.push({
          date: formatDateForDB(paidAt),
          title: `Shopify ${orderName}`,
          amount: total,
          type: "income",
          reference: orderName,
          customer: email,
        });
      }
    } else if (importType === "bank_raiffeisen") {
      // Raiffeisen camt.053/CSV format
      // Try to detect format and parse accordingly
      const header = lines[0].split(";").map((h) => h.trim().replace(/"/g, ""));

      // Look for common column names
      const dateIdx = header.findIndex((h) =>
        ["datum", "date", "buchungsdatum", "valuta"].some((term) =>
          h.toLowerCase().includes(term)
        )
      );
      const textIdx = header.findIndex((h) =>
        ["text", "beschreibung", "verwendungszweck", "buchungstext"].some((term) =>
          h.toLowerCase().includes(term)
        )
      );
      const amountIdx = header.findIndex((h) =>
        ["betrag", "amount", "lastschrift", "gutschrift"].some((term) =>
          h.toLowerCase().includes(term)
        )
      );

      // If standard columns not found, try alternative detection
      const delimiter = lines[0].includes(";") ? ";" : ",";

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map((v) => v.trim().replace(/"/g, ""));
        if (values.length < 3) continue;

        // Try to extract date, text, amount
        let date = "";
        let text = "";
        let amount = 0;

        if (dateIdx >= 0 && textIdx >= 0 && amountIdx >= 0) {
          date = values[dateIdx];
          text = values[textIdx];
          amount = parseSwissAmount(values[amountIdx]);
        } else {
          // Fallback: assume date in first column, text in second, amount somewhere
          date = values[0];
          text = values[1] || values[2] || "";
          // Find a number that looks like an amount
          for (const val of values) {
            const num = parseSwissAmount(val);
            if (num !== 0) {
              amount = num;
              break;
            }
          }
        }

        if (!date || amount === 0) continue;

        parsed.push({
          date: formatDateForDB(date),
          title: text.substring(0, 100) || "Bank Transaktion",
          amount: Math.abs(amount),
          type: amount > 0 ? "income" : "expense",
          reference: "",
        });
      }
    }

    setParsedData(parsed);
    if (parsed.length > 0) {
      setStep("preview");
    } else {
      alert("Keine gültigen Daten gefunden. Bitte CSV-Format prüfen.");
    }
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  function parseSwissAmount(str: string): number {
    if (!str) return 0;
    // Swiss format: 1'234.56 or 1234.56 or -1'234.56
    const cleaned = str.replace(/[^0-9.,-]/g, "").replace(/'/g, "");
    return parseFloat(cleaned) || 0;
  }

  function formatDateForDB(dateStr: string): string {
    // Try various date formats
    const formats = [
      /(\d{4})-(\d{2})-(\d{2})/, // 2025-01-15
      /(\d{2})\.(\d{2})\.(\d{4})/, // 15.01.2025
      /(\d{2})\/(\d{2})\/(\d{4})/, // 15/01/2025 or 01/15/2025
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          return `${match[1]}-${match[2]}-${match[3]}`;
        } else if (format === formats[1]) {
          return `${match[3]}-${match[2]}-${match[1]}`;
        } else {
          // Assume DD/MM/YYYY for European format
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
      }
    }

    // Fallback to today
    return new Date().toISOString().split("T")[0];
  }

  async function doImport() {
    if (parsedData.length === 0) return;

    setImporting(true);
    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    // Create import batch
    const { data: batch } = await supabase
      .from("import_batches")
      .insert({
        type: importType,
        filename: file?.name,
        records_total: parsedData.length,
        status: "processing",
      })
      .select()
      .single();

    const batchId = batch?.id;

    for (const row of parsedData) {
      try {
        if (row.type === "income") {
          const { error } = await supabase.from("income").insert({
            title: row.title,
            amount: row.amount,
            date: row.date,
            external_id: row.reference,
            external_source: importType,
            customer_name: row.customer,
            import_source: `csv_${importType}`,
            import_batch_id: batchId,
          });

          if (error) {
            errors.push(`${row.title}: ${error.message}`);
            skipped++;
          } else {
            imported++;
          }
        } else {
          const { error } = await supabase.from("expenses").insert({
            title: row.title,
            amount: row.amount,
            date: row.date,
            reference_number: row.reference,
            import_source: `csv_${importType}`,
            import_batch_id: batchId,
          });

          if (error) {
            errors.push(`${row.title}: ${error.message}`);
            skipped++;
          } else {
            imported++;
          }
        }
      } catch (e) {
        errors.push(`${row.title}: Unbekannter Fehler`);
        skipped++;
      }
    }

    // Update batch status
    if (batchId) {
      await supabase
        .from("import_batches")
        .update({
          records_imported: imported,
          records_skipped: skipped,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", batchId);
    }

    setResult({
      total: parsedData.length,
      imported,
      skipped,
      errors,
    });
    setStep("done");
    setImporting(false);
  }

  function reset() {
    setImportType(null);
    setFile(null);
    setParsedData([]);
    setResult(null);
    setStep("select");
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("de-CH");
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/buchhaltung"
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">CSV Import</h1>
          <p className="text-zinc-500 mt-1">Importiere Daten aus Shopify oder deiner Bank</p>
        </div>
      </div>

      {/* Step: Select Import Type */}
      {step === "select" && (
        <div className="space-y-6">
          {!importType ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setImportType("shopify")}
                className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="text-green-600" size={20} />
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-white">Shopify</span>
                </div>
                <p className="text-sm text-zinc-500">
                  Importiere bezahlte Bestellungen aus deinem Shopify-Export (Orders CSV)
                </p>
              </button>

              <button
                onClick={() => setImportType("bank_raiffeisen")}
                className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Building2 className="text-blue-600" size={20} />
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    Bank (Raiffeisen)
                  </span>
                </div>
                <p className="text-sm text-zinc-500">
                  Importiere Kontobewegungen aus dem E-Banking Export (CSV)
                </p>
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {importType === "shopify" ? (
                    <ShoppingCart className="text-green-600" size={24} />
                  ) : (
                    <Building2 className="text-blue-600" size={24} />
                  )}
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {importType === "shopify" ? "Shopify Import" : "Bank Import"}
                  </span>
                </div>
                <button
                  onClick={() => setImportType(null)}
                  className="text-sm text-zinc-500 hover:text-zinc-700"
                >
                  Ändern
                </button>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <FileSpreadsheet size={24} />
                    <span className="font-medium">{file.name}</span>
                  </div>
                ) : (
                  <div className="text-zinc-500">
                    <Upload size={32} className="mx-auto mb-3" />
                    <p className="font-medium">CSV-Datei auswählen</p>
                    <p className="text-sm mt-1">
                      {importType === "shopify"
                        ? "Shopify Admin → Orders → Export"
                        : "E-Banking → Kontoauszug → CSV Export"}
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-zinc-900 dark:text-white">
                  Vorschau ({parsedData.length} Einträge)
                </h2>
                <p className="text-sm text-zinc-500">Prüfe die Daten vor dem Import</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="px-4 py-2 text-zinc-600 hover:text-zinc-900 font-medium"
                >
                  Abbrechen
                </button>
                <button
                  onClick={doImport}
                  disabled={importing}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Importiere...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} />
                      Jetzt importieren
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-zinc-500">Datum</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-zinc-500">
                      Beschreibung
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-zinc-500">Typ</th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-zinc-500">
                      Betrag
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 50).map((row, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                    >
                      <td className="px-6 py-3 text-zinc-500">{formatDate(row.date)}</td>
                      <td className="px-6 py-3 text-zinc-900 dark:text-white">{row.title}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            row.type === "income"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {row.type === "income" ? "Einnahme" : "Ausgabe"}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-3 text-right font-medium ${
                          row.type === "income" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {row.type === "income" ? "+" : "-"}
                        {formatAmount(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 50 && (
                <div className="px-6 py-3 text-center text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-800">
                  ... und {parsedData.length - 50} weitere Einträge
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && result && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
            Import abgeschlossen
          </h2>
          <p className="text-zinc-500 mb-6">
            {result.imported} von {result.total} Einträgen importiert
            {result.skipped > 0 && `, ${result.skipped} übersprungen`}
          </p>

          {result.errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                <AlertCircle size={16} />
                <span className="font-medium">Fehler beim Import</span>
              </div>
              <ul className="text-sm text-red-600 dark:text-red-300 list-disc list-inside">
                {result.errors.slice(0, 5).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
                {result.errors.length > 5 && (
                  <li>... und {result.errors.length - 5} weitere Fehler</li>
                )}
              </ul>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={reset}
              className="px-4 py-2 text-zinc-600 hover:text-zinc-900 font-medium"
            >
              Weiteren Import
            </button>
            <Link
              href="/admin/buchhaltung"
              className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              Zur Übersicht
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
