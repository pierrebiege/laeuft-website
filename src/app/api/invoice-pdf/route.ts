import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsPDF } from 'jspdf'

// Business info
const business = {
  name: "Pierre-Laurent Biege",
  company: "Läuft. Digital Systems & Branding",
  street: "Tschangaladongastrasse 3",
  location: "3955 Albinen",
  email: "pierre@laeuft.ch",
  phone: "079 853 36 72",
  website: "laeuft.ch",
  iban: "CH72 8080 8007 8508 8887 5",
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    // Get invoice with items and client
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`*, client:clients(*), items:invoice_items(*)`)
      .eq('unique_token', token)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Sort items
    invoice.items = invoice.items?.sort((a: { sort_order: number }, b: { sort_order: number }) =>
      a.sort_order - b.sort_order
    ) || []

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = 210
    const margin = 20
    const contentWidth = pageWidth - 2 * margin
    let y = margin

    // Helper functions
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('de-CH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    }

    // Header
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('Läuft.', margin, y)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(128, 128, 128)
    doc.text('Digital Systems & Branding', margin, y + 6)

    // Invoice number (right side)
    doc.setTextColor(128, 128, 128)
    doc.setFontSize(10)
    doc.text('Rechnung', pageWidth - margin, y, { align: 'right' })

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(invoice.invoice_number, pageWidth - margin, y + 6, { align: 'right' })

    // Status badge
    if (invoice.status === 'paid') {
      doc.setFillColor(220, 252, 231) // green-100
      doc.setTextColor(22, 163, 74) // green-600
      doc.roundedRect(pageWidth - margin - 25, y + 10, 25, 6, 1, 1, 'F')
      doc.setFontSize(8)
      doc.text('BEZAHLT', pageWidth - margin - 12.5, y + 14, { align: 'center' })
    }

    y += 30

    // Addresses
    doc.setTextColor(128, 128, 128)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('VON', margin, y)
    doc.text('AN', margin + 80, y)

    y += 5
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)

    // From address
    doc.setFont('helvetica', 'bold')
    doc.text(business.name, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(business.street, margin, y + 5)
    doc.text(business.location, margin, y + 10)
    doc.text(business.email, margin, y + 17)

    // To address
    const client = invoice.client
    let clientY = y
    if (client.company) {
      doc.setFont('helvetica', 'bold')
      doc.text(client.company, margin + 80, clientY)
      clientY += 5
      doc.setFont('helvetica', 'normal')
    }
    doc.text(client.name, margin + 80, clientY)
    doc.text(client.email, margin + 80, clientY + 7)

    y += 35

    // Dates
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text('Rechnungsdatum:', margin, y)
    doc.setTextColor(0, 0, 0)
    doc.text(formatDate(invoice.issue_date), margin + 35, y)

    if (invoice.due_date) {
      doc.setTextColor(128, 128, 128)
      doc.text('Fällig am:', margin + 70, y)
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'bold')
      doc.text(formatDate(invoice.due_date), margin + 90, y)
      doc.setFont('helvetica', 'normal')
    }

    y += 15

    // Title
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(invoice.title, margin, y)

    if (invoice.description) {
      y += 6
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      const descLines = doc.splitTextToSize(invoice.description, contentWidth)
      doc.text(descLines, margin, y)
      y += descLines.length * 5
    }

    y += 10

    // Items table header
    doc.setFillColor(249, 250, 251) // zinc-50
    doc.rect(margin, y, contentWidth, 8, 'F')

    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.setFont('helvetica', 'bold')
    doc.text('BESCHREIBUNG', margin + 2, y + 5)
    doc.text('MENGE', margin + 100, y + 5, { align: 'right' })
    doc.text('PREIS', margin + 130, y + 5, { align: 'right' })
    doc.text('BETRAG', margin + contentWidth - 2, y + 5, { align: 'right' })

    y += 10

    // Items
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)

    for (const item of invoice.items) {
      // Check if we need a new page
      if (y > 250) {
        doc.addPage()
        y = margin
      }

      doc.setFont('helvetica', 'bold')
      doc.text(item.title, margin + 2, y + 4)

      if (item.description) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        const itemDescLines = doc.splitTextToSize(item.description, 90)
        doc.text(itemDescLines, margin + 2, y + 9)
        y += itemDescLines.length * 4
      }

      doc.setTextColor(100, 100, 100)
      doc.setFontSize(10)
      doc.text(item.quantity.toString(), margin + 100, y + 4, { align: 'right' })
      doc.text(`CHF ${formatAmount(item.unit_price)}`, margin + 130, y + 4, { align: 'right' })

      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'bold')
      doc.text(`CHF ${formatAmount(item.amount)}`, margin + contentWidth - 2, y + 4, { align: 'right' })

      y += 12

      // Draw line
      doc.setDrawColor(240, 240, 240)
      doc.line(margin, y - 2, margin + contentWidth, y - 2)
    }

    y += 5

    // Total
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(margin + 100, y, margin + contentWidth, y)

    y += 8
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Total', margin + 100, y)
    doc.text(`CHF ${formatAmount(invoice.total_amount)}`, margin + contentWidth - 2, y, { align: 'right' })

    // Notes
    if (invoice.notes) {
      y += 15
      doc.setFillColor(249, 250, 251)
      doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      const noteLines = doc.splitTextToSize(invoice.notes, contentWidth - 8)
      doc.text(noteLines, margin + 4, y + 6)
    }

    // Payment info (bottom of page)
    y = 250
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(margin, y, margin + contentWidth, y)

    y += 8
    doc.setFontSize(9)
    doc.setTextColor(128, 128, 128)
    doc.text('Zahlbar an:', margin, y)
    doc.setTextColor(0, 0, 0)
    doc.text(business.name, margin + 25, y)
    doc.text(`IBAN: ${business.iban}`, margin + 25, y + 5)

    // Footer
    y = 285
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    const footerText = `${business.name} | ${business.company} | ${business.street} | ${business.location}`
    doc.text(footerText, pageWidth / 2, y, { align: 'center' })
    doc.text(`${business.phone} | ${business.email} | ${business.website}`, pageWidth / 2, y + 4, { align: 'center' })

    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer')

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rechnung-${invoice.invoice_number}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
