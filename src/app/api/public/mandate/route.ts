import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Public, token-authorized mandate endpoint (replaces the former anon access on
 * mandates + all mandate_* sub-tables + clients).
 *
 * GET  ?token=...                  -> full mandate with nested relations
 * POST { token, action }           -> token-scoped mutations a customer may do:
 *        action: 'contact'         -> update this mandate's client contact fields
 *        action: 'accept'          -> accept/reject a chosen option
 *        action: 'cancel'          -> request cancellation
 *
 * The token is the authorization. We always resolve the mandate FROM the token
 * server-side and only ever touch that mandate / its own client — so (unlike the
 * old anon path) nobody can mutate an arbitrary record by guessing an id.
 */

const SELECT = `
  *,
  client:clients(*),
  pricing_phases:mandate_pricing_phases(*),
  sections:mandate_sections(*, items:mandate_section_items(*)),
  options:mandate_options(*),
  mandate_invoices(*, invoice:invoices(*)),
  systems:mandate_systems(*)
`

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ data: null, error: 'Token fehlt' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('mandates')
    .select(SELECT)
    .eq('unique_token', token)
    .single()

  if (error || !data) {
    return NextResponse.json({ data: null, error: 'Mandat nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json({ data, error: null })
}

export async function POST(request: NextRequest) {
  let body: { token?: string; action?: string; contact?: { name?: string; email?: string; company?: string }; optionId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })
  }

  const { token, action } = body
  if (!token || !action) {
    return NextResponse.json({ error: 'Token oder Aktion fehlt' }, { status: 400 })
  }

  // Resolve the mandate (and its options) strictly from the token.
  const { data: mandate, error: loadError } = await supabaseAdmin
    .from('mandates')
    .select('id, client_id, cancellation_period, options:mandate_options(id, is_rejection)')
    .eq('unique_token', token)
    .single()

  if (loadError || !mandate) {
    return NextResponse.json({ error: 'Mandat nicht gefunden' }, { status: 404 })
  }

  if (action === 'contact') {
    const c = body.contact || {}
    if (!c.name || !c.email) {
      return NextResponse.json({ error: 'Name und E-Mail erforderlich' }, { status: 400 })
    }
    const { error } = await supabaseAdmin
      .from('clients')
      .update({ name: c.name, email: c.email, company: c.company || null })
      .eq('id', mandate.client_id)
    if (error) return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'accept') {
    const optionId = body.optionId
    const options = (mandate.options as { id: string; is_rejection: boolean }[]) || []
    const chosen = options.find((o) => o.id === optionId)
    if (!chosen) {
      return NextResponse.json({ error: 'Ungültige Auswahl' }, { status: 400 })
    }
    const { error } = await supabaseAdmin
      .from('mandates')
      .update({
        accepted_option_id: chosen.id,
        accepted_at: new Date().toISOString(),
        status: chosen.is_rejection ? 'rejected' : 'accepted',
        start_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', mandate.id)
    if (error) return NextResponse.json({ error: 'Fehler beim Speichern der Auswahl' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'cancel') {
    const monthsMatch = String(mandate.cancellation_period || '').match(/(\d+)/)
    const months = monthsMatch ? parseInt(monthsMatch[1]) : 3
    const effectiveDate = new Date()
    effectiveDate.setMonth(effectiveDate.getMonth() + months)
    const { error } = await supabaseAdmin
      .from('mandates')
      .update({
        status: 'cancelling',
        cancelled_at: new Date().toISOString(),
        cancellation_effective_date: effectiveDate.toISOString().split('T')[0],
      })
      .eq('id', mandate.id)
    if (error) return NextResponse.json({ error: 'Fehler beim Kündigen' }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unbekannte Aktion' }, { status: 400 })
}
