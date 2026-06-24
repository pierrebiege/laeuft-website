import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Authenticated DB proxy for the admin frontend.
 *
 * The admin UI used to talk to Supabase directly with the public anon key,
 * which left every CRM/accounting table world-readable/writable. Now the
 * browser sends a serialized PostgREST query plan ({ table, ops }) here; this
 * route validates the admin session and replays the exact same builder chain
 * with the SERVICE-ROLE client (server-side only). Semantics are identical to
 * supabase-js because we call the very same methods — we don't reimplement them.
 *
 * Access = any valid admin_session (validated against admin_sessions). That is
 * the same trust level the cookie already grants in the admin UI.
 */

// PostgREST builder/filter methods we allow the client to replay. Anything
// outside this set is rejected (defense in depth — the route is already
// auth-gated, but we never want to expose rpc/auth/etc. through here).
const ALLOWED_OPS = new Set([
  // terminal-ish / shaping
  'select', 'insert', 'update', 'upsert', 'delete',
  'single', 'maybeSingle', 'csv', 'returns', 'rollback',
  // filters
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is',
  'in', 'contains', 'containedBy', 'rangeGt', 'rangeGte', 'rangeLt',
  'rangeLte', 'rangeAdjacent', 'overlaps', 'textSearch', 'match',
  'not', 'or', 'filter',
  // modifiers
  'order', 'limit', 'range', 'abortSignal', 'explain',
])

type Op = [string, ...unknown[]]

export async function POST(request: NextRequest) {
  const unauthorized = await requireAuth(request)
  if (unauthorized) return unauthorized

  let body: { table?: unknown; ops?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ data: null, error: { message: 'Invalid JSON body' } }, { status: 400 })
  }

  const table = body.table
  const ops = body.ops
  if (typeof table !== 'string' || !Array.isArray(ops)) {
    return NextResponse.json(
      { data: null, error: { message: 'Expected { table: string, ops: array }' } },
      { status: 400 }
    )
  }

  // Build the query by replaying the recorded chain on the service-role client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabaseAdmin.from(table)
  for (const op of ops as Op[]) {
    if (!Array.isArray(op) || typeof op[0] !== 'string') {
      return NextResponse.json({ data: null, error: { message: 'Malformed op' } }, { status: 400 })
    }
    const [method, ...args] = op
    if (!ALLOWED_OPS.has(method)) {
      return NextResponse.json(
        { data: null, error: { message: `Operation not allowed: ${method}` } },
        { status: 400 }
      )
    }
    if (typeof query[method] !== 'function') {
      return NextResponse.json(
        { data: null, error: { message: `Unknown operation: ${method}` } },
        { status: 400 }
      )
    }
    query = query[method](...args)
  }

  try {
    const { data, error, count, status } = await query
    return NextResponse.json({
      data: data ?? null,
      error: error ? { message: error.message, details: error.details, hint: error.hint, code: error.code } : null,
      count: count ?? null,
      status: status ?? 200,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Query execution failed'
    return NextResponse.json({ data: null, error: { message } }, { status: 500 })
  }
}
