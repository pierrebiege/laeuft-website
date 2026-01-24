import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Swiss QR Bill data structure following SIX specifications
// Using structured address (Type S) as required since 21.11.2025

const creditor = {
  name: "Pierre-Laurent Biege",
  address: "Tschangaladongastrasse",
  houseNumber: "3",
  zip: "3955",
  city: "Albinen",
  country: "CH",
  iban: "CH7280808007850888875", // Without spaces
}

function generateSwissQRCodeData(invoice: {
  amount: number
  invoiceNumber: string
  debtor?: {
    name: string
    address?: string
    houseNumber?: string
    zip?: string
    city?: string
    country?: string
  }
}): string {
  // Swiss Payment Code (SPC) format - strict field order
  // Reference: SIX Swiss Payment Standards
  const lines: string[] = []

  // Header
  lines.push("SPC")           // QR Type
  lines.push("0200")          // Version
  lines.push("1")             // Coding Type (1 = UTF-8)

  // Creditor Account
  lines.push(creditor.iban)

  // Creditor (Structured Address - Type S)
  lines.push("S")             // Address Type: S = Structured
  lines.push(creditor.name)
  lines.push(creditor.address)
  lines.push(creditor.houseNumber)
  lines.push(creditor.zip)
  lines.push(creditor.city)
  lines.push(creditor.country)

  // Ultimate Creditor (not used - 7 empty lines for combined, but we need specific fields)
  lines.push("")              // Address Type
  lines.push("")              // Name
  lines.push("")              // Street
  lines.push("")              // House Number
  lines.push("")              // Postal Code
  lines.push("")              // City
  lines.push("")              // Country

  // Payment Amount
  lines.push(invoice.amount.toFixed(2))
  lines.push("CHF")

  // Debtor (Structured Address - Type S)
  if (invoice.debtor?.name) {
    lines.push("S")           // Address Type
    lines.push(invoice.debtor.name.substring(0, 70))
    lines.push(invoice.debtor.address || "")
    lines.push(invoice.debtor.houseNumber || "")
    lines.push(invoice.debtor.zip || "")
    lines.push(invoice.debtor.city || "")
    lines.push(invoice.debtor.country || "CH")
  } else {
    lines.push("")            // Address Type
    lines.push("")            // Name
    lines.push("")            // Street
    lines.push("")            // House Number
    lines.push("")            // Postal Code
    lines.push("")            // City
    lines.push("")            // Country
  }

  // Reference Type (NON = no reference - simplest for freelancers)
  lines.push("NON")           // Reference Type
  lines.push("")              // Reference (empty for NON)

  // Additional Information
  lines.push(`Rechnung ${invoice.invoiceNumber}`.substring(0, 140))

  // Trailer
  lines.push("EPD")           // End Payment Data

  // Alternative procedures (empty)
  lines.push("")

  return lines.join("\n")
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    // Get invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`*, client:clients(*)`)
      .eq('unique_token', token)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Generate QR code data
    const qrData = generateSwissQRCodeData({
      amount: invoice.total_amount,
      invoiceNumber: invoice.invoice_number,
      debtor: invoice.client ? {
        name: invoice.client.company || invoice.client.name,
        country: "CH",
      } : undefined,
    })

    return NextResponse.json({
      qrData,
      creditor: {
        name: creditor.name,
        iban: creditor.iban.replace(/(.{4})/g, '$1 ').trim(),
        address: `${creditor.address} ${creditor.houseNumber}`,
        location: `${creditor.zip} ${creditor.city}`,
      }
    })
  } catch (err) {
    console.error('QR Bill error:', err)
    return NextResponse.json({ error: 'Failed to generate QR data' }, { status: 500 })
  }
}
