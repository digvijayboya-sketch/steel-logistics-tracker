/**
 * api.ts – thin query helpers over Supabase.
 * All payloads match the EXACT database schema.
 *
 * suppliers       → id, name
 * service_centres → id, name, city
 * customers       → id, name, city
 * profiles        → id, full_name, role (admin|planner|purchase|agent), phone, created_at
 *
 * Storage buckets:
 *   expense-photos  (public,  10 MB, image/*)
 *   do-documents    (private, 20 MB, pdf/image)
 */
import { supabase } from './supabase'
import type { DOStatus, JobStatus, ExpenseStatus, ServiceTypeDB } from './database.types'

// ── Auth ──────────────────────────────────────────────────────
export const apiSignIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const apiSignOut = () => supabase.auth.signOut()

export const apiGetSession = () => supabase.auth.getSession()

export const apiGetProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone, created_at')
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
    .select('id, full_name, role, phone, created_at')
    .single()
  if (error) throw error
  return data
}

// ── Suppliers (id, name) ────────────────────────────────────────
export const apiGetSuppliers = async () => {
  const { data, error } = await supabase.from('suppliers').select('id, name').order('name')
  if (error) throw error
  return data ?? []
}
export const apiCreateSupplier = async (p: { name: string }) => {
  const { data, error } = await supabase.from('suppliers').insert({ name: p.name }).select('id, name').single()
  if (error) throw error; return data
}
export const apiUpdateSupplier = async (id: string, p: { name?: string }) => {
  const { data, error } = await supabase.from('suppliers').update({ name: p.name }).eq('id', id).select('id, name').single()
  if (error) throw error; return data
}
export const apiDeleteSupplier = async (id: string) => {
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) throw error
}

// ── Service Centres (id, name, city) ──────────────────────────────
export const apiGetServiceCentres = async () => {
  const { data, error } = await supabase.from('service_centres').select('id, name, city').order('name')
  if (error) throw error
  return data ?? []
}
export const apiCreateServiceCentre = async (p: { name: string; city?: string }) => {
  const { data, error } = await supabase.from('service_centres').insert({ name: p.name, city: p.city ?? 'Pune' }).select('id, name, city').single()
  if (error) throw error; return data
}
export const apiUpdateServiceCentre = async (id: string, p: { name?: string; city?: string }) => {
  const updates: Record<string, string> = {}
  if (p.name !== undefined) updates.name = p.name
  if (p.city !== undefined) updates.city = p.city
  const { data, error } = await supabase.from('service_centres').update(updates).eq('id', id).select('id, name, city').single()
  if (error) throw error; return data
}
export const apiDeleteServiceCentre = async (id: string) => {
  const { error } = await supabase.from('service_centres').delete().eq('id', id)
  if (error) throw error
}

// ── Customers (id, name, city) ───────────────────────────────────
export const apiGetCustomers = async () => {
  const { data, error } = await supabase.from('customers').select('id, name, city').order('name')
  if (error) throw error
  return data ?? []
}
export const apiCreateCustomer = async (p: { name: string; city?: string }) => {
  const { data, error } = await supabase.from('customers').insert({ name: p.name, city: p.city ?? '' }).select('id, name, city').single()
  if (error) throw error; return data
}
export const apiUpdateCustomer = async (id: string, p: { name?: string; city?: string }) => {
  const updates: Record<string, string> = {}
  if (p.name !== undefined) updates.name = p.name
  if (p.city !== undefined) updates.city = p.city
  const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select('id, name, city').single()
  if (error) throw error; return data
}
export const apiDeleteCustomer = async (id: string) => {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}

// ── Profiles ───────────────────────────────────────────────────
export const apiGetAgents = async () => {
  const { data, error } = await supabase
    .from('profiles').select('id, full_name, role, phone, created_at')
    .in('role', ['agent', 'planner']).order('full_name')
  if (error) throw error; return data ?? []
}
export const apiGetAllProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles').select('id, full_name, role, phone, created_at').order('full_name')
  if (error) throw error; return data ?? []
}
export const apiUpdateUserRole = async (id: string, role: string) => {
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select('id, full_name, role, phone, created_at').single()
  if (error) throw error; return data
}
export const apiUpdateUserProfile = async (id: string, patch: { full_name?: string; phone?: string }) => {
  const updates: Record<string, string> = {}
  if (patch.full_name !== undefined) updates.full_name = patch.full_name
  if (patch.phone    !== undefined) updates.phone     = patch.phone
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select('id, full_name, role, phone, created_at').single()
  if (error) throw error; return data
}

