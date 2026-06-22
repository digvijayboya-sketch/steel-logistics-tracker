/**
 * dataStore.ts – Zustand store that talks to Supabase via api.ts.
 * All types match the EXACT database schema.
 * DOStatus includes 'cancelled' (added for Cancel DO feature).
 */
import { create } from 'zustand'
import {
  apiGetSuppliers, apiGetServiceCentres, apiGetCustomers, apiGetAgents, apiGetAllProfiles,
  apiGetDOs, apiGetDO, apiCreateDO, apiUpdateDOStatus,
  apiGetJobs, apiGetJob, apiCreateJob, apiUpdateJobStatus,
  apiGetQueueUpdates, apiAddQueueUpdate, apiUpdateQueueEntry,
  apiGetExpenses, apiAddExpense, apiReviewExpense,
  apiGetDeliveries, apiAddDelivery,
  apiCreateSupplier, apiUpdateSupplier, apiDeleteSupplier,
  apiCreateServiceCentre, apiUpdateServiceCentre, apiDeleteServiceCentre,
  apiCreateCustomer, apiUpdateCustomer, apiDeleteCustomer,
  apiUpdateUserRole, apiUpdateUserProfile,
} from '@/lib/api'

// ── Exact DB types ───────────────────────────────────────────────
export interface Supplier       { id: string; name: string }
export interface ServiceCentre  { id: string; name: string; city: string }
export interface Customer       { id: string; name: string; city: string }
export interface Profile        { id: string; full_name: string | null; role: 'admin'|'planner'|'purchase'|'agent' | null; phone: string | null; created_at: string }

// ← 'cancelled' added
export type DOStatus  = 'draft'|'active'|'partially_dispatched'|'fully_dispatched'|'closed'|'cancelled'
export type JobStatus = 'assigned'|'acknowledged'|'at_service_centre'|'processing'|'processing_done'|'in_transit_to_customer'|'delivered'|'cancelled'
export type ExpenseStatus = 'pending'|'approved'|'rejected'

export interface DeliveryOrder {
  id: string; do_number: string; expected_collection_date: string
  status: DOStatus; document_url?: string | null; created_at: string
  supplier?: Supplier | null
  source_service_centre?: ServiceCentre | null
  items?: any[]
  jobs?: any[]
}

export interface Job {
  id: string; job_number: string; delivery_destination: string
  service_type: string; packing_type?: string | null
  planned_delivery_date?: string | null; status: JobStatus
  created_at: string; assigned_agent_id?: string | null
  do?: any; customer?: Customer | null; assigned_agent?: Pick<Profile,'id'|'full_name'|'role'> | null
  queue_updates?: any[]; expenses?: any[]; deliveries?: any[]
}

export interface Expense {
  id: string; category: string; amount_inr: number
  payee_description: string; settlement_method: string
  status: ExpenseStatus; photo_url?: string | null
  review_notes?: string | null; reviewed_at?: string | null
  created_at: string; job_id: string; logged_by: string
  reviewed_by?: string | null
}

export interface QueueUpdate {
  id: string; job_id: string; queue_number?: string | null
  checkin_time: string; estimated_processing_minutes?: number | null
  processing_started_at?: string | null; processing_completed_at?: string | null
  notes?: string | null; created_at: string
  service_centre?: ServiceCentre | null
}

export interface Delivery {
  id: string; job_id: string; customer_name: string
  delivery_address: string; vehicle_number: string
  delivered_at: string; delivery_status: string
  destination_changed: boolean; old_destination?: string | null
  new_destination?: string | null; change_reason?: string | null
  authorised_by_office: boolean; created_at: string
}

type LS = Record<string, boolean>

interface DataState {
  suppliers:      Supplier[]
  serviceCentres: ServiceCentre[]
  customers:      Customer[]
  profiles:       Profile[]
  allProfiles:    Profile[]
  dos:            DeliveryOrder[]
  jobs:           Job[]
  expenses:       Expense[]
  queueUpdates:   QueueUpdate[]
  deliveries:     Delivery[]
  loading: LS
  error:   string | null

  fetchLookups:     () => Promise<void>
  fetchAllProfiles: () => Promise<void>
  fetchDOs:         () => Promise<void>
  fetchDO:          (id: string) => Promise<void>
  fetchJobs:        () => Promise<void>
  fetchJob:         (id: string) => Promise<void>
  fetchQueueUpdates:() => Promise<void>
  fetchExpenses:    () => Promise<void>
  fetchDeliveries:  () => Promise<void>

