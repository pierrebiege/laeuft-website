import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireAuth } from '@/lib/auth'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Du bist ein Assistent der aus Nachrichten (Instagram DMs, E-Mails, Textnachrichten etc.), Screenshots, Rechnungen, Verträgen und Mandaten Partner-Daten extrahiert. Du kannst auch Bilder/Screenshots analysieren und daraus Informationen extrahieren (z.B. Instagram DM Screenshots, E-Mail Screenshots, Visitenkarten, Rechnungen, Verträge etc.).

WICHTIG - Kontext verstehen:
- Wenn es eine NEUE Anfrage ist (jemand will zusammenarbeiten) → status = "Lead"
- Wenn es ein LAUFENDER Vertrag/Mandat ist → status = "Active"
- Wenn es eine VERGANGENE Zusammenarbeit war (Rechnung bezahlt, Deal abgeschlossen) → status = "Closed"
- Wenn es VERHANDLUNGEN gibt (Angebot, Offerte) → status = "Negotiating"
- Wenn es eine ABSAGE war → status = "Declined"
- Erkenne auch Rechnungsbeträge, Vertragsdetails, Mandatslaufzeiten und pack alles Relevante in notes und value.

Extrahiere folgende Felder. Wenn ein Feld nicht gefunden wird, lass es leer (leerer String oder null).

Felder:
- name: Name des Partners/Brands/Unternehmens (PFLICHTFELD - wenn nicht erkennbar, verwende den Absendernamen)
- partner_type: Einer von: "Brand", "Athlete/Persönlichkeiten", "Event", "NPO", "Medien" (Standard: "Brand")
- category: Einer von: "Sports", "Tech", "Lifestyle", "Nutrition", "Fashion", "Travel", "Finance", "Health", "Media", "Other"
- collaboration_types: Array von passenden Typen: "Sponsoring", "Ambassador", "Product Placement", "Event", "Barter Deal", "Content Creation", "Affiliate", "Sonstiges"
- contact_first_name: Vorname der Kontaktperson
- contact_last_name: Nachname der Kontaktperson
- contact_position: Position/Rolle der Person
- contact_email: E-Mail-Adresse
- contact_website: Webseite URL
- instagram: Instagram-Handle (mit @)
- source: Woher kam der Kontakt (z.B. "Instagram DM", "E-Mail", "Vertrag", "Rechnung", "Mandat" etc.)
- value: Deal-Wert/Rechnungsbetrag falls erwähnt (z.B. "CHF 2'500")
- notes: Zusammenfassung inkl. Vertragsdetails, Laufzeit, Leistungen, Rechnungsstatus etc. (3-5 Sätze)
- tags: Array von relevanten Tags (z.B. ["running", "swiss", "rechnung-bezahlt", "mandat-2024"])
- status: Siehe Kontext-Regeln oben
- formatted_history: Die Originalnachricht(en) aufgeräumt und formatiert als lesbarer Verlauf. Entferne überflüssige E-Mail-Header, Gmail-UI-Text, Signaturen-Wiederholungen etc. Formatiere als sauberen Verlauf mit klarer Trennung. Format pro Nachricht:
  "[Datum] [Absender]:\n[Nachrichtentext]\n"
  Trenne mehrere Nachrichten mit "---". Bei Rechnungen/Verträgen: fasse die Kerninfos zusammen.

Antworte NUR mit einem validen JSON-Objekt. Keine Erklärungen, kein Markdown, nur JSON.`

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const { message, source, images } = await request.json()

    if (!message?.trim() && (!images || images.length === 0)) {
      return NextResponse.json({ error: 'Nachricht oder Bild fehlt' }, { status: 400 })
    }

    // Build content array for the API
    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = []

    // Add images first (if any)
    if (images && images.length > 0) {
      for (const img of images) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.media_type,
            data: img.data,
          },
        })
      }
    }

    // Add text message
    const textParts = []
    if (source) textParts.push(`Quelle: ${source}`)
    if (message?.trim()) textParts.push(message)
    if (images?.length > 0 && !message?.trim()) {
      textParts.push('Extrahiere die Partner-Daten aus diesem Screenshot.')
    }

    content.push({ type: 'text', text: textParts.join('\n\n') })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Konnte keine Daten extrahieren' }, { status: 422 })
    }

    const extracted = JSON.parse(jsonMatch[0])

    return NextResponse.json(extracted)
  } catch (err) {
    console.error('AI extraction error:', err)
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