// ── Delivery Orders ──────────────────────────────────────────
export const apiGetDOs = async () => {
  const { data, error } = await supabase
    .from('delivery_orders')
    .select(`id, do_number, expected_collection_date, status, document_url, created_at,
      supplier:suppliers(id,name),
      source_service_centre:service_centres(id,name,city),
      items:do_items(id,coil_grade,thickness_mm,width_mm,quantity,weight_mt)`)
    .order('created_at', { ascending: false })
  if (error) throw error; return data ?? []
}
export const apiGetDO = async (id: string) => {
  const { data, error } = await supabase
    .from('delivery_orders')
    .select(`id, do_number, expected_collection_date, status, document_url, created_at,
      supplier:suppliers(id,name),
      source_service_centre:service_centres(id,name,city),
      items:do_items(id,coil_grade,thickness_mm,width_mm,quantity,weight_mt),
      jobs(id,job_number,status)`)
    .eq('id', id).single()
  if (error) throw error; return data
}
export const apiCreateDO = async (payload: {
  do_number: string; supplier_id: string; source_service_centre_id: string
  expected_collection_date: string; document_url?: string; created_by: string
  items: Array<{ coil_grade: string; thickness_mm: number; width_mm: number; quantity: number; weight_mt: number }>
}) => {
  const { items, ...doPayload } = payload
  const { data: doRow, error: doErr } = await supabase.from('delivery_orders').insert(doPayload).select().single()
  if (doErr) throw doErr
  const { error: itemErr } = await supabase.from('do_items').insert(items.map(i => ({ ...i, do_id: doRow.id })))
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
    .select(`id, job_number, delivery_destination, service_type, packing_type,
      planned_delivery_date, status, created_at,
      do:delivery_orders(id,do_number,source_service_centre:service_centres(id,name,city)),
      customer:customers(id,name,city),
      assigned_agent:profiles(id,full_name,role)`)
    .order('created_at', { ascending: false })
  if (error) throw error; return data ?? []
}
export const apiGetJob = async (id: string) => {
  const { data, error } = await supabase
    .from('jobs')
    .select(`*, do:delivery_orders(*, supplier:suppliers(*), source_service_centre:service_centres(*), items:do_items(*)),
      customer:customers(*), assigned_agent:profiles(id,full_name,role,phone),
      queue_updates(*), expenses(*), deliveries(*)`)
    .eq('id', id).single()
  if (error) throw error; return data
}
export const apiCreateJob = async (payload: {
  job_number: string; do_id: string; customer_id: string; delivery_destination: string
  processing_instructions?: string; service_type: ServiceTypeDB; packing_type?: string
  assigned_agent_id?: string; planned_delivery_date?: string; created_by: string
}) => {
  const { data, error } = await supabase.from('jobs').insert(payload).select().single()
  if (error) throw error; return data
}
export const apiUpdateJobStatus = async (id: string, status: JobStatus, changedBy: string) => {
  const { data: old } = await supabase.from('jobs').select('status').eq('id', id).single()
  const { error } = await supabase.from('jobs').update({ status }).eq('id', id)
  if (error) throw error
  await apiWriteAudit({ entity: 'jobs', entity_id: id, field: 'status', old_value: old?.status ?? '', new_value: status, changed_by: changedBy })
}

// ── Queue Updates ────────────────────────────────────────────
export const apiGetQueueUpdates = async () => {
  const { data, error } = await supabase
    .from('queue_updates')
    .select(`id, queue_number, checkin_time, estimated_processing_minutes,
      processing_started_at, processing_completed_at, notes, created_at,
      service_centre:service_centres(id,name,city),
      logged_by_profile:profiles!queue_updates_logged_by_fkey(id,full_name)`)
    .order('checkin_time', { ascending: false })
  if (error) throw error; return data ?? []
}
export const apiAddQueueUpdate = async (payload: {
  job_id: string; service_centre_id: string; service_type: ServiceTypeDB
  queue_number?: string; checkin_time?: string; estimated_processing_minutes?: number
  notes?: string; gps_lat?: number; gps_lng?: number; logged_by: string
}) => {
  const { data, error } = await supabase.from('queue_updates').insert(payload).select().single()
  if (error) throw error
  await supabase.from('jobs').update({ status: 'at_service_centre' }).eq('id', payload.job_id)
  return data
}
export const apiUpdateQueueEntry = async (id: string, patch: {
  processing_started_at?: string; processing_completed_at?: string; notes?: string
}) => {
  const { error } = await supabase.from('queue_updates').update(patch).eq('id', id)
  if (error) throw error
}

