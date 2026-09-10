import { jsPDF } from '/Users/pierrebiege/Documents/laeuft/laeuft-website/node_modules/jspdf/dist/jspdf.node.min.js'
import { writeFileSync } from 'fs'

const business = {
  name: 'Pierre Biege',
  company: 'Läuft. Digital Systems & Branding',
  street: 'Tschangaladongastrasse 3',
  location: '3955 Albinen',
  email: 'pierre@laeuft.ch',
  phone: '079 853 36 72',
  website: 'laeuft.ch',
  iban: 'CH72 8080 8007 8508 8887 5',
}

const INVOICE_NO = '2026-020'
const ISSUE = '10.09.2026'
const DUE = '20.09.2026'
const POS_1 = 1750
// 10 % auf den Netto-Warenwert: Q2 2026 EUR 3'509.17 + Juli 2026 EUR 3'389.30 = EUR 6'898.47
const POS_2 = 689.85
const TOTAL = POS_1 + POS_2
const eur = (n) => 'EUR ' + n.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/’/g, "'")

const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
const pageWidth = 210
const margin = 20
const contentWidth = pageWidth - 2 * margin
let y = margin

// ===== Kopf =====
doc.setFontSize(24); doc.setFont('helvetica', 'bold')
doc.text('Läuft.', margin, y)
doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(128, 128, 128)
doc.text('Digital Systems & Branding', margin, y + 6)
doc.text('Rechnung', pageWidth - margin, y, { align: 'right' })
doc.setTextColor(0, 0, 0); doc.setFontSize(16); doc.setFont('helvetica', 'bold')
doc.text(INVOICE_NO, pageWidth - margin, y + 6, { align: 'right' })

// ===== Absender / Empfänger =====
y += 30
doc.setTextColor(128, 128, 128); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
doc.text('VON', margin, y); doc.text('AN', margin + 80, y)
y += 5
doc.setTextColor(0, 0, 0); doc.setFontSize(10); doc.setFont('helvetica', 'bold')
doc.text(business.name, margin, y)
doc.setFont('helvetica', 'normal')
doc.text(business.street, margin, y + 5)
doc.text(business.location, margin, y + 10)
doc.text('Schweiz', margin, y + 15)
doc.text(business.email, margin, y + 22)

doc.setFont('helvetica', 'bold')
doc.text('Joe Nimble GmbH', margin + 80, y)
doc.setFont('helvetica', 'normal')
doc.text('Kammererstr. 37', margin + 80, y + 5)
doc.text('71636 Ludwigsburg', margin + 80, y + 10)
doc.text('Deutschland', margin + 80, y + 15)

// ===== Daten =====
y += 35
doc.setFontSize(10); doc.setTextColor(128, 128, 128)
doc.text('Rechnungsdatum:', margin, y)
doc.setTextColor(0, 0, 0); doc.text(ISSUE, margin + 35, y)
doc.setTextColor(128, 128, 128); doc.text('Fällig am:', margin + 70, y)
doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'bold'); doc.text(DUE, margin + 90, y)
doc.setFont('helvetica', 'normal')
y += 6
doc.setTextColor(128, 128, 128); doc.text('Leistungszeitraum:', margin, y)
doc.setTextColor(0, 0, 0); doc.text('Mai – Juli 2026', margin + 35, y)

// ===== Titel =====
y += 13
doc.setFontSize(14); doc.setFont('helvetica', 'bold')
doc.text('Werbe- und Marketingpartnerschaft Joe Nimble × Pierre Biege', margin, y)
y += 6
doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
doc.text('Fixhonorar Rate 1 sowie Affiliate-Provision Q2 und Juli 2026', margin, y)
doc.setTextColor(0, 0, 0)

// ===== Tabellenkopf =====
y += 10
doc.setFillColor(249, 250, 251)
doc.rect(margin, y, contentWidth, 8, 'F')
doc.setFontSize(8); doc.setTextColor(128, 128, 128); doc.setFont('helvetica', 'bold')
doc.text('BESCHREIBUNG', margin + 2, y + 5)
doc.text('MENGE', margin + 100, y + 5, { align: 'right' })
doc.text('PREIS', margin + 133, y + 5, { align: 'right' })
doc.text('BETRAG', margin + contentWidth - 2, y + 5, { align: 'right' })
y += 10

