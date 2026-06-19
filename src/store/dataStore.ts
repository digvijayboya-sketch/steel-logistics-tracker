/**
 * dataStore.ts – Zustand store that talks to Supabase via api.ts.
 * The store is the single source of truth for UI state; Supabase is the
 * source of truth for persistence. On each fetch the store is refreshed.
 */
import { create } from 'zustand'
import {
  apiGetSuppliers, apiGetServiceCentres, apiGetCustomers, apiGetAgents,
  apiGetDOs, apiGetDO, apiCreateDO, apiUpdateDOStatus,
  apiGetJobs, apiGetJob, apiCreateJob, apiUpdateJobStatus,
  apiGetQueueUpdates, apiAddQueueUpdate, apiUpdateQueueEntry,
  apiGetExpenses, apiAddExpense, apiReviewExpense,
  apiGetDeliveries, apiAddDelivery,
} from '@/lib/api'
import type {
  DeliveryOrder, Job, Expense, QueueUpdate, Delivery,
  DOStatus, JobStatus, ExpenseStatus, Supplier, ServiceCentre, Customer, Profile,
} from '@/types'

interface LoadingState { [key: string]: boolean }

interface DataState {
  // ── Master data ────────────────────────────────────────────
  suppliers:      Supplier[]
  serviceCentres: ServiceCentre[]
  customers:      Customer[]
  profiles:       Profile[]     // agents list

  // ── Transactional data ─────────────────────────────────────
  dos:          DeliveryOrder[]
  jobs:         Job[]
  expenses:     Expense[]
  queueUpdates: QueueUpdate[]
  deliveries:   Delivery[]

  // ── Loading / error flags ──────────────────────────────────
  loading: LoadingState
  error:   string | null

  // ── Fetch actions ──────────────────────────────────────────
  fetchLookups:      () => Promise<void>
  fetchDOs:          () => Promise<void>
  fetchDO:           (id: string) => Promise<void>
  fetchJobs:         () => Promise<void>
  fetchJob:          (id: string) => Promise<void>
  fetchQueueUpdates: () => Promise<void>
  fetchExpenses:     () => Promise<void>
  fetchDeliveries:   () => Promise<void>

  // ── Mutation actions ───────────────────────────────────────
  createDO:         (payload: Parameters<typeof apiCreateDO>[0])         => Promise<string>
  updateDOStatus:   (id: string, status: DOStatus,   userId: string)     => Promise<void>
  createJob:        (payload: Parameters<typeof apiCreateJob>[0])        => Promise<string>
  updateJobStatus:  (id: string, status: JobStatus,  userId: string)     => Promise<void>
  addQueueUpdate:   (payload: Parameters<typeof apiAddQueueUpdate>[0])   => Promise<void>
  updateQueueEntry: (id: string, patch: Parameters<typeof apiUpdateQueueEntry>[1]) => Promise<void>
  addExpense:       (payload: Parameters<typeof apiAddExpense>[0])       => Promise<void>
  reviewExpense:    (id: string, status: ExpenseStatus, notes: string, userId: string) => Promise<void>
  addDelivery:      (payload: Parameters<typeof apiAddDelivery>[0])      => Promise<void>
}

const setLoading = (key: string, val: boolean) =>
  (s: DataState): Partial<DataState> => ({ loading: { ...s.loading, [key]: val } })

