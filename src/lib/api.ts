/**
 * api.ts – thin query helpers over Supabase.
 * Each function maps 1-to-1 with a store action.
 * We keep Supabase out of components/pages entirely.
 */
import { supabase } from './supabase'
import type {
  DOStatus, JobStatus, ExpenseStatus,
  ServiceTypeDB,
} from './database.types'

// ── Auth ──────────────────────────────────────────────────────
export const apiSignIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const apiSignOut = () => supabase.auth.signOut()

export const apiGetSession = () => supabase.auth.getSession()

export const apiGetProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export const apiUpdateProfile = async (userId: string, patch: { full_name?: string; phone?: string }) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Lookup tables (read) ──────────────────────────────────────
export const apiGetSuppliers = async () => {
  const { data, error } = await supabase.from('suppliers').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export const apiGetServiceCentres = async () => {
  const { data, error } = await supabase.from('service_centres').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export const apiGetCustomers = async () => {
  const { data, error } = await supabase.from('customers').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export const apiGetAgents = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['agent', 'manager'])
    .order('full_name')
  if (error) throw error
  return data ?? []
}

// All profiles (admin use)
export const apiGetAllProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name')
  if (error) throw error
  return data ?? []
}

// ── Suppliers (CRUD) ──────────────────────────────────────────
export const apiCreateSupplier = async (payload: { name: string; contact_person?: string; phone?: string; email?: string; gst_number?: string; address?: string }) => {
  const { data, error } = await supabase.from('suppliers').insert(payload).select().single()
  if (error) throw error
  return data
}

export const apiUpdateSupplier = async (id: string, patch: Partial<{ name: string; contact_person: string; phone: string; email: string; gst_number: string; address: string }>) => {
  const { data, error } = await supabase.from('suppliers').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const apiDeleteSupplier = async (id: string) => {
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) throw error
}

// ── Service Centres (CRUD) ────────────────────────────────────
export const apiCreateServiceCentre = async (payload: { name: string; city?: string; contact_person?: string; phone?: string; address?: string }) => {
  const { data, error } = await supabase.from('service_centres').insert(payload).select().single()
  if (error) throw error
  return data
}