// ── Expenses ─────────────────────────────────────────────────
export const apiGetExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select(`id, category, amount_inr, payee_description, settlement_method,
      status, photo_url, review_notes, reviewed_at, created_at, job_id, logged_by, reviewed_by,
      logged_by_profile:profiles!expenses_logged_by_fkey(id,full_name)`)
    .order('created_at', { ascending: false })
  if (error) throw error; return data ?? []
}
export const apiAddExpense = async (payload: {
  job_id: string; category: string; amount_inr: number; payee_description: string
  settlement_method: string; photo_url?: string; gps_lat?: number; gps_lng?: number; logged_by: string
}) => {
  const { data, error } = await supabase.from('expenses').insert(payload).select().single()
  if (error) throw error; return data
}
export const apiReviewExpense = async (id: string, status: ExpenseStatus, review_notes: string, reviewed_by: string) => {
  const { data: old } = await supabase.from('expenses').select('status').eq('id', id).single()
  const { error } = await supabase.from('expenses').update({ status, review_notes, reviewed_by, reviewed_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  await apiWriteAudit({ entity: 'expenses', entity_id: id, field: 'status', old_value: old?.status ?? '', new_value: status, changed_by: reviewed_by })
}

// ── Deliveries ───────────────────────────────────────────────
export const apiGetDeliveries = async () => {
  const { data, error } = await supabase
    .from('deliveries')
    .select(`id, customer_name, delivery_address, vehicle_number, delivered_at,
      delivery_status, destination_changed, old_destination, new_destination,
      change_reason, authorised_by_office, created_at, job_id,
      created_by_profile:profiles!deliveries_created_by_fkey(id,full_name)`)
    .order('delivered_at', { ascending: false })
  if (error) throw error; return data ?? []
}
export const apiAddDelivery = async (payload: {
  job_id: string; customer_name: string; delivery_address: string; vehicle_number: string
  delivered_at: string; delivery_status?: string; unloaded_photo_url?: string
  final_lat?: number; final_lng?: number; destination_changed?: boolean
  old_destination?: string; new_destination?: string; change_reason?: string
  authorised_by_office?: boolean; created_by: string
}) => {
  const { data, error } = await supabase.from('deliveries').insert(payload).select().single()
  if (error) throw error
  await supabase.from('jobs').update({ status: 'delivered' }).eq('id', payload.job_id)
  return data
}

// ── Storage ─────────────────────────────────────────────────
/**
 * Upload a file to storage and return the public/signed URL.
 * Buckets: 'expense-photos' (public) | 'do-documents' (private)
 * Path convention:
 *   expense-photos/<userId>/<jobId>/<timestamp>.<ext>
 *   do-documents/<userId>/<doId>/<timestamp>.<ext>
 */
export const apiUploadPhoto = async (
  bucket: 'expense-photos' | 'do-documents',
  path: string,
  file: File
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  if (bucket === 'expense-photos') {
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
    return urlData.publicUrl
  } else {
    // private bucket → signed URL valid 1 hour
    const { data: signed, error: signErr } = await supabase.storage
      .from(bucket).createSignedUrl(data.path, 3600)
    if (signErr) throw signErr
    return signed.signedUrl
  }
}

/**
 * Generate a fresh signed URL for a private do-document.
 * Use this when displaying a previously stored DO attachment.
 */
export const apiGetDODocumentUrl = async (path: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('do-documents').createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

// ── Audit log ────────────────────────────────────────────────
const apiWriteAudit = async (entry: {
  entity: string; entity_id: string; field: string
  old_value?: string; new_value?: string; changed_by: string
}) => {
  await supabase.from('audit_log').insert(entry).catch(console.warn)
}
