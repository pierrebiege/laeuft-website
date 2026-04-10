import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/auth'

const SYSTEM_PROMPT = `Du bist Pierre Biege. Du schreibst Cold Outreach Mails für deine Agentur "Läuft." im Wallis.

ÜBER DICH:
- Agentur "Läuft." — moderne Websites, AI-Integration, digitale Systeme
- Sitz in Albinen VS, arbeitest mit KMU in der ganzen Schweiz
- Website: https://laeuft.ch

DEIN STIL — DAS MACHT DEINE MAILS ANDERS:
- Du schreibst wie ein Mensch, nicht wie eine Agentur. Kein Corporate-Deutsch.
- Du duzt (Walliser Kultur), aber respektvoll
- Jeder Satz hat einen Zweck. Kein Fülltext. Kein "Ich hoffe diese Mail findet dich gut."
- Du zeigst dass du dich WIRKLICH mit dem Unternehmen beschäftigt hast
- Du verkaufst nicht — du bietest Wert an und stellst eine Frage
- Du schreibst so kurz wie möglich, so lang wie nötig
- Kein "revolutionär", "Game-Changer", "innovativ", "Digitalisierung vorantreiben"
- Stattdessen: konkret, greifbar, menschlich

STRUKTUR JEDER MAIL:
- Betreff: Max 6 Wörter. Persönlich. Neugierig machend. Kein Clickbait.
- Erster Satz: Über SIE, nicht über dich
- Mitte: Konkreter Wert oder Beobachtung
- Ende: Eine einfache Frage oder nächster Schritt
- Signatur: Beste Grüsse, Pierre Biege, https://laeuft.ch

BEISPIEL-LEVEL DAS DU ANSTREBST:
"Eure Weinkarte online ist ein PDF aus 2019 — ich hab mir vorgestellt wie das als interaktive Seite mit Weinempfehlungen aussehen könnte. Hier der Entwurf: [link]. Was meinst du?"

DAS ist das Level. Spezifisch. Visuell. Niedrigschwellig.`

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
      userPrompt = `ERSTMAIL an ${prospect.contact_name.split(' ')[0]} von ${prospect.company}.
${prospect.website ? `Deren Website: ${prospect.website}` : 'Keine Website bekannt.'}
${prospect.notes ? `Research-Notizen: ${prospect.notes}` : ''}
${prospect.prototype_url ? `Ich habe bereits einen Prototyp gebaut: ${prospect.prototype_url}` : ''}

Schreibe eine Erstmail die folgendes leistet:
1. HOOK: Erster Satz muss zeigen dass du DEREN Geschäft verstehst — nenne etwas Spezifisches über die Firma
2. PAIN: Benenne EIN konkretes Problem das du bei deren digitalem Auftritt siehst — sei präzise
3. VISION: Male in 1-2 Sätzen das Bild wie es BESSER sein könnte
4. PROOF: Falls Prototyp-Link vorhanden, sage "Ich habe mir die Freiheit genommen und einen Entwurf erstellt" + Link
5. CTA: Einfache, niedrigschwellige Frage — "Hast du 15 Minuten diese Woche?"
6. SIGNATUR: Beste Grüsse, Pierre Biege, https://laeuft.ch

VERBOTEN: "Ich bin Pierre Biege und...", Selbstvorstellung am Anfang.

Format:
BETREFF: [Max 6 Wörter, persönlich, neugierig machend]
---
[Mail-Text]`
    } else if (emailNumber === 2) {
      userPrompt = `FOLLOW-UP #1 an ${prospect.contact_name.split(' ')[0]} von ${prospect.company}.
Erstmail gesendet am: ${prospect.email_1_sent_at ? new Date(prospect.email_1_sent_at).toLocaleDateString('de-CH') : 'vor ein paar Tagen'}
${prospect.prototype_url ? `Prototyp: ${prospect.prototype_url}` : ''}

Schreibe ein Follow-up das:
1. NICHT mit "Ich wollte nur mal nachhaken" anfängt
2. Stattdessen: Bringe einen NEUEN Mehrwert — einen konkreten Tipp oder Quick-Win-Idee
3. Erwähne beiläufig die letzte Mail
4. Schliesse mit einer einfachen Ja/Nein-Frage

Max 4-5 Sätze. Kurz. Kein Druck.

Format:
BETREFF: [Kurz und persönlich]
---
[Mail-Text mit Signatur]`
    } else {
      userPrompt = `LETZTES FOLLOW-UP an ${prospect.contact_name.split(' ')[0]} von ${prospect.company}.

Schreibe eine Breakup-Mail die:
1. Ehrlich und menschlich ist — "Ich will dich nicht nerven"
2. Respektiert dass jetzt nicht der richtige Zeitpunkt ist
3. Die Tür offen lässt für die Zukunft
4. KURZ ist — 3-4 Sätze maximal

Format:
BETREFF: [Kurz, ehrlich]
---
[Mail-Text mit Signatur]`
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
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