  createDO:        (p: Parameters<typeof apiCreateDO>[0]) => Promise<string>
  updateDOStatus:  (id: string, s: DOStatus, uid: string)  => Promise<void>
  createJob:       (p: Parameters<typeof apiCreateJob>[0]) => Promise<string>
  updateJobStatus: (id: string, s: JobStatus, uid: string) => Promise<void>
  addQueueUpdate:  (p: Parameters<typeof apiAddQueueUpdate>[0]) => Promise<void>
  updateQueueEntry:(id: string, p: Parameters<typeof apiUpdateQueueEntry>[1]) => Promise<void>
  addExpense:      (p: Parameters<typeof apiAddExpense>[0]) => Promise<void>
  reviewExpense:   (id: string, s: ExpenseStatus, notes: string, uid: string) => Promise<void>
  addDelivery:     (p: Parameters<typeof apiAddDelivery>[0]) => Promise<void>

  createSupplier:      (p: { name: string })             => Promise<void>
  updateSupplier:      (id: string, p: { name?: string }) => Promise<void>
  deleteSupplier:      (id: string)                      => Promise<void>
  createServiceCentre: (p: { name: string; city?: string })              => Promise<void>
  updateServiceCentre: (id: string, p: { name?: string; city?: string }) => Promise<void>
  deleteServiceCentre: (id: string)                                       => Promise<void>
  createCustomer:      (p: { name: string; city?: string })              => Promise<void>
  updateCustomer:      (id: string, p: { name?: string; city?: string }) => Promise<void>
  deleteCustomer:      (id: string)                                       => Promise<void>
  updateUserRole:    (id: string, role: string) => Promise<void>
  updateUserProfile: (id: string, p: { full_name?: string; phone?: string }) => Promise<void>
}

const setL = (key: string, val: boolean) =>
  (s: DataState): Partial<DataState> => ({ loading: { ...s.loading, [key]: val } })

