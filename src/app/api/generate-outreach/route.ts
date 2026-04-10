import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/auth'

const SYSTEM_PROMPT = `Du bist Pierre Biege, Gründer von "Läuft." — eine Agentur für digitale Systeme, Branding und AI-Integration im Wallis (Schweiz).

Dein Schreibstil:
- Direkt, freundlich, nicht aufdringlich
- Schweizerdeutsche Grussformel: "Beste Grüsse" (nicht "Liebe Grüsse")
- Du duzt Leute im Wallis (informelle Kultur)
- Kurz und prägnant — max 6-8 Sätze
- Kein Marketing-Bullshit, kein "revolutionär", kein "Game-Changer"
- Du zeigst dass du dich mit dem Unternehmen beschäftigt hast

Deine Services:
- Moderne Websites (Next.js, schnell, SEO-optimiert)
- AI-Integration für Geschäftsprozesse
- Branding & digitale Strategie
- Automatisierung (CRM, Rechnungen, Workflows)

Du sitzt in Albinen VS und arbeitest primär mit Unternehmen im Wallis.`

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const { prospectId, emailNumber } = await request.json()

    const { data: prospect, error } = await supabaseAdmin
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single()

    if (error || !prospect) {
      return NextResponse.json({ error: 'Prospect nicht gefunden' }, { status: 404 })
    }

    const client = new Anthropic()

    let userPrompt = ''

    if (emailNumber === 1) {
      userPrompt = `Schreibe eine kurze Kaltakquise-Mail an:
- Firma: ${prospect.company}
- Kontaktperson: ${prospect.contact_name}
- Website: ${prospect.website || 'keine bekannt'}
- Branche/Notizen: ${prospect.notes || 'keine'}
${prospect.prototype_url ? `- Prototyp den ich gebaut habe: ${prospect.prototype_url}` : ''}

Erstelle eine personalisierte Erstmail. Erwähne konkret was du an deren aktuellem Webauftritt verbessern könntest. Wenn ein Prototyp-Link vorhanden ist, verweise darauf.

Format:
BETREFF: [Betreffzeile]
---
[Mail-Text]`
    } else if (emailNumber === 2) {
      userPrompt = `Schreibe ein freundliches Follow-up (Mail #2) an:
- Firma: ${prospect.company}
- Kontaktperson: ${prospect.contact_name}
- Erstmail gesendet am: ${prospect.email_1_sent_at ? new Date(prospect.email_1_sent_at).toLocaleDateString('de-CH') : 'vor ein paar Tagen'}
${prospect.prototype_url ? `- Prototyp: ${prospect.prototype_url}` : ''}

Kurz nachhaken ob die erste Mail angekommen ist. Nicht aufdringlich.

Format:
BETREFF: [Betreffzeile]
---
[Mail-Text]`
    } else {
      userPrompt = `Schreibe ein letztes, abschliessendes Follow-up (Mail #3) an:
- Firma: ${prospect.company}
- Kontaktperson: ${prospect.contact_name}

Freundlich abschliessen, Tür offen lassen für die Zukunft. Kein Druck.

Format:
BETREFF: [Betreffzeile]
---
[Mail-Text]`
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = (response.content[0] as { type: string; text: string }).text

    // Parse subject and body
    const subjectMatch = text.match(/BETREFF:\s*(.+)/i)
    const bodyMatch = text.split(/---\n?/)

    const subject = subjectMatch?.[1]?.trim() || `Anfrage für ${prospect.contact_name}`
    const body = (bodyMatch[1] || text).trim()

    return NextResponse.json({ subject, body })
  } catch (err) {
    console.error('Generate outreach error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
