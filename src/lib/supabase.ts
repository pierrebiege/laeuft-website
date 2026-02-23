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

// Buchhaltung Types
export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
  sort_order: number
  created_at: string
}

export interface Expense {
  id: string
  title: string
  description: string | null
  amount: number
  date: string
  category_id: string | null
  receipt_url: string | null
  receipt_filename: string | null
  ocr_raw_text: string | null
  ocr_confidence: number | null
  vendor_name: string | null
  vendor_id: string | null
  is_recurring: boolean
  payment_method: string | null
  reference_number: string | null
  import_source: string | null
  import_batch_id: string | null
  created_at: string
  updated_at: string
  category?: Category
}

export interface Income {
  id: string
  title: string
  description: string | null
  amount: number
  date: string
  category_id: string | null
  invoice_id: string | null
  external_id: string | null
  external_source: string | null
  customer_name: string | null
  customer_email: string | null
  import_source: string | null
  import_batch_id: string | null
  created_at: string
  updated_at: string
  category?: Category
  invoice?: Invoice
}

export interface ImportBatch {
  id: string
  type: string
  filename: string | null
  records_total: number
  records_imported: number
  records_skipped: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message: string | null
  created_at: string
  completed_at: string | null
}

// Mandate Types (Partner-Modell)
export interface Mandate {
  id: string
  client_id: string
  title: string
  subtitle: string | null
  introduction: string | null
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'active' | 'paused' | 'cancelling' | 'cancelled' | 'ended'
  valid_until: string | null
  start_date: string | null
  end_date: string | null
  accepted_option_id: string | null
  accepted_at: string | null
  signature_data: string | null
  unique_token: string
  billing_day: number
  next_invoice_date: string | null
  last_invoice_date: string | null
  invoices_generated: number
  cancellation_period: string
  pause_fee: number
  billing_cycle: 'monthly' | 'quarterly' | 'yearly'
  sent_at: string | null
  created_at: string
  updated_at: string
  // Cancellation fields
  cancelled_at: string | null
  cancellation_effective_date: string | null
  cancellation_reason: string | null
  // Pause fields
  paused_at: string | null
  pause_end_date: string | null
  pause_reason: string | null
  // Relations
  client?: Client
  pricing_phases?: MandatePricingPhase[]
  sections?: MandateSection[]
  options?: MandateOption[]
  systems?: MandateSystem[]
}

export interface MandatePricingPhase {
  id: string
  mandate_id: string
  label: string
  amount: number
  description: string | null
  start_date: string | null
  end_date: string | null
  is_primary: boolean
  sort_order: number
  created_at: string
}

export interface MandateSection {
  id: string
  mandate_id: string
  label: string
  title: string | null
  description: string | null
  section_type: 'list' | 'terms' | 'text' | 'comparison'
  page_number: number
  sort_order: number
  created_at: string
  items?: MandateSectionItem[]
}

export interface MandateSectionItem {
  id: string
  section_id: string
  title: string
  detail: string | null
  description: string | null
  sort_order: number
  created_at: string
}

export interface MandateOption {
  id: string
  mandate_id: string
  title: string
  description: string | null
  monthly_amount: number | null
  start_date: string | null
  is_rejection: boolean
  sort_order: number
  created_at: string
}

export interface MandateSystem {
  id: string
  mandate_id: string
  name: string
  technology: string | null
  sort_order: number
  created_at: string
}

export interface MandateInvoice {
  id: string
  mandate_id: string
  invoice_id: string | null
  period_start: string
  period_end: string
  amount: number
  created_at: string
  invoice?: Invoice
}

// Partner CRM Types
export type PartnerType = 'Brand' | 'Athlete' | 'Team' | 'Verband'
export type PartnerStatus = 'Lead' | 'Negotiating' | 'Active' | 'Closed' | 'Declined'
export type CollaborationType =
  | 'Sponsoring'
  | 'Ambassador'
  | 'Product Placement'
  | 'Event'
  | 'Barter Deal'
  | 'Content Creation'
  | 'Affiliate'
  | 'Sonstiges'

export interface Partner {
  id: string
  name: string
  partner_type: PartnerType
  category: string
  collaboration_types: CollaborationType[]
  contact_first_name: string
  contact_last_name: string
  contact_position: string
  contact_email: string
  contact_website: string
  status: PartnerStatus
  notes: string
  status_date: string | null
  instagram: string
  source: string
  value: string
  follow_up_date: string | null
  last_contact: string | null
  tags: string[]
  created_at: string
  updated_at: string
  history?: PartnerHistory[]
  attachments?: PartnerAttachment[]
  attachment_count?: number
}

export type HistoryChannel = 'email' | 'instagram' | 'phone' | 'meeting' | 'note' | 'initial'
export type HistoryDirection = 'outgoing' | 'incoming' | 'internal'

export interface PartnerHistory {
  id: string
  partner_id: string
  author: string
  note: string
  channel: HistoryChannel
  direction: HistoryDirection
  created_at: string
}

export interface PartnerAttachment {
  id: string
  partner_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by: string
  created_at: string
  url?: string
}
