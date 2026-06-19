import { create } from 'zustand'
import {
  DEMO_DOS, DEMO_JOBS, DEMO_EXPENSES, DEMO_QUEUE,
  DEMO_DELIVERIES, DEMO_SUPPLIERS, DEMO_SERVICE_CENTRES, DEMO_CUSTOMERS, DEMO_PROFILES
} from '@/lib/demoData'
import type {
  DeliveryOrder, Job, Expense, QueueUpdate, Delivery,
  DOStatus, JobStatus, ExpenseStatus, Supplier, ServiceCentre, Customer, Profile
} from '@/types'

interface AuditEntry {
  id: string
  entity: string
  entity_id: string
  field: string
  old_value: string
  new_value: string
  changed_by: string
  changed_at: string
}

interface DataState {
  // master data
  suppliers: Supplier[]
  serviceCentres: ServiceCentre[]
  customers: Customer[]
  profiles: Profile[]

  // transactional data
  dos: DeliveryOrder[]
  jobs: Job[]
  expenses: Expense[]
  queueUpdates: QueueUpdate[]
  deliveries: Delivery[]
  auditLog: AuditEntry[]

  // DO actions
  addDO: (do_: DeliveryOrder) => void
  updateDOStatus: (id: string, status: DOStatus, changedBy: string) => void

  // Job actions
  addJob: (job: Job) => void
  updateJobStatus: (id: string, status: JobStatus, changedBy: string) => void

  // Expense actions
  addExpense: (expense: Expense) => void
  reviewExpense: (id: string, status: ExpenseStatus, notes: string, reviewedBy: string) => void

  // Queue actions
  addQueueUpdate: (entry: QueueUpdate) => void
  updateQueueEntry: (id: string, patch: Partial<QueueUpdate>) => void

  // Delivery actions
  addDelivery: (delivery: Delivery) => void

  // Audit helper
  _audit: (entry: Omit<AuditEntry, 'id' | 'changed_at'>) => void
}

const uid = () => Math.random().toString(36).slice(2, 10)

export const useDataStore = create<DataState>((set, get) => ({
  suppliers: DEMO_SUPPLIERS,
  serviceCentres: DEMO_SERVICE_CENTRES,
  customers: DEMO_CUSTOMERS,
  profiles: DEMO_PROFILES,

  dos: DEMO_DOS,
  jobs: DEMO_JOBS,
  expenses: DEMO_EXPENSES,
  queueUpdates: DEMO_QUEUE,
  deliveries: DEMO_DELIVERIES,
  auditLog: [],

  _audit: (entry) => set(s => ({
    auditLog: [...s.auditLog, { ...entry, id: uid(), changed_at: new Date().toISOString() }]
  })),

  addDO: (do_) => {
    set(s => ({ dos: [...s.dos, do_] }))
    get()._audit({ entity: 'DeliveryOrder', entity_id: do_.id, field: 'status', old_value: '', new_value: do_.status, changed_by: do_.id })
  },

  updateDOStatus: (id, status, changedBy) => set(s => {
    const old = s.dos.find(d => d.id === id)?.status ?? ''
    get()._audit({ entity: 'DeliveryOrder', entity_id: id, field: 'status', old_value: old, new_value: status, changed_by: changedBy })
    return { dos: s.dos.map(d => d.id === id ? { ...d, status } : d) }
  }),

  addJob: (job) => {
    set(s => ({
      jobs: [...s.jobs, job],
      dos: s.dos.map(d => d.id === job.do_id ? { ...d, status: 'active' as DOStatus } : d)
    }))
    get()._audit({ entity: 'Job', entity_id: job.id, field: 'status', old_value: '', new_value: job.status, changed_by: job.id })
  },

  updateJobStatus: (id, status, changedBy) => set(s => {
    const old = s.jobs.find(j => j.id === id)?.status ?? ''
    get()._audit({ entity: 'Job', entity_id: id, field: 'status', old_value: old, new_value: status, changed_by: changedBy })
    return { jobs: s.jobs.map(j => j.id === id ? { ...j, status } : j) }
  }),

  addExpense: (expense) => {
    set(s => ({ expenses: [...s.expenses, expense] }))
    get()._audit({ entity: 'Expense', entity_id: expense.id, field: 'status', old_value: '', new_value: 'pending', changed_by: expense.logged_by })
  },

  reviewExpense: (id, status, notes, reviewedBy) => set(s => {
    const old = s.expenses.find(e => e.id === id)?.status ?? ''
    get()._audit({ entity: 'Expense', entity_id: id, field: 'status', old_value: old, new_value: status, changed_by: reviewedBy })
    return {
      expenses: s.expenses.map(e => e.id === id
        ? { ...e, status, review_notes: notes, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() }
        : e
      )
    }
  }),

  addQueueUpdate: (entry) => {
    set(s => ({
      queueUpdates: [...s.queueUpdates, entry],
      jobs: s.jobs.map(j => j.id === entry.job_id
        ? { ...j, status: 'at_service_centre' as JobStatus, queue_updates: [...(j.queue_updates ?? []), entry] }
        : j
      )
    }))
    get()._audit({ entity: 'QueueUpdate', entity_id: entry.id, field: 'checkin', old_value: '', new_value: entry.checkin_time, changed_by: entry.logged_by })
  },

  updateQueueEntry: (id, patch) => set(s => ({
    queueUpdates: s.queueUpdates.map(q => q.id === id ? { ...q, ...patch } : q)
  })),

  addDelivery: (delivery) => {
    set(s => ({
      deliveries: [...s.deliveries, delivery],
      jobs: s.jobs.map(j => j.id === delivery.job_id
        ? { ...j, status: 'delivered' as JobStatus, deliveries: [...(j.deliveries ?? []), delivery] }
        : j
      )
    }))
    get()._audit({ entity: 'Delivery', entity_id: delivery.id, field: 'status', old_value: '', new_value: delivery.delivery_status, changed_by: delivery.created_by })
  },
}))
