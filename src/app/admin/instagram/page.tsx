'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { DashboardConfig, DashboardToken, PartnerLogo } from '@/lib/instagram-types'

interface ImagePreview {
  data: string
  media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  preview: string
  name: string
}

type ExtractStep = 'idle' | 'uploading' | 'extracting' | 'review' | 'saving' | 'done'

export default function InstagramAdminPage() {
  const [tokens, setTokens] = useState<DashboardToken[]>([])
  const [config, setConfig] = useState<DashboardConfig | null>(null)
  const [newTokenLabel, setNewTokenLabel] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [configSaving, setConfigSaving] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

  // Screenshot extraction state
  const [images, setImages] = useState<ImagePreview[]>([])
  const [extractStep, setExtractStep] = useState<ExtractStep>('idle')
  const [extracted, setExtracted] = useState<Record<string, unknown> | null>(null)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [saveResult, setSaveResult] = useState<string | null>(null)
  const [rawJson, setRawJson] = useState('')
  const [showJson, setShowJson] = useState(false)

  // Section collapse state
  const [showTokens, setShowTokens] = useState(true)
  const [showConfig, setShowConfig] = useState(false)

  useEffect(() => {
    loadTokens()
    loadConfig()
  }, [])

  async function loadTokens() {
    const res = await fetch('/api/instagram/tokens')
    if (res.ok) setTokens(await res.json())
  }

  async function loadConfig() {
    const res = await fetch('/api/instagram/config')
    if (res.ok) setConfig(await res.json())
  }

  // --- Screenshot Upload & Extraction ---

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) return
    if (file.size > 20 * 1024 * 1024) {
      alert('Bild zu gross (max. 20MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      setImages((prev) => [
        ...prev,
        {
          data: base64,
          media_type: file.type as ImagePreview['media_type'],
          preview: dataUrl,
          name: file.name,
        },
      ])
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    for (const file of Array.from(e.dataTransfer.files)) {
      processFile(file)
    }
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) processFile(file)
      }
    }
  }, [])

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleExtract() {
    if (!images.length) return
    setExtractStep('extracting')
    setExtractError(null)
    setExtracted(null)

    try {
      const res = await fetch('/api/instagram/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map((img) => ({
            data: img.data,
            media_type: img.media_type,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.extracted) {
        setExtractError(data.error || 'Extraktion fehlgeschlagen')
        setExtractStep('idle')
        return
      }

      setExtracted(data.extracted)
      setRawJson(JSON.stringify(data.extracted, null, 2))
      setExtractStep('review')
    } catch (e) {
      setExtractError(String(e))
      setExtractStep('idle')
    }
  }

  async function handleSave() {
    if (!extracted) return
    setExtractStep('saving')

    try {
      // Use edited JSON if user modified it
      const dataToSave = showJson ? JSON.parse(rawJson) : extracted

      const res = await fetch('/api/instagram/extract', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extracted: dataToSave }),
      })

      const data = await res.json()
      if (res.ok) {
        setSaveResult(data.results?.join(', ') || 'Gespeichert')
        setExtractStep('done')
      } else {
        setExtractError(data.error || 'Speichern fehlgeschlagen')
        setExtractStep('review')
      }
    } catch (e) {
      setExtractError(String(e))
      setExtractStep('review')
    }
  }

  function resetExtraction() {
    setImages([])
    setExtracted(null)
    setExtractError(null)
    setSaveResult(null)
    setRawJson('')
    setShowJson(false)
    setExtractStep('idle')
  }

  // --- Token Management ---

  async function createToken() {
    if (!newTokenLabel.trim()) return
    const res = await fetch('/api/instagram/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newTokenLabel }),
    })
    if (res.ok) {
      setNewTokenLabel('')
      loadTokens()
    }
  }

  async function toggleToken(id: string, isActive: boolean) {
    await fetch(`/api/instagram/tokens/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
    loadTokens()
  }

  async function deleteToken(id: string) {
    if (!confirm('Token wirklich löschen?')) return
    await fetch(`/api/instagram/tokens/${id}`, { method: 'DELETE' })
    loadTokens()
  }

  function copyLink(token: string, id: string) {
    const url = `${window.location.origin}/dashboard/${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // --- Config ---

  async function saveConfig() {
    if (!config) return
    setConfigSaving(true)
    await fetch('/api/instagram/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setConfigSaving(false)
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2000)
  }

  function updatePartnerLogo(index: number, field: keyof PartnerLogo, value: string) {
    if (!config) return
    const logos = [...config.partner_logos]
    logos[index] = { ...logos[index], [field]: value }
    setConfig({ ...config, partner_logos: logos })
  }

  function addPartnerLogo() {
    if (!config) return
    setConfig({
      ...config,
      partner_logos: [...config.partner_logos, { name: '', url: '', image_url: '' }],
    })
  }

  function removePartnerLogo(index: number) {
    if (!config) return
    setConfig({
      ...config,
      partner_logos: config.partner_logos.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Instagram Dashboard</h1>

      {/* Screenshot Upload & AI Extraction */}
      <section className="bg-white border-2 border-purple-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-purple-500" />
          <h2 className="text-lg font-semibold">Insights Screenshots hochladen</h2>
        </div>
        <p className="text-sm text-zinc-500 mb-4">
          Lade Screenshots aus deinen Instagram Insights hoch. Claude erkennt automatisch alle Metriken und speichert sie.
        </p>

        {extractStep === 'idle' && (
          <>
            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onPaste={handlePaste}
              className="border-2 border-dashed border-zinc-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('ig-file-input')?.click()}
            >
              <Upload size={32} className="mx-auto text-zinc-400 mb-3" />
              <p className="text-sm text-zinc-600 font-medium">Screenshots hierher ziehen, einfügen oder klicken</p>
              <p className="text-xs text-zinc-400 mt-1">Mehrere Bilder gleichzeitig möglich (Übersicht, Zielgruppe, Posts...)</p>
              <input
                id="ig-file-input"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  for (const file of Array.from(e.target.files || [])) {
                    processFile(file)
                  }
                  e.target.value = ''
                }}
              />
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-3 mb-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={img.preview}
                        alt={img.name}
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                      <p className="text-[9px] text-zinc-500 mt-0.5 truncate w-24">{img.name}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleExtract}
                  className="flex items-center gap-2 bg-purple-600 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-purple-500 transition-colors"
                >
                  <Sparkles size={14} />
                  {images.length} Screenshot{images.length > 1 ? 's' : ''} analysieren
                </button>
              </div>
            )}
          </>
        )}

        {extractStep === 'extracting' && (
          <div className="flex items-center gap-3 py-8 justify-center">
            <RefreshCw size={18} className="animate-spin text-purple-500" />
            <p className="text-sm text-zinc-600">Claude analysiert die Screenshots...</p>
          </div>
        )}

        {extractStep === 'review' && extracted && (
          <div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-emerald-800 mb-2">Erkannte Daten:</p>

              {/* Account Metrics */}
              {(extracted as Record<string, unknown>).account_metrics && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">Account Metriken</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(extracted.account_metrics as Record<string, unknown>).map(([key, val]) => (
                      <div key={key} className="bg-white rounded px-2 py-1.5 text-xs">
                        <span className="text-zinc-500">{key}: </span>
                        <span className="font-medium">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audience */}
              {(extracted as Record<string, unknown>).audience_data && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">Zielgruppen-Daten</p>
                  <p className="text-xs text-emerald-600">
                    {Object.keys(extracted.audience_data as Record<string, unknown>).join(', ')}
                  </p>
                </div>
              )}

              {/* Posts */}
              {(extracted as Record<string, unknown>).post_data && Array.isArray(extracted.post_data) && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">
                    {(extracted.post_data as unknown[]).length} Posts erkannt
                  </p>
                </div>
              )}

              {/* Raw text summary */}
              {(extracted as Record<string, unknown>).raw_text && (
                <p className="text-xs text-emerald-600 mt-2 italic">{String(extracted.raw_text)}</p>
              )}
            </div>

            {/* Editable JSON */}
            <button
              onClick={() => setShowJson(!showJson)}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 mb-2 transition-colors"
            >
              {showJson ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              JSON bearbeiten
            </button>
            {showJson && (
              <textarea
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                rows={15}
                className="w-full border rounded-lg px-3 py-2 text-xs font-mono mb-4"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-emerald-600 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-emerald-500 transition-colors"
              >
                <Save size={14} />
                In Dashboard speichern
              </button>
              <button
                onClick={resetExtraction}
                className="text-sm text-zinc-500 hover:text-zinc-900 px-4 py-2.5 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {extractStep === 'saving' && (
          <div className="flex items-center gap-3 py-8 justify-center">
            <RefreshCw size={18} className="animate-spin text-emerald-500" />
            <p className="text-sm text-zinc-600">Speichere in Supabase...</p>
          </div>
        )}

        {extractStep === 'done' && (
          <div className="text-center py-6">
            <Check size={32} className="mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-medium text-emerald-700 mb-1">Erfolgreich gespeichert!</p>
            {saveResult && <p className="text-xs text-emerald-600">{saveResult}</p>}
            <button
              onClick={resetExtraction}
              className="mt-4 text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors"
            >
              Weitere Screenshots hochladen
            </button>
          </div>
        )}

        {extractError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded mt-3">{extractError}</p>
        )}
      </section>

      {/* Token Manager */}
      <section className="bg-white border rounded-lg p-6">
        <button
          onClick={() => setShowTokens(!showTokens)}
          className="flex items-center justify-between w-full"
        >
          <h2 className="text-lg font-semibold">Zugangslinks</h2>
          {showTokens ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTokens && (
          <div className="mt-4">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTokenLabel}
                onChange={(e) => setNewTokenLabel(e.target.value)}
                placeholder="Label (z.B. Nike Q2 2026)"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && createToken()}
              />
              <button
                onClick={createToken}
                disabled={!newTokenLabel.trim()}
                className="flex items-center gap-1.5 bg-zinc-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 disabled:opacity-30 transition-colors"
              >
                <Plus size={14} />
                Erstellen
              </button>
            </div>

            <div className="space-y-2">
              {tokens.map((t) => (
                <div key={t.id} className="flex items-center gap-3 border rounded-lg px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${t.is_active ? 'bg-emerald-400' : 'bg-zinc-300'}`} />
                      <span className="font-medium text-sm">{t.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      <span>{t.views_count} Views</span>
                      {t.last_viewed_at && (
                        <span>Zuletzt: {new Date(t.last_viewed_at).toLocaleDateString('de-CH')}</span>
                      )}
                      <span>Erstellt: {new Date(t.created_at).toLocaleDateString('de-CH')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => copyLink(t.token, t.id)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors" title="Link kopieren">
                      {copiedId === t.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                    <a href={`/dashboard/${t.token}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-zinc-100 rounded-lg transition-colors" title="Öffnen">
                      <ExternalLink size={14} />
                    </a>
                    <button onClick={() => toggleToken(t.id, t.is_active)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors" title={t.is_active ? 'Deaktivieren' : 'Aktivieren'}>
                      {t.is_active ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} className="text-zinc-400" />}
                    </button>
                    <button onClick={() => deleteToken(t.id)} className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg transition-colors" title="Löschen">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {tokens.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-4">Noch keine Zugangslinks erstellt.</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Config Editor */}
      {config && (
        <section className="bg-white border rounded-lg p-6">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center justify-between w-full"
          >
            <h2 className="text-lg font-semibold">Dashboard Konfiguration</h2>
            {showConfig ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showConfig && (
            <div className="mt-4">
              <div className="flex justify-end mb-4">
                <button
                  onClick={saveConfig}
                  disabled={configSaving}
                  className="flex items-center gap-1.5 bg-zinc-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                >
                  {configSaved ? <Check size={14} /> : <Save size={14} />}
                  {configSaved ? 'Gespeichert' : configSaving ? 'Speichern...' : 'Speichern'}
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Account Name</label>
                  <input type="text" value={config.account_name || ''} onChange={(e) => setConfig({ ...config, account_name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Kontakt-Email</label>
                  <input type="email" value={config.contact_email || ''} onChange={(e) => setConfig({ ...config, contact_email: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Headline</label>
                  <input type="text" value={config.hero_headline || ''} onChange={(e) => setConfig({ ...config, hero_headline: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Subtext</label>
                  <input type="text" value={config.hero_subtext || ''} onChange={(e) => setConfig({ ...config, hero_subtext: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1">Bio</label>
                  <textarea value={config.account_bio || ''} onChange={(e) => setConfig({ ...config, account_bio: e.target.value })} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1">CTA Text</label>
                  <input type="text" value={config.contact_cta_text || ''} onChange={(e) => setConfig({ ...config, contact_cta_text: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <h3 className="text-sm font-semibold mb-3">Partner-Logos</h3>
              <div className="space-y-2 mb-3">
                {config.partner_logos.map((logo, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="text" value={logo.name} onChange={(e) => updatePartnerLogo(i, 'name', e.target.value)} placeholder="Name" className="w-32 border rounded-lg px-2 py-1.5 text-xs" />
                    <input type="text" value={logo.url} onChange={(e) => updatePartnerLogo(i, 'url', e.target.value)} placeholder="Website URL" className="flex-1 border rounded-lg px-2 py-1.5 text-xs" />
                    <input type="text" value={logo.image_url} onChange={(e) => updatePartnerLogo(i, 'image_url', e.target.value)} placeholder="Logo URL" className="flex-1 border rounded-lg px-2 py-1.5 text-xs" />
                    <button onClick={() => removePartnerLogo(i)} className="p-1.5 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addPartnerLogo} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors">
                <Plus size={12} /> Partner hinzufügen
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
