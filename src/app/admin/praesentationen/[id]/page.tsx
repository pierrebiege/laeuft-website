"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Copy, ExternalLink, Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { PresentationView, type Block, type PresentationData } from "@/components/presentations/PresentationBlocks";

interface Presentation extends PresentationData {
  id: number;
  slug: string;
  share_token: string;
  status: string;
}

const BLOCK_TEMPLATES: Record<string, Block> = {
  cover: { type: "cover", title: "Events 2026", subtitle: "Pierre Biege" },
  bio: { type: "bio", heading: "Wer bin ich?", text: "", stats: [] },
  "content-overview": { type: "content-overview", heading: "Jeder Schritt zählt", channels: [{ icon: "youtube", name: "YouTube", reach: "" }] },
  race: { type: "race", name: "Race Name", date: "", location: "", description: "" },
  goal: { type: "goal", heading: "Unser Ziel", text: "" },
  team: { type: "team", heading: "Production Team", members: [] },
  offer: { type: "offer", heading: "Angebot", bullets: [] },
  contact: { type: "contact", name: "Anes", email: "anes@laeuft.ch" },
};

export default function PresentationEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Presentation | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch(`/api/presentations/${id}`).then((r) => r.json()).then(setData);
  }, [id]);

  const update = useCallback((patch: Partial<Presentation>) => {
    setData((prev) => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
  }, []);

  const updateBlock = useCallback((index: number, patch: Partial<Block>) => {
    setData((prev) => {
      if (!prev) return prev;
      const blocks = [...prev.blocks];
      blocks[index] = { ...blocks[index], ...patch } as Block;
      return { ...prev, blocks };
    });
    setDirty(true);
  }, []);

  function moveBlock(index: number, dir: -1 | 1) {
    if (!data) return;
    const blocks = [...data.blocks];
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    update({ blocks });
  }

  function deleteBlock(index: number) {
    if (!data) return;
    update({ blocks: data.blocks.filter((_, i) => i !== index) });
  }

  function addBlock(type: string) {
    if (!data) return;
    update({ blocks: [...data.blocks, JSON.parse(JSON.stringify(BLOCK_TEMPLATES[type]))] });
  }

  async function save() {
    if (!data) return;
    setSaving(true);
    await fetch(`/api/presentations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name: data.customer_name,
        customer_logo_url: data.customer_logo_url,
        title: data.title,
        blocks: data.blocks,
      }),
    });
    setSaving(false);
    setDirty(false);
  }

  function copyLink() {
    if (!data) return;
    const url = `${window.location.origin}/kunde/${data.slug}?t=${data.share_token}`;
    navigator.clipboard.writeText(url);
    alert("Link kopiert!");
  }

  if (!data) return <div className="text-zinc-500">Lädt...</div>;

  return (
    <div className="-m-6 -my-8 min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center gap-4">
        <Link href="/admin/praesentationen" className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <ArrowLeft size={18} />
        </Link>
        <input
          type="text"
          value={data.customer_name}
          onChange={(e) => update({ customer_name: e.target.value })}
          className="text-xl font-bold bg-transparent border-none focus:outline-none flex-1"
        />
        {dirty && <span className="text-xs text-amber-600">● ungespeichert</span>}
        <button onClick={() => setShowPreview(!showPreview)} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Preview toggle">
          {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button onClick={copyLink} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <Copy size={16} /> Link
        </button>
        <a href={`/kunde/${data.slug}?t=${data.share_token}`} target="_blank" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <ExternalLink size={16} /> Öffnen
        </a>
        <button onClick={save} disabled={saving || !dirty} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium disabled:opacity-50">
          <Save size={16} /> {saving ? "Speichert..." : "Speichern"}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className={`${showPreview ? "w-1/2" : "w-full"} overflow-y-auto p-6 space-y-6 bg-zinc-50 dark:bg-zinc-950`}>
          {/* Meta */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Meta</h3>
            <input type="text" placeholder="Titel" value={data.title || ""} onChange={(e) => update({ title: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm" />
            <input type="text" placeholder="Customer Logo URL (z.B. /presentations/yfood/logo.png)" value={data.customer_logo_url || ""} onChange={(e) => update({ customer_logo_url: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm" />
          </div>

          {/* Blocks */}
          {data.blocks.map((block, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                  {String(i + 1).padStart(2, "0")} · {block.type}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveBlock(i, -1)} className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><ChevronUp size={14} /></button>
                  <button onClick={() => moveBlock(i, 1)} className="p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><ChevronDown size={14} /></button>
                  <button onClick={() => deleteBlock(i)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950 text-zinc-500 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
              <BlockEditor block={block} onChange={(patch) => updateBlock(i, patch)} />
            </div>
          ))}

          {/* Add block */}
          <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-3">Block hinzufügen</div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(BLOCK_TEMPLATES).map((t) => (
                <button key={t} onClick={() => addBlock(t)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg">
                  <Plus size={14} /> {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 overflow-y-auto bg-white border-l border-zinc-200 dark:border-zinc-800">
            <div className="origin-top scale-[0.5] w-[200%] -mb-[100%]">
              <PresentationView data={data} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1 block">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm";

function BlockEditor({ block, onChange }: { block: Block; onChange: (patch: any) => void }) {
  switch (block.type) {
    case "cover":
      return (
        <div className="space-y-3">
          <Field label="Titel"><input className={inputClass} value={block.title} onChange={(e) => onChange({ title: e.target.value })} /></Field>
          <Field label="Subtitle"><input className={inputClass} value={block.subtitle || ""} onChange={(e) => onChange({ subtitle: e.target.value })} /></Field>
          <Field label="Bild URL"><input className={inputClass} value={block.image || ""} onChange={(e) => onChange({ image: e.target.value })} /></Field>
        </div>
      );
    case "bio":
      return (
        <div className="space-y-3">
          <Field label="Heading"><input className={inputClass} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} /></Field>
          <Field label="Text"><textarea rows={4} className={inputClass} value={block.text} onChange={(e) => onChange({ text: e.target.value })} /></Field>
          <Field label="Bild URL"><input className={inputClass} value={block.image || ""} onChange={(e) => onChange({ image: e.target.value })} /></Field>
          <Field label="Stats (label|value, einer pro Zeile)">
            <textarea rows={3} className={inputClass}
              value={(block.stats || []).map((s) => `${s.label}|${s.value}`).join("\n")}
              onChange={(e) => onChange({ stats: e.target.value.split("\n").filter(Boolean).map((l) => { const [label, value] = l.split("|"); return { label: label || "", value: value || "" }; }) })}
            />
          </Field>
        </div>
      );
    case "race":
      return (
        <div className="space-y-3">
          <Field label="Name"><input className={inputClass} value={block.name} onChange={(e) => onChange({ name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Datum"><input className={inputClass} value={block.date} onChange={(e) => onChange({ date: e.target.value })} /></Field>
            <Field label="Ort"><input className={inputClass} value={block.location} onChange={(e) => onChange({ location: e.target.value })} /></Field>
          </div>
          <Field label="Beschreibung"><textarea rows={3} className={inputClass} value={block.description} onChange={(e) => onChange({ description: e.target.value })} /></Field>
          <Field label="Bild URL"><input className={inputClass} value={block.image || ""} onChange={(e) => onChange({ image: e.target.value })} /></Field>
        </div>
      );
    case "goal":
      return (
        <div className="space-y-3">
          <Field label="Heading"><input className={inputClass} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} /></Field>
          <Field label="Text"><textarea rows={3} className={inputClass} value={block.text} onChange={(e) => onChange({ text: e.target.value })} /></Field>
        </div>
      );
    case "content-overview":
      return (
        <div className="space-y-3">
          <Field label="Heading"><input className={inputClass} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} /></Field>
          <Field label="Channels (icon|name|reach, einer pro Zeile)">
            <textarea rows={4} className={inputClass}
              value={block.channels.map((c) => `${c.icon}|${c.name}|${c.reach}`).join("\n")}
              onChange={(e) => onChange({ channels: e.target.value.split("\n").filter(Boolean).map((l) => { const [icon, name, reach] = l.split("|"); return { icon: icon || "users", name: name || "", reach: reach || "" }; }) })}
            />
          </Field>
          <p className="text-xs text-zinc-400">Icons: youtube, instagram, camera, users</p>
        </div>
      );
    case "team":
      return (
        <div className="space-y-3">
          <Field label="Heading"><input className={inputClass} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} /></Field>
          <Field label="Members (name|role|image, einer pro Zeile)">
            <textarea rows={4} className={inputClass}
              value={block.members.map((m) => `${m.name}|${m.role}|${m.image || ""}`).join("\n")}
              onChange={(e) => onChange({ members: e.target.value.split("\n").filter(Boolean).map((l) => { const [name, role, image] = l.split("|"); return { name: name || "", role: role || "", image: image || undefined }; }) })}
            />
          </Field>
        </div>
      );
    case "offer":
      return (
        <div className="space-y-3">
          <Field label="Heading"><input className={inputClass} value={block.heading} onChange={(e) => onChange({ heading: e.target.value })} /></Field>
          <Field label="Bullets (einer pro Zeile)">
            <textarea rows={5} className={inputClass} value={block.bullets.join("\n")} onChange={(e) => onChange({ bullets: e.target.value.split("\n").filter(Boolean) })} />
          </Field>
          <Field label="Preis (optional)"><input className={inputClass} value={block.price || ""} onChange={(e) => onChange({ price: e.target.value })} /></Field>
        </div>
      );
    case "contact":
      return (
        <div className="space-y-3">
          <Field label="Name"><input className={inputClass} value={block.name} onChange={(e) => onChange({ name: e.target.value })} /></Field>
          <Field label="E-Mail"><input className={inputClass} value={block.email} onChange={(e) => onChange({ email: e.target.value })} /></Field>
          <Field label="Telefon"><input className={inputClass} value={block.phone || ""} onChange={(e) => onChange({ phone: e.target.value })} /></Field>
        </div>
      );
    default:
      return null;
  }
}
