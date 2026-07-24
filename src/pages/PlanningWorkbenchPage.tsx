import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { useRole } from '@/hooks/useRole'
import { useDataStore } from '@/store/dataStore'
import { supabase } from '@/lib/supabase'
import { ClipboardList, Package, AlertTriangle, Loader2, ArrowRight, History, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { SERVICE_TYPE_LABELS, DO_STATUS_LABELS, JOB_STATUS_LABELS } from '@/types'
import type { ServiceType, DOStatus, JobStatus } from '@/types'
import { formatDate } from '@/lib/utils'

type PlanFilter = 'all' | 'unplanned' | 'planned' | 'revised'
type PlanStatus = 'unplanned' | 'planned' | 'revised'

const PLAN_FILTERS: { value: PlanFilter; label: string; color: string }[] = [
  { value: 'all',       label: 'All',       color: 'var(--accent)' },
  { value: 'unplanned', label: 'Unplanned', color: '#60a5fa' },
  { value: 'planned',   label: 'Planned',   color: '#34d399' },
  { value: 'revised',   label: 'Plan Revised', color: '#a78bfa' },
]

const inp: React.CSSProperties = {
  width:'100%', padding:'0.55rem 0.75rem', borderRadius:'0.55rem',
  border:'1px solid var(--input-border)', background:'var(--input-bg)',
  color:'var(--tx1)', fontSize:'0.875rem', outline:'none', boxSizing:'border-box' as const,
}
const lbl: React.CSSProperties = {
  display:'block', fontSize:'0.70rem', fontWeight:700,
  color:'var(--tx4)', textTransform:'uppercase' as const,
  letterSpacing:'0.07em', marginBottom:4,
}
const DO_COLORS: Record<string, string> = {
  draft: '#94a3b8', active: '#60a5fa', partially_dispatched: '#fbbf24',
  fully_dispatched: '#34d399', closed: '#6b7280', cancelled: '#f87171',
}

const OVER_ALLOCATION_THRESHOLD = 3

export const PlanningWorkbenchPage = () => {
  const [sp] = useSearchParams()
  const { user } = useAuthStore()
  const { isAdmin, isPlanner } = useRole()
  const {
    dos, jobs, profiles, customers, loading,
    fetchDOs, fetchJobs, fetchLookups, createJob,
  } = useDataStore()

  useEffect(() => { fetchDOs(); fetchJobs(); fetchLookups() }, [])

  const [revisedJobIds, setRevisedJobIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    supabase.from('audit_log').select('entity_id').eq('entity', 'jobs').like('field', 'plan_%')
      .then(({ data }) => setRevisedJobIds(new Set((data ?? []).map(r => r.entity_id))))
  }, [])

  const [planFilter, setPlanFilter] = useState<PlanFilter>('all')
  const [selectedDoId, setSelectedDoId] = useState(sp.get('do') ?? '')
  const [form, setForm] = useState({
    customer_id: '',
    delivery_destination: '',
    service_type: 'ctl' as ServiceType,
    packing_type: '',
    assigned_agent_id: '',
    planned_delivery_date: '',
    processing_instructions: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const canAccess = isAdmin || isPlanner
  if (!canAccess) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--tx3)' }}>
      Only Planner / Admin can access the Planning Workbench.
    </div>
  )

  const isLoading = loading['dos'] || loading['jobs'] || loading['lookups']

  const jobByDoId = useMemo(() => {
    const m = new Map<string, typeof jobs[0]>()
    for (const j of jobs) if (j.do?.id) m.set(j.do.id, j)
    return m
  }, [jobs])

  const planStatusOf = (doId: string): PlanStatus => {
    const job = jobByDoId.get(doId)
    if (!job) return 'unplanned'
    return revisedJobIds.has(job.id) ? 'revised' : 'planned'
  }

  // The workbench only deals with active DOs — draft/closed/cancelled aren't part of the planning lifecycle.
  const activeDOs = useMemo(() => dos.filter(d => d.status === 'active'), [dos])
  const planCounts = useMemo(() => {
    const c: Record<PlanStatus, number> = { unplanned: 0, planned: 0, revised: 0 }
    for (const d of activeDOs) c[planStatusOf(d.id)]++
    return c
  }, [activeDOs, jobByDoId, revisedJobIds])

  const filteredDOs = useMemo(
    () => planFilter === 'all' ? activeDOs : activeDOs.filter(d => planStatusOf(d.id) === planFilter),
    [activeDOs, planFilter, jobByDoId, revisedJobIds]
  )
  const unplannedDOs = filteredDOs
  const selectedDO = dos.find(d => d.id === selectedDoId)
  const selectedDOJob = selectedDoId ? jobByDoId.get(selectedDoId) : undefined
  const selectedDOPlanStatus = selectedDoId ? planStatusOf(selectedDoId) : 'unplanned'
  const agents = profiles.filter(p => p.role === 'agent' || (p.role as string) === 'manager')

  const agentActiveJobCount = form.assigned_agent_id
    ? jobs.filter(j => j.assigned_agent_id === form.assigned_agent_id && !['delivered', 'cancelled'].includes(j.status)).length
    : 0
  const overAllocated = agentActiveJobCount > OVER_ALLOCATION_THRESHOLD

  const selectDO = (id: string) => {
    setSelectedDoId(id)
    setForm({
      customer_id: '', delivery_destination: '', service_type: 'ctl',
      packing_type: '', assigned_agent_id: '', planned_delivery_date: '', processing_instructions: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoId)                     { toast.error('Select an unplanned DO'); return }
    if (!form.customer_id)                 { toast.error('Select a customer'); return }
    if (!form.delivery_destination.trim()) { toast.error('Enter delivery destination'); return }
    if (!form.assigned_agent_id)           { toast.error('Assign an agent'); return }
    setSubmitting(true)
    try {
      const jobNo = `JOB-${String(Date.now()).slice(-5)}`
      await createJob({
        job_number:              jobNo,
        do_id:                   selectedDoId,
        customer_id:             form.customer_id,
        delivery_destination:    form.delivery_destination.trim(),
        service_type:            form.service_type,
        packing_type:            form.packing_type || undefined,
        assigned_agent_id:       form.assigned_agent_id,
        planned_delivery_date:   form.planned_delivery_date || undefined,
        processing_instructions: form.processing_instructions || undefined,
        created_by:              user?.id ?? '',
      } as any)
      // Note: the DO deliberately stays 'active' here — it only advances to
      // 'partially_dispatched' once a job actually dispatches (see
      // dataStore.updateJobStatus), not merely once one is planned/assigned.
      toast.success(`${jobNo} created and assigned`)
      selectDO('')
      await fetchDOs()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create job')
    } finally { setSubmitting(false) }
  }

  const card: React.CSSProperties = {
    background: 'var(--card-bg)', border: '1px solid var(--card-border)',
    borderRadius: '0.85rem', padding: '1.25rem', boxShadow: 'var(--sh-card)',
  }

  return (
    <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: 'var(--tx1)', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Planning Workbench</h1>
        <p style={{ color: 'var(--tx4)', fontSize: '0.78rem', margin: 0 }}>Assign unplanned delivery orders to jobs, agents, and service centres</p>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--tx3)', fontSize: '0.82rem', marginBottom: '1rem' }}>
          <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading live data…
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
        {PLAN_FILTERS.map(f => {
          const active = planFilter === f.value
          const count = f.value === 'all' ? activeDOs.length : planCounts[f.value as PlanStatus]
          return (
            <button key={f.value} onClick={() => setPlanFilter(f.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.38rem 0.9rem', borderRadius: 999, fontSize: '0.76rem', fontWeight: 600,
                border: active ? `1px solid ${f.color}` : '1px solid var(--gb)',
                background: active ? `${f.color}22` : 'transparent',
                color: active ? f.color : 'var(--tx3)',
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>
              {f.label}
              {count > 0 && (
                <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.08rem 0.38rem', borderRadius: 999, background: active ? `${f.color}33` : 'var(--g3)', color: active ? f.color : 'var(--tx4)' }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left panel — active DOs, filtered by planning status */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--gb)' }}>
            <Package size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx1)' }}>
              {PLAN_FILTERS.find(f => f.value === planFilter)?.label} DOs ({unplannedDOs.length})
            </span>
          </div>
          {unplannedDOs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--tx3)', fontSize: '0.84rem' }}>
              {isLoading ? 'Loading…' : planFilter === 'unplanned' ? 'No unplanned DOs — all active orders have jobs assigned.' : `No ${planFilter === 'all' ? '' : planFilter} DOs.`}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 560, overflowY: 'auto' }}>
              {unplannedDOs.map(d => {
                const active = d.id === selectedDoId
                const color = DO_COLORS[d.status] ?? '#94a3b8'
                const planStatus = planStatusOf(d.id)
                const planColor = planStatus === 'unplanned' ? '#60a5fa' : planStatus === 'revised' ? '#a78bfa' : '#34d399'
                const linkedJob = jobByDoId.get(d.id)
                return (
                  <button key={d.id} onClick={() => selectDO(d.id)}
                    style={{
                      textAlign: 'left', padding: '0.85rem 1.25rem', border: 'none',
                      borderBottom: '1px solid var(--gb)', cursor: 'pointer',
                      background: active ? 'var(--accent-dim)' : 'transparent',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, gap: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.86rem', color: active ? 'var(--accent)' : 'var(--tx1)' }}>{d.do_number}</span>
                      <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.14rem 0.45rem', borderRadius: 999, background: `${planColor}22`, color: planColor, border: `1px solid ${planColor}44`, textTransform: 'uppercase' }}>
                          {planStatus === 'revised' ? 'Plan Revised' : planStatus}
                        </span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.14rem 0.45rem', borderRadius: 999, background: `${color}22`, color, border: `1px solid ${color}44`, textTransform: 'uppercase' }}>
                          {DO_STATUS_LABELS[d.status as DOStatus] ?? d.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--tx3)' }}>{d.supplier?.name ?? '—'} · {d.source_service_centre?.name ?? '—'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--tx4)', marginTop: 2 }}>
                      {d.items?.length ?? 0} item{(d.items?.length ?? 0) !== 1 ? 's' : ''} · Expected {formatDate(d.expected_collection_date)}
                      {linkedJob && <> · Job {linkedJob.job_number} ({JOB_STATUS_LABELS[linkedJob.status as JobStatus] ?? linkedJob.status})</>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right panel — job assignment form, or a summary if this DO is already planned */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
            <ClipboardList size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx1)' }}>
              {selectedDOJob ? 'Plan Summary' : 'Assign Job'}
            </span>
          </div>

          {!selectedDoId ? (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--tx3)', fontSize: '0.84rem' }}>
              Select a DO on the left to assign or review its job.
            </div>
          ) : selectedDOJob ? (
            <div>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.6rem', background: 'var(--g1)', border: '1px solid var(--gb)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Delivery Order</div>
                <div style={{ fontSize: '0.86rem', color: 'var(--tx1)', fontWeight: 600 }}>
                  {selectedDO?.do_number} — {selectedDO?.supplier?.name ?? '—'}
                </div>
              </div>
              {selectedDOPlanStatus === 'revised' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: '0.55rem', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', marginBottom: '1rem', fontSize: '0.78rem', color: '#a78bfa' }}>
                  <History size={13} /> This job's plan has been revised since it was first assigned.
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--tx4)' }}>Job Number</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tx1)' }}>{selectedDOJob.job_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--tx4)' }}>Status</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tx1)' }}>{JOB_STATUS_LABELS[selectedDOJob.status as JobStatus] ?? selectedDOJob.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--tx4)' }}>Agent</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tx1)' }}>{selectedDOJob.assigned_agent?.full_name ?? 'Unassigned'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--tx4)' }}>Destination</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tx1)' }}>{selectedDOJob.delivery_destination}</span>
                </div>
              </div>
              <Link to={`/jobs/${selectedDOJob.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
                View / Edit Job Plan <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.6rem', background: 'var(--g1)', border: '1px solid var(--gb)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>Delivery Order</div>
                <div style={{ fontSize: '0.86rem', color: 'var(--tx1)', fontWeight: 600 }}>
                  {selectedDO?.do_number} — {selectedDO?.supplier?.name ?? '—'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={lbl}>Customer *</label>
                  <select style={inp} value={form.customer_id} onChange={e => setField('customer_id', e.target.value)}>
                    <option value="">Select customer…</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={lbl}>Assign Agent *</label>
                  <select style={inp} value={form.assigned_agent_id} onChange={e => setField('assigned_agent_id', e.target.value)}>
                    <option value="">Select agent…</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                  </select>
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Delivery Destination *</label>
                  <input style={inp} value={form.delivery_destination} onChange={e => setField('delivery_destination', e.target.value)} placeholder="e.g. AutoFab Components, Chakan" />
                </div>

                <div>
                  <label style={lbl}>Service Type</label>
                  <select style={inp} value={form.service_type} onChange={e => setField('service_type', e.target.value)}>
                    {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>

                <div>
                  <label style={lbl}>Packing Type</label>
                  <input style={inp} value={form.packing_type} onChange={e => setField('packing_type', e.target.value)} placeholder="e.g. Pallet + Strips" />
                </div>

                <div>
                  <label style={lbl}>Planned Delivery Date</label>
                  <input style={inp} type="date" value={form.planned_delivery_date} onChange={e => setField('planned_delivery_date', e.target.value)} />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Processing Instructions</label>
                  <textarea
                    style={{ ...inp, resize: 'vertical' } as React.CSSProperties}
                    rows={3}
                    value={form.processing_instructions}
                    onChange={e => setField('processing_instructions', e.target.value)}
                    placeholder="Cut sizes, tolerances, packing requirements…"
                  />
                </div>
              </div>

              {overAllocated && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.9rem', borderRadius: '0.6rem', marginTop: '0.9rem', background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.28)' }}>
                  <AlertTriangle size={14} style={{ color: '#fb923c', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--tx1)' }}>
                    This agent already has <strong>{agentActiveJobCount}</strong> active jobs — assigning another may over-allocate them.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => selectDO('')} style={{ flex: 1, padding: '0.7rem', borderRadius: '0.6rem', border: '1px solid var(--gb)', background: 'var(--g2)', color: 'var(--tx2)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
                  Clear
                </button>
                <button type="submit" disabled={submitting} style={{ flex: 2, padding: '0.7rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', opacity: submitting ? 0.65 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  {submitting ? 'Assigning…' : <>Create Job & Assign <ArrowRight size={14} /></>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Link to="/dos" style={{ fontSize: '0.78rem', color: 'var(--tx4)', textDecoration: 'none' }}>← Back to Delivery Orders</Link>
      </div>
    </div>
  )
}
