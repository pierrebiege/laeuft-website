import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Du bist ein Assistent der aus Nachrichten (Instagram DMs, E-Mails, Textnachrichten etc.) und Screenshots Partner-Daten extrahiert. Du kannst auch Bilder/Screenshots analysieren und daraus Informationen extrahieren (z.B. Instagram DM Screenshots, E-Mail Screenshots, Visitenkarten etc.).

Extrahiere folgende Felder aus dem Text. Wenn ein Feld nicht gefunden wird, lass es leer (leerer String oder null).

Felder:
- name: Name des Partners/Brands/Unternehmens (PFLICHTFELD - wenn nicht erkennbar, verwende den Absendernamen)
- partner_type: Einer von: "Brand", "Athlete", "Team", "Verband" (Standard: "Brand")
- category: Einer von: "Sports", "Tech", "Lifestyle", "Nutrition", "Fashion", "Travel", "Finance", "Health", "Media", "Other" (versuche eine passende Kategorie zu erkennen)
- collaboration_types: Array von passenden Typen: "Sponsoring", "Ambassador", "Product Placement", "Event", "Barter Deal", "Content Creation", "Affiliate", "Sonstiges" (erkenne aus dem Kontext)
- contact_first_name: Vorname der Kontaktperson
- contact_last_name: Nachname der Kontaktperson
- contact_position: Position/Rolle der Person
- contact_email: E-Mail-Adresse
- contact_website: Webseite URL
- instagram: Instagram-Handle (mit @)
- source: Woher kam der Kontakt (z.B. "Instagram DM", "E-Mail", "Event" etc.)
- value: Geschätzter Deal-Wert falls erwähnt (z.B. "CHF 2'500")
- notes: Kurze Zusammenfassung des Anliegens/der Nachricht (2-3 Sätze max)
- tags: Array von relevanten Tags (z.B. ["running", "swiss", "outdoor"])
- status: Standard "Lead"
- formatted_history: Die Originalnachricht(en) aufgeräumt und formatiert als lesbarer Verlauf. Entferne überflüssige E-Mail-Header, Gmail-UI-Text, Signaturen-Wiederholungen etc. Formatiere als sauberen Verlauf mit klarer Trennung zwischen einzelnen Nachrichten. Format pro Nachricht:
  "[Datum] [Absender]:\n[Nachrichtentext]\n"
  Trenne mehrere Nachrichten mit "---". Behalte den wichtigen Inhalt, entferne nur technischen Müll.

Antworte NUR mit einem validen JSON-Objekt. Keine Erklärungen, kein Markdown, nur JSON.
Beispiel-Antwort:
{
  "name": "DRYLL",
  "partner_type": "Brand",
  "category": "Sports",
  "collaboration_types": ["Sponsoring", "Ambassador"],
  "contact_first_name": "Max",
  "contact_last_name": "Müller",
  "contact_position": "Marketing Manager",
  "contact_email": "max@dryll.ch",
  "contact_website": "https://dryll.ch",
  "instagram": "@dryll_sports",
  "source": "Instagram DM",
  "value": "",
  "notes": "Anfrage für Zusammenarbeit als Ambassador. Interessiert an Content Creation für Social Media.",
  "tags": ["sports", "ambassador"],
  "status": "Lead",
  "formatted_history": "23.10.2025 Max Müller:\nHey Pierre, wir würden gerne mit dir zusammenarbeiten als Ambassador für unsere neue Kollektion.\n\n---\n\n30.10.2025 Max Müller:\nHi Pierre, kurze Nachfrage ob du meine letzte Nachricht gesehen hast?"
}`

export async function POST(request: NextRequest) {
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
