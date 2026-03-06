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
export type PartnerType = 'Brand' | 'Athlete/Persönlichkeiten' | 'Event' | 'NPO' | 'Medien'
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
export type PotentialLevel = 'Hoch' | 'Mittel' | 'Tief'
export type FitLevel = 'Hoch' | 'Mittel' | 'Tief'
export type PriorityLevel = 'A' | 'B' | 'C'

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
  potenzial: PotentialLevel | null
  fit: FitLevel | null
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

// Priority calculation
const PRIORITY_MATRIX: Record<string, PriorityLevel> = {
  'Hoch-Hoch': 'A', 'Hoch-Mittel': 'A', 'Hoch-Tief': 'B',
  'Mittel-Hoch': 'A', 'Mittel-Mittel': 'B', 'Mittel-Tief': 'C',
  'Tief-Hoch': 'B', 'Tief-Mittel': 'C', 'Tief-Tief': 'C',
}

export function calcPriority(
  potenzial: PotentialLevel | null | undefined,
  fit: FitLevel | null | undefined
): PriorityLevel | null {
  if (!potenzial || !fit) return null
  return PRIORITY_MATRIX[`${potenzial}-${fit}`] || null
}

export function priorityOrder(p: PriorityLevel | null): number {
  if (p === 'A') return 1
  if (p === 'B') return 2
  if (p === 'C') return 3
  return 99
}

export function parseValue(v: string | null | undefined): number {
  if (!v) return 0
  return parseFloat(v.replace(/[^0-9.]/g, '')) || 0
}

export const POTENTIAL_LEVELS: PotentialLevel[] = ['Hoch', 'Mittel', 'Tief']
export const FIT_LEVELS: FitLevel[] = ['Hoch', 'Mittel', 'Tief']

export const PRIORITY_COLORS: Record<PriorityLevel, { bg: string; text: string }> = {
  A: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300' },
  B: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
  C: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-500 dark:text-zinc-400' },
}

export const POTENTIAL_COLORS: Record<PotentialLevel, { bg: string; text: string }> = {
  Hoch: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300' },
  Mittel: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
  Tief: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-500 dark:text-zinc-400' },
}

export const FIT_COLORS: Record<FitLevel, { bg: string; text: string }> = {
  Hoch: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300' },
  Mittel: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300' },
  Tief: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-500 dark:text-zinc-400' },
}

export const SORT_OPTIONS = [
  { value: 'priority', label: 'Priorität' },
  { value: 'value', label: 'Deal-Wert' },
  { value: 'last_contact', label: 'Letzter Kontakt' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'newest', label: 'Neueste' },
] as const

export type SortOption = (typeof SORT_OPTIONS)[number]['value']

// Prospect (Kaltakquise) Types
export type ProspectStatus = 'neu' | 'kontaktiert' | 'follow_up_1' | 'follow_up_2' | 'geantwortet' | 'kein_interesse' | 'kunde'

export interface Prospect {
  id: string
  company: string
  contact_name: string
  email: string
  website: string | null
  prototype_url: string | null
  status: ProspectStatus
  notes: string | null
  email_1_sent_at: string | null
  email_2_sent_at: string | null
  email_3_sent_at: string | null
  responded_at: string | null
  converted_client_id: string | null
  created_at: string
  updated_at: string
}

// Calendar Types
export type CalendarEventType = 'work' | 'meeting' | 'training' | 'holiday' | 'deadline' | 'personal' | 'travel'
export type RecurrenceRule = 'daily' | 'weekly' | 'monthly' | 'weekdays'
export type VirtualEventSource = 'partner_followup' | 'invoice_due' | 'mandate_billing' | 'google_calendar'

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  start_at: string
  end_at: string
  all_day: boolean
  event_type: CalendarEventType
  color: string
  partner_id: string | null
  client_id: string | null
  mandate_id: string | null
  invoice_id: string | null
  recurrence_rule: RecurrenceRule | null
  recurrence_end: string | null
  created_by: string
  created_at: string
  updated_at: string
  partner?: Partner
  client?: Client
  mandate?: Mandate
  invoice?: Invoice
}

export interface VirtualCalendarEvent {
  id: string
  title: string
  start_at: string
  end_at: string
  all_day: boolean
  source: VirtualEventSource
  color: string
  sourceId: string
  sourceName: string
  description?: string
  location?: string
}

export type CalendarDisplayEvent =
  | (CalendarEvent & { _virtual: false })
  | (VirtualCalendarEvent & { _virtual: true })
