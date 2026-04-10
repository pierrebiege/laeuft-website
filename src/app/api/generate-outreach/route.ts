import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/auth'

const SYSTEM_PROMPT = `Du bist Pierre Biege. Cold Outreach für "Läuft." — Agentur für Websites, AI-Integration, digitale Systeme. Albinen VS. https://laeuft.ch

GOLDENE REGELN:
1. BETREFF: 3-7 Wörter. Konkret. Bezug zum Empfänger. Kein Clickbait. z.B. "Idee für [Firma]" oder "Kurze Frage zu [Thema]"
2. ERSTER SATZ: Über SIE. Nie über dich. Zeige dass du recherchiert hast.
3. KERN: 2-3 Sätze konkreter Wert. Kein Feature-Listing. Ein Ergebnis oder eine Beobachtung.
4. CTA: Genau EINE Frage. Niedrige Hürde. "Lohnt sich ein kurzer Austausch?" oder "15 Min reichen."
5. LÄNGE: 80-120 Wörter Erstmail. 60-80 Follow-up. 40-60 Breakup. Auf dem Handy ohne Scrollen lesbar.
6. SIGNATUR: Beste Grüsse, Pierre Biege, https://laeuft.ch

VERBOTEN: "Ich bin Pierre Biege", Firmenvorstellung, mehrere CTAs, Anhänge, "revolutionär", "Game-Changer", "innovativ", "Ich hoffe diese Mail findet dich gut", übertriebene Höflichkeit.

STIL: Mensch, nicht Agentur. Duzen. Konkret. Greifbar. Jeder Satz hat einen Zweck.
- Signatur: Beste Grüsse, Pierre Biege, https://laeuft.ch

REFERENZ:
"Eure Weinkarte online ist ein PDF aus 2019 — ich hab mir vorgestellt wie das als interaktive Seite aussehen könnte. Hier der Entwurf: [link]. Was meinst du?"`

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

    const firstName = prospect.contact_name.split(' ')[0]

    if (emailNumber === 1) {
      userPrompt = `ERSTMAIL an ${firstName} von ${prospect.company}.
${prospect.website ? `Website: ${prospect.website}` : 'Keine Website bekannt.'}
${prospect.notes ? `Research: ${prospect.notes}` : ''}
${prospect.prototype_url ? `Prototyp gebaut: ${prospect.prototype_url}` : ''}

REGELN:
- Erster Satz: Zeige dass du DEREN Geschäft kennst. Ein konkretes Detail.
- Kern: 2-3 Sätze konkreter Wert. Ein Ergebnis oder eine Beobachtung.
- Falls Prototyp: "Ich hab mir eure Website angeschaut und einen kurzen Entwurf gemacht" + Link
- CTA: EINE Frage, niedrige Hürde. "Lohnt sich ein kurzer Austausch?" oder "15 Min reichen."
- STRIKT 80-120 Wörter. Auf dem Handy ohne Scrollen lesbar.
- VERBOTEN: Selbstvorstellung, mehrere CTAs, Höflichkeitsfloskeln

Format:
BETREFF: [3-7 Wörter, Bezug zum Empfänger]
---
[Mail-Text, 80-120 Wörter, dann Signatur]`
    } else if (emailNumber === 2) {
      userPrompt = `FOLLOW-UP #1 an ${firstName} von ${prospect.company}.
Erstmail: ${prospect.email_1_sent_at ? new Date(prospect.email_1_sent_at).toLocaleDateString('de-CH') : 'vor ein paar Tagen'}
${prospect.prototype_url ? `Prototyp: ${prospect.prototype_url}` : ''}

REGELN:
- NICHT "wollte nachhaken" — bringe NEUEN Wert: Beobachtung, Insight, Quick-Win
- Beiläufig die letzte Mail erwähnen
- EINE Ja/Nein-Frage am Ende
- STRIKT 60-80 Wörter.

Format:
BETREFF: [3-5 Wörter]
---
[Mail-Text, 60-80 Wörter, dann Signatur]`
    } else {
      userPrompt = `BREAKUP-MAIL an ${firstName} von ${prospect.company}.

REGELN:
- Ehrlich, menschlich. Kein Druck.
- Tür offen für die Zukunft.
- STRIKT 40-60 Wörter. 3-4 Sätze.

Format:
BETREFF: [3-4 Wörter]
---
[Mail-Text, 40-60 Wörter, dann Signatur]`
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
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
