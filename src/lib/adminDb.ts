import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Drop-in replacement for the browser `supabase` client used by the admin UI.
 *
 * `.from(table)` no longer talks to Supabase with the public anon key. Instead
 * it records the PostgREST builder chain and, when awaited, POSTs it to
 * `/api/admin/db`, which validates the admin session and executes the query
 * with the service-role key. Call sites stay unchanged:
 *
 *   const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
 *
 * `.storage` still uses the anon client directly (Storage bucket policies are a
 * separate access layer from table RLS and are unaffected by this change).
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Anon client kept ONLY for Storage (file upload/download/getPublicUrl).
const anonClient = createClient(supabaseUrl, supabaseAnonKey)

// Must mirror ALLOWED_OPS in src/app/api/admin/db/route.ts.
const CHAIN_METHODS = new Set([
  'select', 'insert', 'update', 'upsert', 'delete',
  'single', 'maybeSingle', 'csv', 'returns', 'rollback',
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is',
  'in', 'contains', 'containedBy', 'rangeGt', 'rangeGte', 'rangeLt',
  'rangeLte', 'rangeAdjacent', 'overlaps', 'textSearch', 'match',
  'not', 'or', 'filter',
  'order', 'limit', 'range', 'abortSignal', 'explain',
])

interface QueryResult {
  data: unknown
  error: { message: string; details?: string; hint?: string; code?: string } | null
  count: number | null
  status: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function remoteBuilder(table: string): any {
  const ops: unknown[][] = []
  let promise: Promise<QueryResult> | null = null

  const execute = (): Promise<QueryResult> => {
    if (!promise) {
      promise = fetch('/api/admin/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, ops }),
        credentials: 'same-origin',
      })
        .then(async (res) => {
          let body: Partial<QueryResult> | null = null
          try {
            body = await res.json()
          } catch {
            body = null
          }
          if (!body) {
            return { data: null, error: { message: `Request failed (${res.status})` }, count: null, status: res.status }
          }
          return {
            data: body.data ?? null,
            error: body.error ?? null,
            count: body.count ?? null,
            status: body.status ?? res.status,
          }
        })
        .catch((e) => ({
          data: null,
          error: { message: e instanceof Error ? e.message : 'Network error' },
          count: null,
          status: 0,
        }))
    }
    return promise
  }

  const proxy: unknown = new Proxy(function () {} as unknown as object, {
    get(_target, prop) {
      if (prop === 'then') {
        const p = execute()
        return p.then.bind(p)
      }
      if (prop === 'catch') {
        const p = execute()
        return p.catch.bind(p)
      }
      if (prop === 'finally') {
        const p = execute()
        return p.finally.bind(p)
      }
      if (typeof prop === 'string' && CHAIN_METHODS.has(prop)) {
        return (...args: unknown[]) => {
          ops.push([prop, ...args])
          return proxy
        }
      }
      return undefined
    },
  })

  return proxy
}

// `from` is typed exactly as supabase-js types it, so all existing call sites
// keep their original result typings (typed rows, `.single()`, etc.). The
// runtime is the remote proxy above.
const fromImpl = (table: string) => remoteBuilder(table)

export const supabase = {
  from: fromImpl as unknown as SupabaseClient['from'],
  storage: anonClient.storage,
}