export const useDataStore = create<DataState>((set, get) => ({
  suppliers: [], serviceCentres: [], customers: [], profiles: [], allProfiles: [],
  dos: [], jobs: [], expenses: [], queueUpdates: [], deliveries: [],
  loading: {}, error: null,

  fetchLookups: async () => {
    set(setL('lookups', true))
    try {
      const [suppliers, serviceCentres, customers, profiles] = await Promise.all([
        apiGetSuppliers(), apiGetServiceCentres(), apiGetCustomers(), apiGetAgents(),
      ])
      set({
        suppliers:      suppliers as Supplier[],
        serviceCentres: serviceCentres as ServiceCentre[],
        customers:      customers as Customer[],
        profiles:       profiles as unknown as Profile[],
      })
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed' })
    } finally { set(setL('lookups', false)) }
  },

  fetchAllProfiles: async () => {
    set(setL('allProfiles', true))
    try {
      set({ allProfiles: await apiGetAllProfiles() as unknown as Profile[] })
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed' })
    } finally { set(setL('allProfiles', false)) }
  },

  fetchDOs: async () => {
    set(setL('dos', true))
    try { set({ dos: await apiGetDOs() as unknown as DeliveryOrder[] }) }
    catch (e: unknown) { set({ error: e instanceof Error ? e.message : 'Failed' }) }
    finally { set(setL('dos', false)) }
  },
  fetchDO: async (id) => {
    set(setL(`do_${id}`, true))
    try {
      const d = await apiGetDO(id) as unknown as DeliveryOrder
      set(s => ({ dos: s.dos.some(x => x.id === id) ? s.dos.map(x => x.id === id ? d : x) : [...s.dos, d] }))
    } catch (e: unknown) { set({ error: e instanceof Error ? e.message : 'Failed' }) }
    finally { set(setL(`do_${id}`, false)) }
  },

  fetchJobs: async () => {
    set(setL('jobs', true))
    try { set({ jobs: await apiGetJobs() as unknown as Job[] }) }
    catch (e: unknown) { set({ error: e instanceof Error ? e.message : 'Failed' }) }
    finally { set(setL('jobs', false)) }
  },
  fetchJob: async (id) => {
    set(setL(`job_${id}`, true))
    try {
      const j = await apiGetJob(id) as unknown as Job
      set(s => ({ jobs: s.jobs.some(x => x.id === id) ? s.jobs.map(x => x.id === id ? j : x) : [...s.jobs, j] }))
    } catch (e: unknown) { set({ error: e instanceof Error ? e.message : 'Failed' }) }
    finally { set(setL(`job_${id}`, false)) }
  },

  fetchQueueUpdates: async () => {
    set(setL('queue', true))
    try { set({ queueUpdates: await apiGetQueueUpdates() as unknown as QueueUpdate[] }) }
    catch (e: unknown) { set({ error: e instanceof Error ? e.message : 'Failed' }) }
    finally { set(setL('queue', false)) }
  },
  fetchExpenses: async () => {
    set(setL('expenses', true))
    try { set({ expenses: await apiGetExpenses() as unknown as Expense[] }) }
    catch (e: unknown) { set({ error: e instanceof Error ? e.message : 'Failed' }) }
    finally { set(setL('expenses', false)) }
  },
  fetchDeliveries: async () => {
    set(setL('deliveries', true))
    try { set({ deliveries: await apiGetDeliveries() as unknown as Delivery[] }) }
    catch (e: unknown) { set({ error: e instanceof Error ? e.message : 'Failed' }) }
    finally { set(setL('deliveries', false)) }
  },

  createDO: async (p) => { const r = await apiCreateDO(p); await get().fetchDOs(); return r.id },
  updateDOStatus: async (id, status, uid) => {
    await apiUpdateDOStatus(id, status, uid)
    set(s => ({ dos: s.dos.map(d => d.id === id ? { ...d, status } : d) }))
  },
  createJob: async (p) => { const r = await apiCreateJob(p); await get().fetchJobs(); return r.id },
  updateJobStatus: async (id, status, uid) => {
    await apiUpdateJobStatus(id, status, uid)
    set(s => ({ jobs: s.jobs.map(j => j.id === id ? { ...j, status } : j) }))
  },
  addQueueUpdate: async (p) => { await apiAddQueueUpdate(p); await get().fetchQueueUpdates() },
  updateQueueEntry: async (id, p) => {
    await apiUpdateQueueEntry(id, p)
    set(s => ({ queueUpdates: s.queueUpdates.map(q => q.id === id ? { ...q, ...p } : q) }))
  },
  addExpense: async (p) => { await apiAddExpense(p); await get().fetchExpenses() },
  reviewExpense: async (id, status, notes, uid) => {
    await apiReviewExpense(id, status, notes, uid)
    set(s => ({ expenses: s.expenses.map(e => e.id === id ? { ...e, status, review_notes: notes, reviewed_by: uid, reviewed_at: new Date().toISOString() } : e) }))
  },
  addDelivery: async (p) => { await apiAddDelivery(p); await get().fetchDeliveries() },

  createSupplier: async (p) => {
    await apiCreateSupplier(p)
    set({ suppliers: await apiGetSuppliers() as Supplier[] })
  },
  updateSupplier: async (id, p) => {
    await apiUpdateSupplier(id, p)
    set({ suppliers: await apiGetSuppliers() as Supplier[] })
  },
  deleteSupplier: async (id) => {
    await apiDeleteSupplier(id)
    set(s => ({ suppliers: s.suppliers.filter(x => x.id !== id) }))
  },

  createServiceCentre: async (p) => {
    await apiCreateServiceCentre(p)
    set({ serviceCentres: await apiGetServiceCentres() as ServiceCentre[] })
  },
  updateServiceCentre: async (id, p) => {
    await apiUpdateServiceCentre(id, p)
    set({ serviceCentres: await apiGetServiceCentres() as ServiceCentre[] })
  },
  deleteServiceCentre: async (id) => {
    await apiDeleteServiceCentre(id)
    set(s => ({ serviceCentres: s.serviceCentres.filter(x => x.id !== id) }))
  },

  createCustomer: async (p) => {
    await apiCreateCustomer(p)
    set({ customers: await apiGetCustomers() as Customer[] })
  },
  updateCustomer: async (id, p) => {
    await apiUpdateCustomer(id, p)
    set({ customers: await apiGetCustomers() as Customer[] })
  },
  deleteCustomer: async (id) => {
    await apiDeleteCustomer(id)
    set(s => ({ customers: s.customers.filter(x => x.id !== id) }))
  },

  updateUserRole: async (id, role) => {
    await apiUpdateUserRole(id, role)
    set(s => ({ allProfiles: s.allProfiles.map(p => p.id === id ? { ...p, role: role as Profile['role'] } : p) }))
  },
  updateUserProfile: async (id, patch) => {
    await apiUpdateUserProfile(id, patch)
    set(s => ({ allProfiles: s.allProfiles.map(p => p.id === id ? { ...p, ...patch } : p) }))
  },
}))
