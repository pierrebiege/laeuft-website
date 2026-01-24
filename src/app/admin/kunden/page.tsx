"use client";

import { useEffect, useState } from "react";
import { supabase, Client } from "@/lib/supabase";
import { Plus, X, Trash2 } from "lucide-react";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

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

  async function deleteClient(clientId: string) {
    if (!confirm("Kunde unwiderruflich löschen? Alle zugehörigen Offerten und Rechnungen werden ebenfalls gelöscht.")) return;

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (error) {
      console.error("Error deleting client:", error);
      alert("Fehler beim Löschen");
    } else {
      loadClients();
    }
  }

  async function saveClient(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;

    setSaving(true);

    const { error } = await supabase.from("clients").insert({
      name,
      company: company || null,
      email,
    });

    if (error) {
      alert("Fehler beim Speichern");
    } else {
      setName("");
      setCompany("");
      setEmail("");
      setShowForm(false);
      loadClients();
    }

    setSaving(false);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Kunden</h1>
          <p className="text-zinc-500 mt-1">Verwalte deine Kunden</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Abbrechen" : "Neuer Kunde"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={saveClient}
          className="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Max Muster"
                required
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Firma
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Muster GmbH"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                E-Mail *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="max@beispiel.ch"
                required
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50"
          >
            {saving ? "Speichern..." : "Kunde speichern"}
          </button>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Laden...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 mb-4">Noch keine Kunden</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 text-zinc-900 dark:text-white font-medium hover:underline"
          >
            <Plus size={16} />
            Ersten Kunden hinzufügen
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Firma</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">Name</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-500">E-Mail</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-500"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                >
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                    {client.company || "–"}
                  </td>
                  <td className="px-6 py-4 text-zinc-900 dark:text-white">{client.name}</td>
                  <td className="px-6 py-4 text-zinc-500">{client.email}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteClient(client.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
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
