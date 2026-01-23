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

export interface Invoice {
  id: string
  client_id: string
  offer_id: string | null
  invoice_number: string
  title: string
  description: string | null
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string | null
  total_amount: number
  paid_amount: number
  paid_at: string | null
  sent_at: string | null
  unique_token: string
  notes: string | null
  created_at: string
  updated_at: string
  client?: Client
  items?: InvoiceItem[]
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  title: string
  description: string | null
  quantity: number
  unit_price: number
  amount: number
  sort_order: number
}
