import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import nodemailer from 'nodemailer'

// Email configuration (same as send-invoice)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, reminderNumber } = await request.json()

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 })
    }

    // Get invoice with client
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`*, client:clients(*)`)
      .eq('id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })
    }

    if (invoice.status === 'cancelled') {
      return NextResponse.json({ error: 'Invoice is cancelled' }, { status: 400 })
    }

    const client = invoice.client
    const invoiceUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://laeuft.ch'}/rechnung/${invoice.unique_token}`

    // Determine reminder level and text
    const level = reminderNumber || 1
    let subject = ''
    let greeting = ''
    let urgencyText = ''

    switch (level) {
      case 1:
        subject = `Zahlungserinnerung: Rechnung ${invoice.invoice_number}`
        greeting = 'Freundliche Erinnerung'
        urgencyText = 'Wir möchten Sie freundlich daran erinnern, dass folgende Rechnung noch offen ist:'
        break
      case 2:
        subject = `2. Mahnung: Rechnung ${invoice.invoice_number}`
        greeting = 'Zweite Mahnung'
        urgencyText = 'Trotz unserer ersten Erinnerung ist die folgende Rechnung noch unbezahlt:'
        break
      case 3:
        subject = `Letzte Mahnung: Rechnung ${invoice.invoice_number}`
        greeting = 'Letzte Mahnung'
        urgencyText = 'Dies ist unsere letzte Mahnung. Bitte begleichen Sie die folgende Rechnung umgehend:'
        break
      default:
        subject = `Zahlungserinnerung: Rechnung ${invoice.invoice_number}`
        greeting = 'Zahlungserinnerung'
        urgencyText = 'Folgende Rechnung ist noch offen:'
    }

    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat('de-CH', {
        style: 'currency',
        currency: 'CHF',
      }).format(amount)
    }

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    }

    // Calculate days overdue
    const dueDate = invoice.due_date ? new Date(invoice.due_date) : null
    const today = new Date()
    const daysOverdue = dueDate ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #18181b; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="margin-bottom: 30px;">
    <h1 style="font-size: 24px; font-weight: bold; margin: 0;">Läuft<span style="color: #a1a1aa">.</span></h1>
    <p style="color: #71717a; margin: 4px 0 0 0; font-size: 14px;">Digital Systems & Branding</p>
  </div>

  <div style="background: ${level >= 3 ? '#fef2f2' : level >= 2 ? '#fffbeb' : '#f4f4f5'}; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
    <h2 style="margin: 0 0 8px 0; font-size: 18px; color: ${level >= 3 ? '#dc2626' : level >= 2 ? '#d97706' : '#18181b'};">${greeting}</h2>
    <p style="margin: 0; color: #52525b;">${urgencyText}</p>
  </div>

  <p style="margin-bottom: 24px;">
    ${client.company ? `${client.company}<br>` : ''}
    ${client.name}
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr style="border-bottom: 1px solid #e4e4e7;">
      <td style="padding: 12px 0; color: #71717a;">Rechnungsnummer</td>
      <td style="padding: 12px 0; text-align: right; font-weight: 600;">${invoice.invoice_number}</td>
    </tr>
    <tr style="border-bottom: 1px solid #e4e4e7;">
      <td style="padding: 12px 0; color: #71717a;">Rechnungsdatum</td>
      <td style="padding: 12px 0; text-align: right;">${formatDate(invoice.issue_date)}</td>
    </tr>
    ${dueDate ? `
    <tr style="border-bottom: 1px solid #e4e4e7;">
      <td style="padding: 12px 0; color: #71717a;">Fälligkeitsdatum</td>
      <td style="padding: 12px 0; text-align: right; ${daysOverdue > 0 ? 'color: #dc2626; font-weight: 600;' : ''}">${formatDate(invoice.due_date)}${daysOverdue > 0 ? ` (${daysOverdue} Tage überfällig)` : ''}</td>
    </tr>
    ` : ''}
    <tr>
      <td style="padding: 12px 0; color: #71717a;">Offener Betrag</td>
      <td style="padding: 12px 0; text-align: right; font-size: 20px; font-weight: bold; color: ${level >= 2 ? '#dc2626' : '#18181b'};">${formatAmount(invoice.total_amount)}</td>
    </tr>
  </table>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${invoiceUrl}" style="display: inline-block; background: #18181b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
      Rechnung ansehen & bezahlen
    </a>
  </div>

  <p style="color: #71717a; font-size: 14px;">
    ${level >= 3
      ? 'Bei Nichtbeachtung dieser letzten Mahnung sehen wir uns gezwungen, weitere Schritte einzuleiten.'
      : 'Falls Sie die Zahlung bereits veranlasst haben, betrachten Sie dieses Schreiben bitte als gegenstandslos.'}
  </p>

  <p style="color: #71717a; font-size: 14px;">
    Bei Fragen stehe ich Ihnen gerne zur Verfügung.
  </p>

  <p style="margin-top: 32px;">
    Freundliche Grüsse<br>
    <strong>Pierre Biege</strong>
  </p>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e4e4e7; color: #a1a1aa; font-size: 12px;">
    <p style="margin: 0;">Pierre Biege | Digital Systems & Branding</p>
    <p style="margin: 4px 0 0 0;">Tschangaladongastrasse 3 | 3955 Albinen</p>
    <p style="margin: 4px 0 0 0;">079 853 36 72 | pierre@laeuft.ch | laeuft.ch</p>
  </div>

</body>
</html>
`

    // Send email
    await transporter.sendMail({
      from: `"Pierre Biege" <${process.env.SMTP_USER || 'pierre@laeuft.ch'}>`,
      to: client.email,
      bcc: process.env.SMTP_USER || 'pierre@laeuft.ch',
      subject,
      html: emailHtml,
    })

    // Update invoice status to overdue if not already, and track reminder
    const updateData: Record<string, unknown> = {}

    if (invoice.status === 'sent' && daysOverdue > 0) {
      updateData.status = 'overdue'
    }

    // Store reminder info in notes or a separate field
    const reminderNote = `${level}. Mahnung gesendet am ${new Date().toLocaleDateString('de-CH')}`
    updateData.notes = invoice.notes
      ? `${invoice.notes}\n${reminderNote}`
      : reminderNote

    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId)
    }

    return NextResponse.json({
      success: true,
      message: `${level}. Mahnung gesendet an ${client.email}`
    })

  } catch (error) {
    console.error('Send reminder error:', error)
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 })
  }
}
