'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import type { DashboardConfig, DashboardToken, PartnerLogo } from '@/lib/instagram-types'

export default function InstagramAdminPage() {
  const [tokens, setTokens] = useState<DashboardToken[]>([])
  const [config, setConfig] = useState<DashboardConfig | null>(null)
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; result: string | null; error: string | null }>({
    loading: false,
    result: null,
    error: null,
  })
  const [newTokenLabel, setNewTokenLabel] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [configSaving, setConfigSaving] = useState(false)
  const [configSaved, setConfigSaved] = useState(false)

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

  async function triggerSync() {
    setSyncStatus({ loading: true, result: null, error: null })
    try {
      const res = await fetch('/api/instagram/sync', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSyncStatus({ loading: false, result: data.results?.join(', ') || 'Sync erfolgreich', error: null })
      } else {
        setSyncStatus({ loading: false, result: null, error: data.error || 'Sync fehlgeschlagen' })
      }
    } catch (e) {
      setSyncStatus({ loading: false, result: null, error: String(e) })
    }
  }

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

      {/* Sync Status */}
      <section className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Daten-Sync</h2>
          <button
            onClick={triggerSync}
            disabled={syncStatus.loading}
            className="flex items-center gap-2 bg-zinc-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={syncStatus.loading ? 'animate-spin' : ''} />
            {syncStatus.loading ? 'Sync läuft...' : 'Jetzt synchronisieren'}
          </button>
        </div>
        {syncStatus.result && (
          <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded">{syncStatus.result}</p>
        )}
        {syncStatus.error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{syncStatus.error}</p>
        )}
        <p className="text-xs text-zinc-500 mt-2">
          Automatischer Sync: täglich um 03:00 UTC via Vercel Cron. Instagram API Token muss alle 60 Tage erneuert werden.
        </p>
      </section>

      {/* Token Manager */}
      <section className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Zugangslinks</h2>

        {/* Create new token */}
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

        {/* Token list */}
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
                <button
                  onClick={() => copyLink(t.token, t.id)}
                  className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                  title="Link kopieren"
                >
                  {copiedId === t.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
                <a
                  href={`/dashboard/${t.token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                  title="Öffnen"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => toggleToken(t.id, t.is_active)}
                  className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                  title={t.is_active ? 'Deaktivieren' : 'Aktivieren'}
                >
                  {t.is_active ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} className="text-zinc-400" />}
                </button>
                <button
                  onClick={() => deleteToken(t.id)}
                  className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg transition-colors"
                  title="Löschen"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {tokens.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4">Noch keine Zugangslinks erstellt.</p>
          )}
        </div>
      </section>

      {/* Config Editor */}
      {config && (
        <section className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Dashboard Konfiguration</h2>
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
              <input
                type="text"
                value={config.account_name || ''}
                onChange={(e) => setConfig({ ...config, account_name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Kontakt-Email</label>
              <input
                type="email"
                value={config.contact_email || ''}
                onChange={(e) => setConfig({ ...config, contact_email: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Headline</label>
              <input
                type="text"
                value={config.hero_headline || ''}
                onChange={(e) => setConfig({ ...config, hero_headline: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Subtext</label>
              <input
                type="text"
                value={config.hero_subtext || ''}
                onChange={(e) => setConfig({ ...config, hero_subtext: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Bio</label>
              <textarea
                value={config.account_bio || ''}
                onChange={(e) => setConfig({ ...config, account_bio: e.target.value })}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">CTA Text</label>
              <input
                type="text"
                value={config.contact_cta_text || ''}
                onChange={(e) => setConfig({ ...config, contact_cta_text: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Partner Logos */}
          <h3 className="text-sm font-semibold mb-3">Partner-Logos</h3>
          <div className="space-y-2 mb-3">
            {config.partner_logos.map((logo, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={logo.name}
                  onChange={(e) => updatePartnerLogo(i, 'name', e.target.value)}
                  placeholder="Name"
                  className="w-32 border rounded-lg px-2 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={logo.url}
                  onChange={(e) => updatePartnerLogo(i, 'url', e.target.value)}
                  placeholder="Website URL"
                  className="flex-1 border rounded-lg px-2 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={logo.image_url}
                  onChange={(e) => updatePartnerLogo(i, 'image_url', e.target.value)}
                  placeholder="Logo URL"
                  className="flex-1 border rounded-lg px-2 py-1.5 text-xs"
                />
                <button
                  onClick={() => removePartnerLogo(i)}
                  className="p-1.5 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addPartnerLogo}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <Plus size={12} /> Partner hinzufügen
          </button>
        </section>
      )}
    </div>
  )
}
