import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

const business = {
  name: "Pierre Biege",
  street: "Tschangaladongastrasse 3",
  location: "3955 Albinen",
  email: "pierre@laeuft.ch",
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    // Get mandate with all relations
    const { data: mandate, error } = await supabase
      .from('mandates')
      .select(`
        *,
        client:clients(*),
        sections:mandate_sections(*, items:mandate_section_items(*)),
        options:mandate_options(*),
        systems:mandate_systems(*)
      `)
      .eq('unique_token', token)
      .single()

    if (error || !mandate) {
      return NextResponse.json({ error: 'Mandate not found' }, { status: 404 })
    }

    // Sort data
    mandate.sections = mandate.sections?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order) || []
    mandate.sections.forEach((section: { items: { sort_order: number }[] }) => {
      section.items = section.items?.sort((a, b) => a.sort_order - b.sort_order) || []
    })
    mandate.options = mandate.options?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order) || []
    mandate.systems = mandate.systems?.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order) || []

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = 210
    const pageHeight = 297
    const margin = 25
    const contentWidth = pageWidth - 2 * margin
    let y = margin

    const formatDate = () => {
      return new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })
    }

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin) {
        doc.addPage()
        y = margin
        // Add header on new page
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text('Läuft.', margin, y)
        y += 15
      }
    }

    // === PAGE 1 ===

    // Header
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('Läuft.', margin, y)

    // Right side info
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(business.name, pageWidth - margin, y, { align: 'right' })
    doc.text(business.street, pageWidth - margin, y + 4, { align: 'right' })
    doc.text(business.location, pageWidth - margin, y + 8, { align: 'right' })
    doc.text(formatDate(), pageWidth - margin, y + 16, { align: 'right' })

    y += 30

    // Title
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(mandate.title, contentWidth)
    doc.text(titleLines, margin, y)
    y += titleLines.length * 8 + 5

    // Introduction
    if (mandate.introduction) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      const clientName = mandate.client.company || mandate.client.name
      const introText = `Für ${clientName}. ${mandate.introduction}`
      const introLines = doc.splitTextToSize(introText, contentWidth)
      doc.text(introLines, margin, y)
      y += introLines.length * 5 + 8
    }

    // Tagline
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, margin + contentWidth, y)
    y += 6
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'bold')
    doc.text('Läuft.', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(' arbeitet mit maximal drei Partnern. Keine Agentur, kein Massengeschäft – dafür echte Verfügbarkeit und Fokus.', margin + 12, y)
    y += 15

    // Sections
    for (const section of mandate.sections) {
      checkPageBreak(30)

      // Section label
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(100, 100, 100)
      doc.text(section.label.toUpperCase(), margin, y)
      y += 5

      // Section description
      if (section.description) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(60, 60, 60)
        doc.text(section.description, margin, y)
        y += 6
      }

      // Section items
      for (const item of section.items || []) {
        checkPageBreak(8)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(item.title, margin, y)
        if (item.detail) {
          doc.setTextColor(100, 100, 100)
          doc.text(item.detail, pageWidth - margin, y, { align: 'right' })
        }
        y += 6
        doc.setDrawColor(230, 230, 230)
        doc.line(margin, y - 2, margin + contentWidth, y - 2)
      }
      y += 8
    }

    // Systems
    if (mandate.systems && mandate.systems.length > 0) {
      checkPageBreak(30)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(100, 100, 100)
      doc.text('SYSTEME', margin, y)
      y += 6

      for (const system of mandate.systems) {
        checkPageBreak(8)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(system.name, margin, y)
        if (system.technology) {
          doc.setTextColor(100, 100, 100)
          doc.text(system.technology, pageWidth - margin, y, { align: 'right' })
        }
        y += 6
        doc.setDrawColor(230, 230, 230)
        doc.line(margin, y - 2, margin + contentWidth, y - 2)
      }
      y += 8
    }

    // Conditions
    checkPageBreak(40)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 100, 100)
    doc.text('KONDITIONEN', margin, y)
    y += 8

    const conditions = [
      { label: mandate.cancellation_period, desc: 'Kündigungsfrist (beidseitig)' },
      { label: 'Garantiert', desc: 'Verfügbarkeit durch Stellvertretung' },
      { label: 'Monatlich', desc: 'Rechnung am Tag des Vertragsabschlusses' },
    ]

    const colWidth = contentWidth / 3
    conditions.forEach((cond, i) => {
      const x = margin + i * colWidth
      doc.setDrawColor(180, 180, 180)
      doc.line(x, y, x + colWidth - 5, y)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(cond.label, x, y + 7)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(cond.desc, x, y + 12)
    })
    y += 25

    // === PAGE 2 - Notes & Options ===
    doc.addPage()
    y = margin

    // Header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Läuft.', margin, y)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(mandate.title, pageWidth - margin, y, { align: 'right' })
    y += 20

    // Notes
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 100, 100)
    doc.text('HINWEISE ZU DEN KONDITIONEN', margin, y)
    y += 6

    const notes = [
      { title: 'Kündigungsfrist:', text: `Das Mandat kann von beiden Seiten mit einer Frist von ${mandate.cancellation_period} gekündigt werden.` },
      { title: 'Verfügbarkeit:', text: 'Ferien werden im Voraus kommuniziert. In dieser Zeit wird die Arbeit durch einen qualifizierten Stellvertreter sichergestellt.' },
      { title: 'Leistungsumfang:', text: 'Das Mandat umfasst alle Arbeiten an bestehenden Systemen. Neue Projekte werden separat offeriert.' },
      { title: 'Abrechnung:', text: 'Monatlich im Voraus, zahlbar innerhalb von 10 Tagen.' },
    ]

    for (const note of notes) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(note.title, margin, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      const noteText = doc.splitTextToSize(note.text, contentWidth - 30)
      doc.text(noteText, margin + 28, y)
      y += noteText.length * 4 + 4
    }

    y += 5
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, margin + contentWidth, y)
    y += 10

    // Options
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 100, 100)
    doc.text('AUSWAHL', margin, y)
    y += 8

    for (const option of mandate.options) {
      checkPageBreak(25)

      // Checkbox
      doc.setDrawColor(100, 100, 100)
      doc.rect(margin, y - 3, 4, 4)

      // Title
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text(option.title, margin + 8, y)
      y += 5

      // Description
      if (option.description) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        const descLines = doc.splitTextToSize(option.description, contentWidth - 10)
        doc.text(descLines, margin + 8, y)
        y += descLines.length * 4 + 2
      }

      y += 6
      doc.setDrawColor(230, 230, 230)
      doc.line(margin, y - 3, margin + contentWidth, y - 3)
    }

    // QR Code for online acceptance
    y += 10
    checkPageBreak(35)

    doc.setDrawColor(180, 180, 180)
    doc.setLineDashPattern([2, 2], 0)
    doc.line(margin, y, margin + contentWidth, y)
    doc.setLineDashPattern([], 0)
    y += 8

    const qrUrl = `https://laeuft.ch/mandat/${token}`
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 200,
      margin: 0,
      errorCorrectionLevel: 'M',
    })

    doc.addImage(qrDataUrl, 'PNG', margin, y, 25, 25)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Online annehmen oder ablehnen', margin + 32, y + 8)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('Scanne den QR-Code oder besuche:', margin + 32, y + 14)
    doc.text(qrUrl, margin + 32, y + 19)

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Mandat-${mandate.client.company || mandate.client.name}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
