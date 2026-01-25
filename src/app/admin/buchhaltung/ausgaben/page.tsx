"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase, Expense, Category } from "@/lib/supabase";
import {
  Plus,
  Upload,
  X,
  Trash2,
  FileText,
  Scan,
  ChevronLeft,
  Check,
  Loader2,
} from "lucide-react";

type ExpenseWithCategory = Expense & { category: Category | null };

export default function AusgabenPage() {
  const [expenses, setExpenses] = useState<ExpenseWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrSuggestions, setOcrSuggestions] = useState<{
    amount?: string;
    date?: string;
    vendor?: string;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Load categories
    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .eq("type", "expense")
      .order("sort_order");

    setCategories(catData || []);

    // Load expenses
    const { data: expData } = await supabase
      .from("expenses")
      .select("*, category:categories(*)")
      .order("date", { ascending: false })
      .limit(100);

    setExpenses(expData || []);
    setLoading(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);

    // If it's a PDF or image, try OCR
    if (file.type === "application/pdf" || file.type.startsWith("image/")) {
      await performOCR(file);
    }
  }

  async function performOCR(file: File) {
    setScanning(true);
    setOcrText("");
    setOcrSuggestions({});

    try {
      // Dynamic import of Tesseract.js
      const Tesseract = await import("tesseract.js");

      let imageData: string | File = file;

      // For PDFs, we'd need to convert to image first
      // For now, only support images directly
      if (file.type.startsWith("image/")) {
        const result = await Tesseract.recognize(file, "deu", {
          logger: (m) => console.log(m),
        });

        const text = result.data.text;
        setOcrText(text);

        // Try to extract useful info with regex
        const suggestions = extractFromOCR(text);
        setOcrSuggestions(suggestions);

        // Auto-fill if we found values
        if (suggestions.amount && !amount) {
          setAmount(suggestions.amount);
        }
        if (suggestions.date && date === new Date().toISOString().split("T")[0]) {
          setDate(suggestions.date);
        }
        if (suggestions.vendor && !vendorName) {
          setVendorName(suggestions.vendor);
        }
      } else {
        setOcrText("PDF-Scan noch nicht unterstützt. Bitte Bild hochladen oder manuell eingeben.");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      setOcrText("Fehler beim Scannen. Bitte manuell eingeben.");
    }

    setScanning(false);
  }

  function extractFromOCR(text: string): { amount?: string; date?: string; vendor?: string } {
    const suggestions: { amount?: string; date?: string; vendor?: string } = {};

    // Try to find amounts (CHF followed by number, or just numbers with decimal)
    const amountPatterns = [
      /(?:CHF|Fr\.?|Total|Betrag|Summe)[:\s]*(\d{1,3}(?:[',]\d{3})*(?:[.,]\d{2})?)/gi,
      /(\d{1,3}(?:[',]\d{3})*[.,]\d{2})\s*(?:CHF|Fr\.?)/gi,
      /(?:Total|Summe|Betrag)[:\s]*(\d+[.,]\d{2})/gi,
    ];

    for (const pattern of amountPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Get the last match (usually the total)
        const lastMatch = matches[matches.length - 1];
        const numMatch = lastMatch.match(/(\d{1,3}(?:[',]\d{3})*[.,]\d{2})/);
        if (numMatch) {
          suggestions.amount = numMatch[1].replace(/[',]/g, "").replace(",", ".");
          break;
        }
      }
    }

    // Try to find dates (DD.MM.YYYY or similar)
    const datePatterns = [
      /(\d{1,2})[./-](\d{1,2})[./-](\d{4})/g,
      /(\d{1,2})[./-](\d{1,2})[./-](\d{2})/g,
    ];

    for (const pattern of datePatterns) {
      const match = pattern.exec(text);
      if (match) {
        let year = match[3];
        if (year.length === 2) {
          year = "20" + year;
        }
        const month = match[2].padStart(2, "0");
        const day = match[1].padStart(2, "0");
        suggestions.date = `${year}-${month}-${day}`;
        break;
      }
    }

    // Try to find vendor (first line or after "Von:" etc.)
    const lines = text.split("\n").filter((l) => l.trim().length > 3);
    if (lines.length > 0) {
      // First substantial line is often the company name
      suggestions.vendor = lines[0].trim().substring(0, 50);
    }

    return suggestions;
  }

  async function saveExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !amount || !date) return;

    setSaving(true);

    // TODO: Upload receipt file to Supabase Storage
    // For now, we'll just save the metadata

    const { error } = await supabase.from("expenses").insert({
      title,
      amount: parseFloat(amount),
      date,
      category_id: categoryId || null,
      description: description || null,
      vendor_name: vendorName || null,
      reference_number: referenceNumber || null,
      ocr_raw_text: ocrText || null,
      import_source: "manual",
    });

    if (error) {
      console.error("Error saving expense:", error);
      alert("Fehler beim Speichern");
    } else {
      // Reset form
      setTitle("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setCategoryId("");
      setDescription("");
      setVendorName("");
      setReferenceNumber("");
      setReceiptFile(null);
      setOcrText("");
      setOcrSuggestions({});
      setShowForm(false);
      loadData();
    }

    setSaving(false);
  }

  async function deleteExpense(id: string) {
    if (!confirm("Ausgabe unwiderruflich löschen?")) return;

    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      alert("Fehler beim Löschen");
    } else {
      loadData();
    }
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/buchhaltung"
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Ausgaben</h1>
            <p className="text-zinc-500 mt-1">Erfasse und verwalte deine Ausgaben</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Abbrechen" : "Neue Ausgabe"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={saveExpense}
          className="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
        >
          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Beleg hochladen (optional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
            >
              {receiptFile ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <FileText size={20} />
                  <span>{receiptFile.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReceiptFile(null);
                      setOcrText("");
                      setOcrSuggestions({});
                    }}
                    className="ml-2 text-zinc-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : scanning ? (
                <div className="flex items-center justify-center gap-2 text-zinc-500">
                  <Loader2 size={20} className="animate-spin" />
                  <span>Scanne Beleg...</span>
                </div>
              ) : (
                <div className="text-zinc-500">
                  <Upload size={24} className="mx-auto mb-2" />
                  <p>PDF oder Bild hier ablegen oder klicken</p>
                  <p className="text-xs mt-1">Wird automatisch gescannt (OCR)</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* OCR Suggestions */}
          {Object.keys(ocrSuggestions).length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                <Scan size={16} />
                <span className="font-medium">Erkannte Werte</span>
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-300">
                {ocrSuggestions.amount && <p>Betrag: CHF {ocrSuggestions.amount}</p>}
                {ocrSuggestions.date && <p>Datum: {formatDate(ocrSuggestions.date)}</p>}
                {ocrSuggestions.vendor && <p>Lieferant: {ocrSuggestions.vendor}</p>}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Bezeichnung *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Adobe Creative Cloud"
                required
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Betrag (CHF) *
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Datum *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Kategorie
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              >
                <option value="">Keine Kategorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Lieferant
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="z.B. Adobe Inc."
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Rechnungsnummer
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="z.B. INV-2025-001"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optionale Notizen..."
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Check size={16} />
                Ausgabe speichern
              </>
            )}
          </button>
        </form>
      )}

      {/* Expenses Table */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Laden...</div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 mb-4">Noch keine Ausgaben erfasst</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 text-zinc-900 dark:text-white font-medium hover:underline"
          >
            <Plus size={16} />
            Erste Ausgabe erfassen
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Datum</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">
                  Bezeichnung
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Kategorie</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-500">Betrag</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-500"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-6 py-4 text-zinc-500">{formatDate(expense.date)}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900 dark:text-white">{expense.title}</div>
                    {expense.vendor_name && (
                      <div className="text-sm text-zinc-500">{expense.vendor_name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {expense.category ? (
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${expense.category.color}20`,
                          color: expense.category.color,
                        }}
                      >
                        {expense.category.name}
                      </span>
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-red-600">
                    -{formatAmount(expense.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteExpense(expense.id)}
                      className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
