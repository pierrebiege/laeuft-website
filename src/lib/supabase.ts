import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Client {
  id: string
  name: string
  company: string | null
  email: string
  created_at: string
}

export interface Offer {
  id: string
  client_id: string
  title: string
  description: string | null
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  valid_until: string | null
  total_amount: number
  created_at: string
  sent_at: string | null
  accepted_at: string | null
  unique_token: string
  client?: Client
  items?: OfferItem[]
}

export interface OfferItem {
  id: string
  offer_id: string
  title: string
  description: string | null
  amount: number
  sort_order: number
}

export interface Service {
  id: string
  name: string
  description: string | null
  default_amount: number
  features: string[] | null
}