const posLine = (label, amount) => {
  doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0); doc.setFontSize(10)
  doc.text(label, margin + 2, y + 4)
  doc.text('1', margin + 100, y + 4, { align: 'right' })
  doc.text(eur(amount), margin + 133, y + 4, { align: 'right' })
  doc.text(eur(amount), margin + contentWidth - 2, y + 4, { align: 'right' })
  y += 10
}
const bullets = (lines) => {
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 100, 100)
  for (const [line, italic] of lines) {
    doc.setFont('helvetica', italic ? 'italic' : 'normal')
    doc.text(line, margin + 4, y); y += 4.4
  }
  doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0)
}

// ===== Position 1 =====
posLine('Fixhonorar – Rate 1 von 2', POS_1)
bullets([
  ['• Erste Quartalsrate gemäss § 5 (1) des Werbe- und Marketingvertrags', 0],
  ['  Joe Nimble × Pierre Biege vom 15.05.2026', 0],
  ['• Vertraglicher Zahlungstermin: 30.06.2026', 0],
  ['• Abgegoltene Leistungen: Social-Media-Beiträge, Produktvideos, Affiliate-Platzierung', 0],
  ['  auf laeuft.ch/joenimble sowie exklusives Tragen der Joe-Nimble-Produkte', 0],
])

// ===== Position 2 =====
y += 4
posLine('Affiliate-Provision – Q2 2026 und Juli 2026', POS_2)
bullets([
  ['• 10 % auf den Netto-Warenwert gemäss § 5 (2) des Werbe- und Marketingvertrags', 0],
  ['• Q2 2026: Code 25× eingelöst (3× Mai, 22× Juni)', 0],
  ['  Umsatz EUR 4\'550.35 – Retouren/Gutschriften EUR 1\'041.81 = netto EUR 3\'509.17', 0],
  ['• Juli 2026: 48 Bestellungen', 0],
  ['  Umsatz EUR 4\'437.54 – Retouren/Gutschriften EUR 1\'048.24 = netto EUR 3\'389.30', 0],
  ['• Bemessungsgrundlage gesamt: EUR 6\'898.47', 0],
  ['• Grundlage: Abrechnung Joe Nimble vom 09.09.2026', 0],
])

// ===== Total =====
y += 6
doc.setDrawColor(240, 240, 240); doc.setLineWidth(0.2)
doc.line(margin, y - 2, margin + contentWidth, y - 2)
y += 3
doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.5)
doc.line(margin + 100, y, margin + contentWidth, y)
y += 8
doc.setFontSize(12); doc.setFont('helvetica', 'bold')
doc.text('Total', margin + 100, y)
doc.text(eur(TOTAL), margin + contentWidth - 2, y, { align: 'right' })

// ===== Steuerhinweis =====
y += 10
doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100)
doc.text(doc.splitTextToSize('Der ausgewiesene Betrag enthält keine Umsatzsteuer. Leistung eines Unternehmens mit Sitz in der Schweiz; die Steuerschuldnerschaft geht auf den Leistungsempfänger über (Reverse-Charge-Verfahren, § 13b UStG). Der Leistungserbringer ist in der Schweiz nicht mehrwertsteuerpflichtig (Umsatz unter der Eintragungsgrenze von CHF 100 000, Art. 10 Abs. 2 lit. a MWSTG).', contentWidth), margin, y)

// ===== Zahlungsangaben =====
y = 252
doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3)
doc.line(margin, y, margin + contentWidth, y)
y += 7
doc.setFontSize(9); doc.setTextColor(128, 128, 128)
doc.text('Zahlbar an:', margin, y)
doc.setTextColor(0, 0, 0)
doc.text('Kontoinhaber: Pierre-Laurent Biege', margin + 25, y)
doc.text(`IBAN: ${business.iban}`, margin + 25, y + 5)
doc.text('BIC: RAIFCH22XXX', margin + 25, y + 10)
doc.setTextColor(128, 128, 128); doc.setFontSize(8.5)
doc.text('Zahlbar innert 10 Tagen. Gebührenoption OUR, damit der Rechnungsbetrag vollständig gutgeschrieben wird.', margin + 25, y + 16)
doc.setTextColor(0, 0, 0)

// ===== Footer =====
y = 285
doc.setFontSize(8); doc.setTextColor(128, 128, 128)
doc.text(`${business.name} | ${business.company} | ${business.street} | ${business.location}`, pageWidth / 2, y, { align: 'center' })
doc.text(`${business.phone} | ${business.email} | ${business.website}`, pageWidth / 2, y + 4, { align: 'center' })

const buf = doc.output('arraybuffer')
const out = `/Users/pierrebiege/Downloads/Rechnung-${INVOICE_NO}-Laeuft-JoeNimble.pdf`
writeFileSync(out, Buffer.from(buf))
console.log('PDF:', out, Math.round(buf.byteLength / 1024) + ' KB, Seiten:', doc.getNumberOfPages())
