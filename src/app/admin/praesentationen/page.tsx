"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ExternalLink, Copy, Trash2, Eye } from "lucide-react";

interface Presentation {
  id: number;
  slug: string;
  customer_name: string;
  title: string | null;
  share_token: string;
  status: string;
  view_count: number;
  last_viewed_at: string | null;
  updated_at: string;
}

export default function PresentationsListPage() {
  const [items, setItems] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function load() {
    const r = await fetch("/api/presentations");
    if (r.ok) setItems(await r.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create() {
    const name = prompt("Kundenname?");
    if (!name) return;
    setCreating(true);
    const r = await fetch("/api/presentations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_name: name }),
    });
    setCreating(false);
    if (r.ok) {
      const p = await r.json();
      window.location.href = `/admin/praesentationen/${p.id}`;
    }
  }

  async function remove(id: number) {
    if (!confirm("Wirklich löschen?")) return;
    await fetch(`/api/presentations/${id}`, { method: "DELETE" });
    load();
  }

  function shareUrl(p: Presentation) {
    return `${window.location.origin}/kunde/${p.slug}?t=${p.share_token}`;
  }

  function copyLink(p: Presentation) {
    navigator.clipboard.writeText(shareUrl(p));
    alert("Link kopiert!");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Präsentationen</h1>
          <p className="text-sm text-zinc-500 mt-1">Kunden-Präsentationen erstellen und verschicken</p>
        </div>
        <button
          onClick={create}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Plus size={18} /> Neue Präsentation
        </button>
      </div>

      {loading ? (
        <div className="text-zinc-500">Lädt...</div>
      ) : items.length === 0 ? (
        <div className="text-zinc-500 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-16 text-center">
          Noch keine Präsentationen. Erstelle deine erste.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <div key={p.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex items-center gap-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
              <div className="flex-1 min-w-0">
                <Link href={`/admin/praesentationen/${p.id}`} className="block">
                  <div className="font-semibold text-zinc-900 dark:text-white truncate">{p.customer_name}</div>
                  <div className="text-sm text-zinc-500 truncate">{p.title}</div>
                </Link>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><Eye size={12} /> {p.view_count}</span>
                <span className={`px-2 py-1 rounded-full ${p.status === "viewed" ? "bg-green-100 text-green-700" : p.status === "sent" ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-600"}`}>
                  {p.status}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => copyLink(p)} title="Link kopieren" className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Copy size={16} />
                </button>
                <a href={`/kunde/${p.slug}?t=${p.share_token}`} target="_blank" title="Öffnen" className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <ExternalLink size={16} />
                </a>
                <button onClick={() => remove(p.id)} title="Löschen" className="p-2 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
