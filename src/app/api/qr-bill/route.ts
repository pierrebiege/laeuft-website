import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Creditor information (you - the payment recipient)
const creditor = {
  iban: "CH7280808007850888875",
  name: "Pierre-Laurent Biege",
  street: "Tschangaladongastrasse",
  buildingNumber: "3",
  postalCode: "3955",
  city: "Albinen",
  country: "CH",
}

/**
 * Generate Swiss Payment Code (SPC) according to SIX specifications v2.3
 *
 * The SPC consists of exactly 31-34 lines separated by LF (\n)
 * All fields must be present, even if empty
 */
function generateSPC(invoice: {
  amount: number
  invoiceNumber: string
  debtor?: {
    name: string
    street?: string
    buildingNumber?: string
    postalCode?: string
    city?: string
    country?: string
  }
}): string {

  // Build SPC with exactly 31 fields (minimum valid structure)
  const fields: string[] = []

  // Header (3 fields)
  fields.push("SPC")                          // 1: QR Type (fixed)
  fields.push("0200")                         // 2: Version (fixed)
  fields.push("1")                            // 3: Coding (1 = UTF-8, fixed)

  // Creditor Account (1 field)
  fields.push(creditor.iban)                  // 4: IBAN

  // Creditor Address - Structured Type S (7 fields)
  fields.push("S")                            // 5: Address Type (S = Structured)
  fields.push(creditor.name)                  // 6: Name (max 70 chars)
  fields.push(creditor.street)                // 7: Street (max 16 chars)
  fields.push(creditor.buildingNumber)        // 8: Building Number (max 16 chars)
  fields.push(creditor.postalCode)            // 9: Postal Code (max 16 chars)
  fields.push(creditor.city)                  // 10: City (max 35 chars)
  fields.push(creditor.country)               // 11: Country (2 letter code)

  // Ultimate Creditor - NOT USED, but fields must be present (7 fields, all empty)
  fields.push("")                             // 12: Address Type
  fields.push("")                             // 13: Name
  fields.push("")                             // 14: Street
  fields.push("")                             // 15: Building Number
  fields.push("")                             // 16: Postal Code
  fields.push("")                             // 17: City
  fields.push("")                             // 18: Country

  // Payment Amount (2 fields)
  fields.push(invoice.amount.toFixed(2))      // 19: Amount (2 decimal places)
  fields.push("CHF")                          // 20: Currency

  // Debtor Address - Structured Type S (7 fields)
  if (invoice.debtor?.name) {
    fields.push("S")                          // 21: Address Type
    fields.push(truncate(invoice.debtor.name, 70))           // 22: Name
    fields.push(truncate(invoice.debtor.street || "", 16))   // 23: Street
    fields.push(truncate(invoice.debtor.buildingNumber || "", 16)) // 24: Building
    fields.push(truncate(invoice.debtor.postalCode || "", 16))     // 25: Postal Code
    fields.push(truncate(invoice.debtor.city || "", 35))     // 26: City
    fields.push(invoice.debtor.country || "CH")              // 27: Country
  } else {
    // Empty debtor (7 empty fields)
    fields.push("")                           // 21: Address Type
    fields.push("")                           // 22: Name
    fields.push("")                           // 23: Street
    fields.push("")                           // 24: Building Number
    fields.push("")                           // 25: Postal Code
    fields.push("")                           // 26: City
    fields.push("")                           // 27: Country
  }

  // Reference (3 fields)
  fields.push("NON")                          // 28: Reference Type (NON = no reference)
  fields.push("")                             // 29: Reference (empty for NON)
  fields.push(truncate(`Rechnung ${invoice.invoiceNumber}`, 140)) // 30: Unstructured message

  // Trailer
  fields.push("EPD")                          // 31: End Payment Data (fixed)

  // Join with LF (\n) - CRITICAL: must be consistent
  return fields.join("\n")
}

function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.substring(0, maxLength) : str
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
    const qrData = generateSPC({
      amount: invoice.total_amount,
      invoiceNumber: invoice.invoice_number,
      debtor: invoice.client ? {
        name: invoice.client.company || invoice.client.name,
        country: "CH",
      } : undefined,
    })

    // Format IBAN for display (groups of 4)
    const ibanFormatted = creditor.iban.replace(/(.{4})/g, '$1 ').trim()

    return NextResponse.json({
      qrData,
      creditor: {
        name: creditor.name,
        iban: ibanFormatted,
        address: `${creditor.street} ${creditor.buildingNumber}`,
        location: `${creditor.postalCode} ${creditor.city}`,
      }
    })
  } catch (err) {
    console.error('QR Bill error:', err)
    return NextResponse.json({ error: 'Failed to generate QR data' }, { status: 500 })
  }
}
