import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Public, token-authorized read of a single invoice (replaces the former anon
 * SELECT on invoices/invoice_items/clients). Service-role, only the matching
 * row — lets anon be fully revoked on these tables.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ data: null, error: 'Token fehlt' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*, client:clients(*), items:invoice_items(*)')
    .eq('unique_token', token)
    .single()

  if (error || !data) {
    return NextResponse.json({ data: null, error: 'Rechnung nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json({ data, error: null })
}
