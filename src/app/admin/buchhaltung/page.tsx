"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, Expense, Income, Invoice, Category } from "@/lib/supabase";
import {
  TrendingUp,
  TrendingDown,
  MinusCircle,
  PlusCircle,
  Upload,
  ArrowRight,
  Receipt,
} from "lucide-react";

type MonthlySummary = {
  month: string;
  income: number;
  invoices: number;
  expenses: number;
  profit: number;
};

export default function BuchhaltungPage() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomeItems, setIncomeItems] = useState<Income[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);

  // Totals
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const currentYear = new Date().getFullYear();
    const startOfYear = `${currentYear}-01-01`;
    const endOfYear = `${currentYear}-12-31`;

    // Load paid invoices (income from invoices)
    const { data: invoiceData } = await supabase
      .from("invoices")
      .select("*")
      .eq("status", "paid")
      .gte("issue_date", startOfYear)
      .lte("issue_date", endOfYear)
      .order("issue_date", { ascending: false });

    // Load other income
    const { data: incomeData } = await supabase
      .from("income")
      .select("*, category:categories(*)")
      .gte("date", startOfYear)
      .lte("date", endOfYear)
      .order("date", { ascending: false });

    // Load expenses
    const { data: expenseData } = await supabase
      .from("expenses")
      .select("*, category:categories(*)")
      .gte("date", startOfYear)
      .lte("date", endOfYear)
      .order("date", { ascending: false });

    setInvoices(invoiceData || []);
    setIncomeItems(incomeData || []);
    setExpenses(expenseData || []);

    // Calculate totals
    const invoiceTotal = (invoiceData || []).reduce((sum, i) => sum + i.total_amount, 0);
    const otherIncomeTotal = (incomeData || []).reduce((sum, i) => sum + i.amount, 0);
    const expenseTotal = (expenseData || []).reduce((sum, e) => sum + e.amount, 0);

    setTotalIncome(invoiceTotal + otherIncomeTotal);
    setTotalExpenses(expenseTotal);
    setTotalProfit(invoiceTotal + otherIncomeTotal - expenseTotal);

    // Calculate monthly summary
    const monthlyData: { [key: string]: MonthlySummary } = {};

    // Initialize all months
    for (let m = 0; m < 12; m++) {
      const monthKey = `${currentYear}-${String(m + 1).padStart(2, "0")}`;
      monthlyData[monthKey] = {
        month: monthKey,
        income: 0,
        invoices: 0,
        expenses: 0,
        profit: 0,
      };
    }

    // Add invoice income
    (invoiceData || []).forEach((inv) => {
      const monthKey = inv.issue_date.substring(0, 7);
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].invoices += inv.total_amount;
      }
    });

    // Add other income
    (incomeData || []).forEach((inc) => {
      const monthKey = inc.date.substring(0, 7);
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].income += inc.amount;
      }
    });

    // Add expenses
    (expenseData || []).forEach((exp) => {
      const monthKey = exp.date.substring(0, 7);
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].expenses += exp.amount;
      }
    });

    // Calculate profit per month
    Object.keys(monthlyData).forEach((key) => {
      monthlyData[key].profit =
        monthlyData[key].invoices + monthlyData[key].income - monthlyData[key].expenses;
    });

    setMonthlySummary(Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month)));
    setLoading(false);
  }

  function formatAmount(amount: number) {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatMonth(monthStr: string) {
    const [year, month] = monthStr.split("-");
    const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    return `${months[parseInt(month) - 1]} ${year}`;
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-zinc-500">Laden...</div>
    );
  }

  const currentYear = new Date().getFullYear();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Buchhaltung {currentYear}
          </h1>
          <p className="text-zinc-500 mt-1">Übersicht deiner Einnahmen und Ausgaben</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/buchhaltung/ausgaben"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <MinusCircle size={18} />
            Ausgaben
          </Link>
          <Link
            href="/admin/buchhaltung/import"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            <Upload size={18} />
            CSV Import
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Income */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div className="text-sm text-zinc-500">Einnahmen</div>
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">
            {formatAmount(totalIncome)}
          </div>
          <div className="text-sm text-zinc-500 mt-1">
            {invoices.length} Rechnungen + {incomeItems.length} sonstige
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <TrendingDown className="text-red-600" size={20} />
            </div>
            <div className="text-sm text-zinc-500">Ausgaben</div>
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">
            {formatAmount(totalExpenses)}
          </div>
          <div className="text-sm text-zinc-500 mt-1">
            {expenses.length} Belege
          </div>
        </div>

        {/* Profit */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              totalProfit >= 0
                ? "bg-green-100 dark:bg-green-900/30"
                : "bg-red-100 dark:bg-red-900/30"
            }`}>
              {totalProfit >= 0 ? (
                <PlusCircle className="text-green-600" size={20} />
              ) : (
                <MinusCircle className="text-red-600" size={20} />
              )}
            </div>
            <div className="text-sm text-zinc-500">Gewinn</div>
          </div>
          <div className={`text-3xl font-bold ${
            totalProfit >= 0
              ? "text-green-600"
              : "text-red-600"
          }`}>
            {formatAmount(totalProfit)}
          </div>
          <div className="text-sm text-zinc-500 mt-1">
            vor Steuern & AHV
          </div>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-semibold text-zinc-900 dark:text-white">
            Monatliche Übersicht
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <th className="text-left px-6 py-3 text-sm font-medium text-zinc-500">Monat</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-zinc-500">Rechnungen</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-zinc-500">Sonstige</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-zinc-500">Ausgaben</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-zinc-500">Gewinn</th>
            </tr>
          </thead>
          <tbody>
            {monthlySummary.map((month) => (
              <tr
                key={month.month}
                className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
              >
                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                  {formatMonth(month.month)}
                </td>
                <td className="px-6 py-4 text-right text-green-600">
                  {month.invoices > 0 ? `+${formatAmount(month.invoices)}` : "-"}
                </td>
                <td className="px-6 py-4 text-right text-green-600">
                  {month.income > 0 ? `+${formatAmount(month.income)}` : "-"}
                </td>
                <td className="px-6 py-4 text-right text-red-600">
                  {month.expenses > 0 ? `-${formatAmount(month.expenses)}` : "-"}
                </td>
                <td className={`px-6 py-4 text-right font-medium ${
                  month.profit >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {month.profit !== 0 ? formatAmount(month.profit) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/buchhaltung/ausgaben"
          className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <MinusCircle className="text-red-500" size={20} />
            <span className="font-medium text-zinc-900 dark:text-white">
              Ausgabe erfassen
            </span>
          </div>
          <ArrowRight className="text-zinc-400" size={20} />
        </Link>

        <Link
          href="/admin/buchhaltung/import"
          className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Upload className="text-blue-500" size={20} />
            <span className="font-medium text-zinc-900 dark:text-white">
              Shopify / Bank CSV importieren
            </span>
          </div>
          <ArrowRight className="text-zinc-400" size={20} />
        </Link>
      </div>
    </div>
  );
}
