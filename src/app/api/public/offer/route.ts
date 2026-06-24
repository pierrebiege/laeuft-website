import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Public, token-authorized read of a single offer (replaces the former anon
 * SELECT on offers/offer_items/clients). Only the row whose unique_token matches
 * is returned, with service-role — so anon can be fully revoked on these tables.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ data: null, error: 'Token fehlt' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('offers')
    .select('*, client:clients(*), items:offer_items(*)')
    .eq('unique_token', token)
    .single()

  if (error || !data) {
    return NextResponse.json({ data: null, error: 'Offerte nicht gefunden' }, { status: 404 })
  }

  return NextResponse.json({ data, error: null })
}