export const apiUpdateServiceCentre = async (id: string, patch: Partial<{ name: string; city: string; contact_person: string; phone: string; address: string }>) => {
  const { data, error } = await supabase.from('service_centres').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const apiDeleteServiceCentre = async (id: string) => {
  const { error } = await supabase.from('service_centres').delete().eq('id', id)
  if (error) throw error
}

// ── Customers (CRUD) ──────────────────────────────────────────
export const apiCreateCustomer = async (payload: { name: string; city?: string; contact_person?: string; phone?: string; email?: string; gst_number?: string }) => {
  const { data, error } = await supabase.from('customers').insert(payload).select().single()
  if (error) throw error
  return data
}

export const apiUpdateCustomer = async (id: string, patch: Partial<{ name: string; city: string; contact_person: string; phone: string; email: string; gst_number: string }>) => {
  const { data, error } = await supabase.from('customers').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const apiDeleteCustomer = async (id: string) => {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}

// ── User / Profile management (admin) ────────────────────────
export const apiUpdateUserRole = async (id: string, role: string) => {
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const apiUpdateUserProfile = async (id: string, patch: Partial<{ full_name: string; phone: string; is_active: boolean }>) => {
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ── Delivery Orders ───────────────────────────────────────────
export const apiGetDOs = async () => {
  const { data, error } = await supabase
    .from('delivery_orders')
    .select(`
      *,
      supplier:suppliers(id,name),
      source_service_centre:service_centres(id,name,city),
      items:do_items(*)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export const apiGetDO = async (id: string) => {
  const { data, error } = await supabase
    .from('delivery_orders')
    .select(`
      *,
      supplier:suppliers(id,name),
      source_service_centre:service_centres(id,name,city),
      items:do_items(*),
      jobs(*)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const apiCreateDO = async (payload: {
  do_number: string
  supplier_id: string
  source_service_centre_id: string
  expected_collection_date: string
  document_url?: string
  created_by: string
  items: Array<{ coil_grade:string; thickness_mm:number; width_mm:number; quantity:number; weight_mt:number }>
}) => {
  const { items, ...doPayload } = payload
  const { data: doRow, error: doErr } = await supabase
    .from('delivery_orders')
    .insert(doPayload)
    .select()
    .single()
  if (doErr) throw doErr

  const { error: itemErr } = await supabase
    .from('do_items')
    .insert(items.map(i => ({ ...i, do_id: doRow.id })))
  if (itemErr) throw itemErr

  return doRow
}

export const apiUpdateDOStatus = async (id: string, status: DOStatus, changedBy: string) => {
  const { data: old } = await supabase.from('delivery_orders').select('status').eq('id', id).single()
  const { error } = await supabase.from('delivery_orders').update({ status }).eq('id', id)
  if (error) throw error
  await apiWriteAudit({ entity: 'delivery_orders', entity_id: id, field: 'status', old_value: old?.status ?? '', new_value: status, changed_by: changedBy })
}

// ── Jobs ──────────────────────────────────────────────────────
export const apiGetJobs = async () => {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      do:delivery_orders(id,do_number,source_service_centre:service_centres(id,name,city)),
      customer:customers(id,name,city),
      assigned_agent:profiles(id,full_name,role)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export const apiGetJob = async (id: string) => {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      do:delivery_orders(*, supplier:suppliers(*), source_service_centre:service_centres(*), items:do_items(*)),
      customer:customers(*),
      assigned_agent:profiles(*),
      queue_updates(*),
      expenses(*),
      deliveries(*)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const apiCreateJob = async (payload: {
  job_number: string
  do_id: string
  customer_id: string
  delivery_destination: string
  processing_instructions?: string
  service_type: ServiceTypeDB
  packing_type?: string
  assigned_agent_id?: string
  planned_delivery_date?: string
  created_by: string
}) => {
  const { data, error } = await supabase.from('jobs').insert(payload).select().single()
  if (error) throw error
  return data
}

export const apiUpdateJobStatus = async (id: string, status: JobStatus, changedBy: string) => {
  const { data: old } = await supabase.from('jobs').select('status').eq('id', id).single()
  const { error } = await supabase.from('jobs').update({ status }).eq('id', id)
  if (error) throw error
  await apiWriteAudit({ entity: 'jobs', entity_id: id, field: 'status', old_value: old?.status ?? '', new_value: status, changed_by: changedBy })
}

// ── Queue Updates ─────────────────────────────────────────────
export const apiGetQueueUpdates = async () => {
  const { data, error } = await supabase
    .from('queue_updates')
    .select(`*, service_centre:service_centres(id,name,city), logged_by_profile:profiles(id,full_name)`)
    .order('checkin_time', { ascending: false })
  if (error) throw error
  return data ?? []
}

export const apiAddQueueUpdate = async (payload: {
  job_id: string
  service_centre_id: string
  service_type: ServiceTypeDB
  queue_number?: string
  checkin_time?: string
  estimated_processing_minutes?: number
  notes?: string
  gps_lat?: number
  gps_lng?: number
  logged_by: string
}) => {
  const { data, error } = await supabase.from('queue_updates').insert(payload).select().single()
  if (error) throw error
  await supabase.from('jobs').update({ status: 'at_service_centre' }).eq('id', payload.job_id)
  return data
}

export const apiUpdateQueueEntry = async (id: string, patch: {
  processing_started_at?: string
  processing_completed_at?: string
  notes?: string
}) => {
  const { error } = await supabase.from('queue_updates').update(patch).eq('id', id)
  if (error) throw error
}

// ── Expenses ──────────────────────────────────────────────────
export const apiGetExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select(`*, logged_by_profile:profiles!expenses_logged_by_fkey(id,full_name)`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export const apiAddExpense = async (payload: {
  job_id: string
  category: string
  amount_inr: number
  payee_description: string
  settlement_method: string
  photo_url?: string
  gps_lat?: number
  gps_lng?: number
  logged_by: string
}) => {
  const { data, error } = await supabase.from('expenses').insert(payload).select().single()
  if (error) throw error
  return data
}

export const apiReviewExpense = async (
  id: string, status: ExpenseStatus, review_notes: string, reviewed_by: string
) => {
  const { data: old } = await supabase.from('expenses').select('status').eq('id', id).single()
  const { error } = await supabase
    .from('expenses')
    .update({ status, review_notes, reviewed_by, reviewed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  await apiWriteAudit({ entity: 'expenses', entity_id: id, field: 'status', old_value: old?.status ?? '', new_value: status, changed_by: reviewed_by })
}

// ── Deliveries ────────────────────────────────────────────────
export const apiGetDeliveries = async () => {
  const { data, error } = await supabase
    .from('deliveries')
    .select(`*, created_by_profile:profiles!deliveries_created_by_fkey(id,full_name)`)
    .order('delivered_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export const apiAddDelivery = async (payload: {
  job_id: string
  customer_name: string
  delivery_address: string
  vehicle_number: string
  delivered_at: string
  delivery_status?: string
  unloaded_photo_url?: string
  final_lat?: number
  final_lng?: number
  destination_changed?: boolean
  old_destination?: string
  new_destination?: string
  change_reason?: string
  authorised_by_office?: boolean
  created_by: string
}) => {
  const { data, error } = await supabase.from('deliveries').insert(payload).select().single()
  if (error) throw error
  await supabase.from('jobs').update({ status: 'delivered' }).eq('id', payload.job_id)
  return data
}

// ── Storage helpers ───────────────────────────────────────────
export const apiUploadPhoto = async (
  bucket: 'expense-photos' | 'do-documents',
  path: string,
  file: File
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true })
  if (error) throw error
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}

// ── Audit log ─────────────────────────────────────────────────
const apiWriteAudit = async (entry: {
  entity: string; entity_id: string; field: string
  old_value?: string; new_value?: string; changed_by: string
}) => {
  await supabase.from('audit_log').insert(entry).catch(console.warn)
}
