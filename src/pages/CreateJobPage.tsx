import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { useDataStore } from '@/store/dataStore'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import type { ServiceType, JobStatus } from '@/types'
import { SERVICE_TYPE_LABELS } from '@/types'

const uid = () => Math.random().toString(36).slice(2, 10)

export const CreateJobPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const { dos, customers, profiles, serviceCentres, addJob } = useDataStore()

  const preselectedDO = searchParams.get('do_id') ?? ''

  const agents = profiles.filter(p => p.role === 'agent')

  const [form, setForm] = useState({
    do_id: preselectedDO,
    customer_id: '',
    delivery_destination: '',
    processing_instructions: '',
    service_type: '' as ServiceType | '',
    packing_type: '',
    assigned_agent_id: '',
    planned_delivery_date: '',
  })

  const [submitting, setSubmitting] = useState(false)

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    if (!form.do_id) return 'Select a Delivery Order'
    if (!form.customer_id) return 'Select a customer'
    if (!form.delivery_destination.trim()) return 'Delivery destination is required'
    if (!form.service_type) return 'Select a service type'
    if (!form.packing_type.trim()) return 'Packing type is required'
    if (!form.assigned_agent_id) return 'Assign a delivery agent'
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { toast.error(err); return }
    setSubmitting(true)

    const do_ = dos.find(d => d.id === form.do_id)
    const customer = customers.find(c => c.id === form.customer_id)
    const agent = profiles.find(p => p.id === form.assigned_agent_id)
    const sc = serviceCentres.find(s => s.id === do_?.source_service_centre_id)
    const jobNum = `JOB-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`

    addJob({
      id: uid(),
      job_number: jobNum,
      do_id: form.do_id,
      customer_id: form.customer_id,
      customer_name: customer?.name,
      delivery_destination: form.delivery_destination.trim(),
      processing_instructions: form.processing_instructions.trim(),
      service_type: form.service_type as ServiceType,
      packing_type: form.packing_type.trim(),
      assigned_agent_id: form.assigned_agent_id,
      planned_delivery_date: form.planned_delivery_date || undefined,
      status: 'assigned' as JobStatus,
      created_at: new Date().toISOString(),
      do: do_,
      customer,
      assigned_agent: agent,
      queue_updates: [],
      expenses: [],
      deliveries: [],
    })

    toast.success(`${jobNum} created and assigned to ${agent?.full_name}`)
    setTimeout(() => navigate('/jobs'), 300)
  }

  if (user?.role !== 'planner' && user?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[--color-ink-muted]">Only the Planning team can create Job Cards.</p>
      </div>
    )
  }

  const selectedDO = dos.find(d => d.id === form.do_id)

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[--color-surface-bg] transition-colors">
          <ArrowLeft size={16} className="text-[--color-ink-muted]" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[--color-ink]">New Job Card</h1>
          <p className="text-xs text-[--color-ink-muted]">Plan processing and assign to delivery agent</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Link to DO */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase size={15} className="text-[--color-primary]" />
            <span className="text-sm font-semibold text-[--color-ink]">Link to Delivery Order</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Delivery Order *</label>
              <select
                value={form.do_id}
                onChange={e => setField('do_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
              >
                <option value="">Select DO…</option>
                {dos.filter(d => d.status !== 'closed').map(d => (
                  <option key={d.id} value={d.id}>{d.do_number} — {d.supplier?.name}</option>
                ))}
              </select>
            </div>
            {selectedDO && (
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-800 space-y-1">
                <div><span className="font-semibold">SC:</span> {selectedDO.source_service_centre?.name}</div>
                <div><span className="font-semibold">Items:</span> {selectedDO.items.length} coil(s) — {selectedDO.items.map(i => i.coil_grade).join(', ')}</div>
                <div><span className="font-semibold">Collect by:</span> {selectedDO.expected_collection_date}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Customer & Destination */}
        <Card>
          <span className="text-sm font-semibold text-[--color-ink] block mb-4">Customer & Delivery</span>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Customer *</label>
              <select
                value={form.customer_id}
                onChange={e => {
                  const c = customers.find(c => c.id === e.target.value)
                  setForm(f => ({ ...f, customer_id: e.target.value, delivery_destination: c ? `${c.name}, ${c.city}` : f.delivery_destination }))
                }}
                className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
              >
                <option value="">Select customer…</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} – {c.city}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Delivery Destination *</label>
              <input
                type="text"
                value={form.delivery_destination}
                onChange={e => setField('delivery_destination', e.target.value)}
                placeholder="Full address / landmark"
                className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Planned Delivery Date</label>
              <input
                type="date"
                value={form.planned_delivery_date}
                onChange={e => setField('planned_delivery_date', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
              />
            </div>
          </div>
        </Card>

        {/* Processing Instructions */}
        <Card>
          <span className="text-sm font-semibold text-[--color-ink] block mb-4">Processing Instructions</span>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Service Type *</label>
              <select
                value={form.service_type}
                onChange={e => setField('service_type', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
              >
                <option value="">Select type…</option>
                {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Packing Type *</label>
              <input
                type="text"
                value={form.packing_type}
                onChange={e => setField('packing_type', e.target.value)}
                placeholder="e.g. Pallet + Strips, Paper Wrap"
                className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Instructions for Agent</label>
              <textarea
                rows={4}
                value={form.processing_instructions}
                onChange={e => setField('processing_instructions', e.target.value)}
                placeholder="Cut sizes, slit widths, special packing notes…"
                className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Agent Assignment */}
        <Card>
          <span className="text-sm font-semibold text-[--color-ink] block mb-4">Agent Assignment</span>
          <div>
            <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Delivery Agent *</label>
            <select
              value={form.assigned_agent_id}
              onChange={e => setField('assigned_agent_id', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
            >
              <option value="">Select agent…</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.full_name} {a.phone ? `· ${a.phone}` : ''}</option>)}
            </select>
          </div>
        </Card>

        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 py-3 text-sm font-semibold rounded-xl border border-[--color-border] text-[--color-ink-muted] hover:bg-[--color-surface-bg] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 py-3 text-sm font-semibold rounded-xl bg-[--color-primary] text-white hover:bg-[--color-primary-hover] transition-colors disabled:opacity-50">
            {submitting ? 'Creating…' : 'Create Job Card'}
          </button>
        </div>
      </form>
    </div>
  )
}
