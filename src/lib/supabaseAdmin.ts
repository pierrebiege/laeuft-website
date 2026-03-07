import 'server-only'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured. Add it to .env.local and Vercel.')
    }
    _client = createClient(url, key)
  }
  return _client
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as any)[prop]
  },
})