export const useDataStore = create<DataState>((set, get) => ({
  suppliers:      [],
  serviceCentres: [],
  customers:      [],
  profiles:       [],
  dos:            [],
  jobs:           [],
  expenses:       [],
  queueUpdates:   [],
  deliveries:     [],
  loading:        {},
  error:          null,

  // ── Fetch lookups ──────────────────────────────────────────
  fetchLookups: async () => {
    set(setLoading('lookups', true))
    try {
      const [suppliers, serviceCentres, customers, profiles] = await Promise.all([
        apiGetSuppliers(), apiGetServiceCentres(), apiGetCustomers(), apiGetAgents(),
      ])
      set({ suppliers, serviceCentres, customers, profiles })
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to load lookups' })
    } finally {
      set(setLoading('lookups', false))
    }
  },

  // ── Fetch DOs ─────────────────────────────────────────────
  fetchDOs: async () => {
    set(setLoading('dos', true))
    try {
      const dos = await apiGetDOs() as unknown as DeliveryOrder[]
      set({ dos })
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to load DOs' })
    } finally {
      set(setLoading('dos', false))
    }
  },

  fetchDO: async (id) => {
    set(setLoading(`do_${id}`, true))
    try {
      const do_ = await apiGetDO(id) as unknown as DeliveryOrder
      set(s => ({ dos: s.dos.some(d => d.id === id) ? s.dos.map(d => d.id === id ? do_ : d) : [...s.dos, do_] }))
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to load DO' })
    } finally {
      set(setLoading(`do_${id}`, false))
    }
  },

  // ── Fetch Jobs ─────────────────────────────────────────────
  fetchJobs: async () => {
    set(setLoading('jobs', true))
    try {
      const jobs = await apiGetJobs() as unknown as Job[]
      set({ jobs })
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to load jobs' })
    } finally {
      set(setLoading('jobs', false))
    }
  },

  fetchJob: async (id) => {
    set(setLoading(`job_${id}`, true))
    try {
      const job = await apiGetJob(id) as unknown as Job
      set(s => ({ jobs: s.jobs.some(j => j.id === id) ? s.jobs.map(j => j.id === id ? job : j) : [...s.jobs, job] }))
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Failed to load job' })
    } finally {
      set(setLoading(`job_${id}`, false))
    }
  },

  // ── Fetch Queue, Expenses, Deliveries ─────────────────────
  fetchQueueUpdates: async () => {
    set(setLoading('queue', true))
    try { set({ queueUpdates: await apiGetQueueUpdates() as unknown as QueueUpdate[] }) }
    catch (e: unknown) { set({ error: e instanceof Error ? e.message : 'Failed' }) }
    finally { set(setLoading('queue', false)) }
  },

  fetchExpenses: async () => {
    set(setLoading('expenses', true))
    try { set({ expenses: await apiGetExpenses() as unknown as Expense[] }) }
    catch (e: unknown) { set({ error: e instanceof Error ? e.message : 'Failed' }) }
    finally { set(setLoading('expenses', false)) }
  },

  fetchDeliveries: async () => {
    set(setLoading('deliveries', true))
    try { set({ deliveries: await apiGetDeliveries() as unknown as Delivery[] }) }
    catch (e: unknown) { set({ error: e instanceof Error ? e.message : 'Failed' }) }
    finally { set(setLoading('deliveries', false)) }
  },

  // ── Mutation: DOs ──────────────────────────────────────────
  createDO: async (payload) => {
    const row = await apiCreateDO(payload)
    await get().fetchDOs()
    return row.id
  },

  updateDOStatus: async (id, status, userId) => {
    await apiUpdateDOStatus(id, status, userId)
    set(s => ({ dos: s.dos.map(d => d.id === id ? { ...d, status } : d) }))
  },

  // ── Mutation: Jobs ─────────────────────────────────────────
  createJob: async (payload) => {
    const row = await apiCreateJob(payload)
    await get().fetchJobs()
    return row.id
  },

  updateJobStatus: async (id, status, userId) => {
    await apiUpdateJobStatus(id, status, userId)
    set(s => ({ jobs: s.jobs.map(j => j.id === id ? { ...j, status } : j) }))
  },

  // ── Mutation: Queue ────────────────────────────────────────
  addQueueUpdate: async (payload) => {
    await apiAddQueueUpdate(payload)
    await get().fetchQueueUpdates()
  },

  updateQueueEntry: async (id, patch) => {
    await apiUpdateQueueEntry(id, patch)
    set(s => ({ queueUpdates: s.queueUpdates.map(q => q.id === id ? { ...q, ...patch } : q) }))
  },

  // ── Mutation: Expenses ─────────────────────────────────────
  addExpense: async (payload) => {
    await apiAddExpense(payload)
    await get().fetchExpenses()
  },

  reviewExpense: async (id, status, notes, userId) => {
    await apiReviewExpense(id, status, notes, userId)
    set(s => ({
      expenses: s.expenses.map(e => e.id === id
        ? { ...e, status, review_notes: notes, reviewed_by: userId, reviewed_at: new Date().toISOString() }
        : e
      )
    }))
  },

  // ── Mutation: Deliveries ───────────────────────────────────
  addDelivery: async (payload) => {
    await apiAddDelivery(payload)
    await get().fetchDeliveries()
  },
}))
