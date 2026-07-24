/**
 * JobDetailPage.tsx — live Supabase, with Cancel Job button.
 * Cancel available to: admin, planner.
 * Cancelled jobs show a red banner and are locked from agent actions.
 */
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { useDataStore } from '@/store/dataStore'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { JobStatusBadge, ExpenseStatusBadge } from '@/components/ui/StatusBadge'
import { formatINR, formatDate, formatDateTime, getCoords } from '@/lib/utils'
import { toast as sonnerToast } from 'sonner'
import {
  ArrowLeft, Briefcase, MapPin, Calendar, User, Package, ClipboardList,
  Clock, CheckCircle2, Receipt, Truck, AlertTriangle, Building2,
  XCircle, Loader2, PlusCircle, LogIn, Pencil, History, PlayCircle, PackageCheck,
} from 'lucide-react'
import {
  SERVICE_TYPE_LABELS, EXPENSE_CATEGORY_LABELS, SETTLEMENT_LABELS, JOB_STATUS_LABELS,
} from '@/types'
import type { ServiceType } from '@/types'

const inp: React.CSSProperties = {
  width:'100%', padding:'0.5rem 0.7rem', borderRadius:'0.5rem',
  border:'1px solid var(--input-border)', background:'var(--input-bg)',
  color:'var(--tx1)', fontSize:'0.82rem', outline:'none', boxSizing:'border-box' as const,
}
const lbl: React.CSSProperties = {
  display:'block', fontSize:'0.66rem', fontWeight:700,
  color:'var(--tx4)', textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:3,
}
const PLAN_FIELDS = [
  'customer_id', 'delivery_destination', 'service_type', 'packing_type',
  'assigned_agent_id', 'planned_delivery_date', 'processing_instructions',
] as const

const STEP_STATUSES = [
  'assigned','acknowledged','at_service_centre','processing',
  'processing_done','in_transit_to_customer','delivered',
]

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon size={15} className="text-[--color-primary]" />
    <h2 className="font-semibold text-sm text-[--color-ink]">{title}</h2>
  </div>
)

// ── Confirm Modal (reuse same pattern)
const ConfirmModal = ({
  onConfirm, onCancel, busy, jobNumber, jobCount,
}: {
  onConfirm: () => void; onCancel: () => void; busy: boolean; jobNumber: string; jobCount?: number;
}) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '1rem', padding: '1.75rem', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
        <XCircle size={18} style={{ color: '#fb923c' }} />
        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--tx1)' }}>Cancel Job {jobNumber}?</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--tx2)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        This will mark the job as <strong>Cancelled</strong>. The assigned agent will no longer see this job in their active list.
        The material will not be processed further. This action cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} disabled={busy}
          style={{ padding: '0.5rem 1.1rem', borderRadius: '0.55rem', border: '1px solid var(--gb)', background: 'var(--g2)', color: 'var(--tx2)', fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer' }}>Keep Job</button>
        <button onClick={onConfirm} disabled={busy}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.2rem', borderRadius: '0.55rem', border: 'none', background: '#fb923c', color: '#fff', fontWeight: 700, fontSize: '0.83rem', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}>
          {busy ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
          {busy ? 'Cancelling…' : 'Yes, Cancel Job'}
        </button>
      </div>
    </div>
  </div>
)

export const JobDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin, isPlanner, isAgent, user } = useRole()
  const { customers, profiles, fetchLookups } = useDataStore()

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [revisionCount, setRevisionCount] = useState(0)
  const [statusBusy, setStatusBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [editForm, setEditForm] = useState({
    customer_id: '', delivery_destination: '', service_type: 'ctl' as ServiceType,
    packing_type: '', assigned_agent_id: '', planned_delivery_date: '', processing_instructions: '',
  })

  useEffect(() => { fetchLookups() }, [])

  const fetchRevisionCount = async () => {
    const { count } = await supabase
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('entity', 'jobs').eq('entity_id', id).like('field', 'plan_%')
    setRevisionCount(count ?? 0)
  }

  const fetchJob = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        id, job_number, status, delivery_destination, service_type, packing_type,
        planned_delivery_date, processing_instructions, created_at,
        do:delivery_orders(id, do_number,
          source_service_centre:service_centres(id,name,city),
          supplier:suppliers(id,name),
          items:do_items(id,coil_grade,thickness_mm,width_mm,quantity,weight_mt)
        ),
        customer:customers(id,name,city),
        assigned_agent:profiles!jobs_assigned_agent_id_fkey(id,full_name,phone),
        queue_updates(id,queue_number,checkin_time,estimated_processing_minutes,processing_started_at,processing_completed_at,notes,
          service_centre:service_centres(id,name,city)
        ),
        expenses(id,category,amount_inr,payee_description,settlement_method,status,photo_url,review_notes),
        deliveries(id,customer_name,delivery_address,vehicle_number,delivered_at,delivery_status,
          destination_changed,old_destination,new_destination,change_reason,authorised_by_office
        )
      `)
      .eq('id', id)
      .single()
    if (!error) setJob(data)
    setLoading(false)
  }

  useEffect(() => { fetchJob(); fetchRevisionCount() }, [id])

  const openEdit = () => {
    if (!job) return
    setEditForm({
      customer_id: job.customer?.id ?? '',
      delivery_destination: job.delivery_destination ?? '',
      service_type: job.service_type,
      packing_type: job.packing_type ?? '',
      assigned_agent_id: job.assigned_agent?.id ?? '',
      planned_delivery_date: job.planned_delivery_date ?? '',
      processing_instructions: job.processing_instructions ?? '',
    })
    setEditing(true)
  }

  const currentPlanValues: Record<string, string> = {
    customer_id: job?.customer?.id ?? '',
    delivery_destination: job?.delivery_destination ?? '',
    service_type: job?.service_type ?? '',
    packing_type: job?.packing_type ?? '',
    assigned_agent_id: job?.assigned_agent?.id ?? '',
    planned_delivery_date: job?.planned_delivery_date ?? '',
    processing_instructions: job?.processing_instructions ?? '',
  }

  const handleSaveEditPlan = async () => {
    if (!editForm.customer_id) { sonnerToast.error('Select a customer'); return }
    if (!editForm.delivery_destination.trim()) { sonnerToast.error('Enter delivery destination'); return }
    if (!editForm.assigned_agent_id) { sonnerToast.error('Assign an agent'); return }
    const changed = PLAN_FIELDS.filter(f => (editForm as Record<string, string>)[f] !== currentPlanValues[f])
    if (changed.length === 0) { setEditing(false); return }
    setSavingPlan(true)
    try {
      const patch = Object.fromEntries(changed.map(f => [f, (editForm as Record<string, string>)[f] || null]))
      const { error } = await supabase.from('jobs').update(patch).eq('id', id)
      if (error) throw error
      await supabase.from('audit_log').insert(changed.map(f => ({
        entity: 'jobs', entity_id: id, field: `plan_${f}`,
        old_value: currentPlanValues[f] || '', new_value: (editForm as Record<string, string>)[f] || '',
        changed_by: user?.id ?? '',
      })))
      sonnerToast.success('Plan updated')
      setEditing(false)
      await fetchJob()
      await fetchRevisionCount()
    } catch (e: unknown) {
      sonnerToast.error(e instanceof Error ? e.message : 'Failed to update plan')
    } finally { setSavingPlan(false) }
  }

  // Agents are non-technical field staff — status updates should be one tap, not a form.
  // The SC + service type are already known from planning, so "Mark Queued" needs no input at all.
  const latestQueueEntry = (job?.queue_updates ?? [])
    .slice()
    .sort((a: any, b: any) => new Date(b.checkin_time).getTime() - new Date(a.checkin_time).getTime())[0]

  const writeStatusAudit = async (newStatus: string) =>
    supabase.from('audit_log').insert({
      entity: 'jobs', entity_id: id, field: 'status',
      old_value: job.status, new_value: newStatus, changed_by: user?.id ?? '',
    })

  const handleMarkQueued = async () => {
    const scId = job.do?.source_service_centre?.id
    if (!scId) { sonnerToast.error('This DO has no source service centre set — use the full check-in form instead'); return }
    setStatusBusy(true)
    try {
      const coords = await getCoords()
      const { error: qErr } = await supabase.from('queue_updates').insert({
        job_id: id, service_centre_id: scId, service_type: job.service_type,
        checkin_time: new Date().toISOString(), gps_lat: coords.lat, gps_lng: coords.lng,
        logged_by: job.assigned_agent?.id ?? user?.id ?? '',
      })
      if (qErr) throw qErr
      const { error: sErr } = await supabase.from('jobs').update({ status: 'at_service_centre' }).eq('id', id)
      if (sErr) throw sErr
      await writeStatusAudit('at_service_centre')
      sonnerToast.success('Marked as queued at service centre')
      await fetchJob()
    } catch (e: unknown) {
      sonnerToast.error(e instanceof Error ? e.message : 'Failed to update status')
    } finally { setStatusBusy(false) }
  }

  const handleAdvanceProcessing = async (newStatus: 'processing' | 'processing_done') => {
    setStatusBusy(true)
    try {
      const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      await writeStatusAudit(newStatus)
      if (latestQueueEntry) {
        const patch = newStatus === 'processing'
          ? { processing_started_at: new Date().toISOString() }
          : { processing_completed_at: new Date().toISOString() }
        await supabase.from('queue_updates').update(patch).eq('id', latestQueueEntry.id)
      }
      sonnerToast.success(newStatus === 'processing' ? 'Marked as partially processed' : 'Marked processing complete — ready to dispatch')
      await fetchJob()
    } catch (e: unknown) {
      sonnerToast.error(e instanceof Error ? e.message : 'Failed to update status')
    } finally { setStatusBusy(false) }
  }

  const handleCancelJob = async () => {
    setBusy(true)
    const { error } = await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', id)
    if (!error) {
      setToast('Job cancelled successfully. Agent will no longer see this job.')
      setShowModal(false)
      await fetchJob()
    } else {
      setToast('Error: ' + error.message)
    }
    setBusy(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '0.5rem', color: 'var(--tx3)', fontSize: '0.85rem' }}>
      <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading job…
    </div>
  )

  if (!job) return (
    <div className="p-8 text-center">
      <div className="text-[--color-ink-muted] text-sm">Job not found.</div>
      <Link to="/jobs" className="text-sm text-[--color-primary] mt-2 inline-block hover:underline">← Back to Jobs</Link>
    </div>
  )

  const isCancelled = job.status === 'cancelled'
  const isDelivered = job.status === 'delivered'
  const canCancel = (isAdmin || isPlanner) && !isCancelled && !isDelivered
  const canEditPlan = (isAdmin || isPlanner) && !isCancelled && !isDelivered
  // Agents can only log against their own assigned job; office roles can log on behalf of any agent.
  const canLogAction = !isCancelled && !isDelivered && (isAdmin || isPlanner || (isAgent && job.assigned_agent?.id === user?.id))
  const currentStepIdx = isCancelled ? -1 : STEP_STATUSES.indexOf(job.status)
  const totalExpenses = (job.expenses ?? []).reduce((a: number, e: any) => a + Number(e.amount_inr), 0)
  const pendingExpenses = (job.expenses ?? []).filter((e: any) => e.status === 'pending')

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {showModal && (
        <ConfirmModal
          onConfirm={handleCancelJob}
          onCancel={() => setShowModal(false)}
          busy={busy}
          jobNumber={job.job_number}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9998, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderLeft: '4px solid #34d399', borderRadius: '0.65rem', padding: '0.75rem 1.1rem', fontSize: '0.84rem', color: 'var(--tx1)', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', maxWidth: 340 }}>
          {toast}
          <button onClick={() => setToast('')} style={{ marginLeft: '0.75rem', background: 'none', border: 'none', color: 'var(--tx4)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Back + Header */}
      <div>
        <Link to="/jobs" className="flex items-center gap-1.5 text-xs text-[--color-ink-muted] hover:text-[--color-primary] mb-3 transition-colors">
          <ArrowLeft size={13} /> Back to Jobs
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[--color-ink]">{job.job_number}</h1>
              <JobStatusBadge status={job.status} />
              {revisionCount > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: 999, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <History size={10} /> Plan Revised
                </span>
              )}
            </div>
            <div className="text-sm text-[--color-ink-muted] mt-0.5">{job.customer?.name ?? '—'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="text-right">
              <div className="text-xs text-[--color-ink-faint]">DO Reference</div>
              <Link to={`/dos/${job.do?.id}`} className="text-sm font-medium text-[--color-primary] hover:underline">
                {job.do?.do_number ?? '—'}
              </Link>
            </div>
            {canEditPlan && !editing && (
              <button onClick={openEdit}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', borderRadius: '0.6rem', border: '1px solid var(--gb)', background: 'var(--g2)', color: 'var(--tx2)', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}>
                <Pencil size={14} /> Edit Plan
              </button>
            )}
            {canCancel && (
              <button onClick={() => setShowModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', borderRadius: '0.6rem', border: '1px solid rgba(251,146,60,0.5)', background: 'rgba(251,146,60,0.1)', color: '#fb923c', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}>
                <XCircle size={14} /> Cancel Job
              </button>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <Card>
          <SectionHeader icon={Pencil} title="Edit Plan" />
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label style={lbl}>Customer *</label>
              <select style={inp} value={editForm.customer_id} onChange={e => setEditForm(f => ({ ...f, customer_id: e.target.value }))}>
                <option value="">Select customer…</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Assign Agent *</label>
              <select style={inp} value={editForm.assigned_agent_id} onChange={e => setEditForm(f => ({ ...f, assigned_agent_id: e.target.value }))}>
                <option value="">Select agent…</option>
                {profiles.filter(p => p.role === 'agent').map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label style={lbl}>Delivery Destination *</label>
              <input style={inp} value={editForm.delivery_destination} onChange={e => setEditForm(f => ({ ...f, delivery_destination: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Service Type</label>
              <select style={inp} value={editForm.service_type} onChange={e => setEditForm(f => ({ ...f, service_type: e.target.value as ServiceType }))}>
                {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Packing Type</label>
              <input style={inp} value={editForm.packing_type} onChange={e => setEditForm(f => ({ ...f, packing_type: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Planned Delivery Date</label>
              <input style={inp} type="date" value={editForm.planned_delivery_date} onChange={e => setEditForm(f => ({ ...f, planned_delivery_date: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label style={lbl}>Processing Instructions</label>
              <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} rows={3}
                value={editForm.processing_instructions} onChange={e => setEditForm(f => ({ ...f, processing_instructions: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
            <button onClick={() => setEditing(false)} disabled={savingPlan}
              style={{ padding: '0.55rem 1.1rem', borderRadius: '0.55rem', border: '1px solid var(--gb)', background: 'var(--g2)', color: 'var(--tx2)', fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSaveEditPlan} disabled={savingPlan}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.2rem', borderRadius: '0.55rem', border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: '0.83rem', cursor: savingPlan ? 'not-allowed' : 'pointer', opacity: savingPlan ? 0.7 : 1 }}>
              {savingPlan && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
              {savingPlan ? 'Saving…' : 'Save Revised Plan'}
            </button>
          </div>
        </Card>
      )}

      {/* Quick actions — one-tap status updates; only the final delivery still needs a form (photo/address) */}
      {canLogAction && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {(job.status === 'assigned' || job.status === 'acknowledged') && (
              <button onClick={handleMarkQueued} disabled={statusBusy}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: statusBusy ? 'not-allowed' : 'pointer', opacity: statusBusy ? 0.65 : 1 }}>
                {statusBusy ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <LogIn size={14} />} Mark Queued at SC
              </button>
            )}
            {job.status === 'at_service_centre' && (
              <button onClick={() => handleAdvanceProcessing('processing')} disabled={statusBusy}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#fbbf24,#d97706)', color: '#1c1400', fontWeight: 700, fontSize: '0.82rem', cursor: statusBusy ? 'not-allowed' : 'pointer', opacity: statusBusy ? 0.65 : 1 }}>
                {statusBusy ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <PlayCircle size={14} />} Mark Partially Processed
              </button>
            )}
            {job.status === 'processing' && (
              <button onClick={() => handleAdvanceProcessing('processing_done')} disabled={statusBusy}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#34d399,#059669)', color: '#07211e', fontWeight: 700, fontSize: '0.82rem', cursor: statusBusy ? 'not-allowed' : 'pointer', opacity: statusBusy ? 0.65 : 1 }}>
                {statusBusy ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <PackageCheck size={14} />} Mark Processing Complete
              </button>
            )}
            {job.status === 'processing_done' && (
              <button onClick={() => navigate(`/deliveries/log?job=${job.id}`)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                <Truck size={14} /> Log Delivery
              </button>
            )}
            <button onClick={() => navigate(`/expenses/log?job=${job.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.6rem', border: '1px solid var(--gb)', background: 'var(--g2)', color: 'var(--tx2)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
              <PlusCircle size={14} /> Add Expense
            </button>
          </div>
          {(isAdmin || isPlanner) && (job.status === 'assigned' || job.status === 'acknowledged') && (
            <button onClick={() => navigate(`/queue/log?job=${job.id}`)}
              style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--tx4)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Need a different service centre or extra details? Use the full check-in form →
            </button>
          )}
        </div>
      )}

      {/* Cancelled banner */}
      {isCancelled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.85rem 1.1rem', borderRadius: '0.7rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)' }}>
          <XCircle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.88rem' }}>This Job is Cancelled</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--tx3)', marginTop: 2 }}>No further action is required. The material will not be processed.</div>
          </div>
        </div>
      )}

      {/* Progress timeline (hidden if cancelled) */}
      {!isCancelled && (
        <Card>
          <SectionHeader icon={ClipboardList} title="Job Progress" />
          <div className="flex items-center gap-0 overflow-x-auto pb-1">
            {STEP_STATUSES.map((s, i) => {
              const done   = i <= currentStepIdx
              const active = i === currentStepIdx
              return (
                <div key={s} className="flex items-center">
                  <div className="flex flex-col items-center gap-1 min-w-[72px]">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                      ${active ? 'bg-[--color-primary] text-white ring-4 ring-[--color-primary]/20'
                        : done ? 'bg-green-500 text-white'
                        : 'bg-[--color-surface-divider] text-[--color-ink-faint]'}`}>
                      {done && !active ? <CheckCircle2 size={14} /> : i + 1}
                    </div>
                    <span className={`text-[10px] text-center leading-tight font-medium
                      ${active ? 'text-[--color-primary]' : done ? 'text-green-600' : 'text-[--color-ink-faint]'}`}>
                      {JOB_STATUS_LABELS[s as keyof typeof JOB_STATUS_LABELS]}
                    </span>
                  </div>
                  {i < STEP_STATUSES.length - 1 && (
                    <div className={`h-0.5 w-6 flex-shrink-0 mb-5 transition-colors
                      ${i < currentStepIdx ? 'bg-green-400' : 'bg-[--color-surface-divider]'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Job details */}
        <Card>
          <SectionHeader icon={Briefcase} title="Job Details" />
          <dl className="space-y-2.5">
            {([
              ['Service Type', SERVICE_TYPE_LABELS[job.service_type]],
              ['Packing Type', job.packing_type ?? '—'],
              ['Planned Delivery', formatDate(job.planned_delivery_date)],
              ['Agent', job.assigned_agent?.full_name ?? 'Unassigned'],
              ['Agent Phone', job.assigned_agent?.phone ?? '—'],
            ] as [string, string][]).map(([label, val]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-xs text-[--color-ink-muted] flex-shrink-0">{label}</dt>
                <dd className="text-xs font-medium text-[--color-ink] text-right">{val}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Delivery info */}
        <Card>
          <SectionHeader icon={MapPin} title="Delivery Destination" />
          <div className="text-sm font-medium text-[--color-ink]">{job.delivery_destination}</div>
          <div className="text-xs text-[--color-ink-muted] mt-1">Customer: {job.customer?.name ?? '—'}</div>
          {job.deliveries && job.deliveries.length > 0 && job.deliveries[0].destination_changed && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-amber-800">Destination Changed</div>
                  <div className="text-xs text-amber-700 mt-0.5">New: {job.deliveries[0].new_destination}</div>
                  <div className="text-xs text-amber-600 mt-0.5">Reason: {job.deliveries[0].change_reason}</div>
                  <div className="text-xs text-amber-600 mt-0.5">
                    {job.deliveries[0].authorised_by_office ? '✓ Office authorised' : '⚠ Self-authorised'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Processing instructions */}
      <Card>
        <SectionHeader icon={Package} title="Processing Instructions" />
        <div className="text-sm text-[--color-ink] leading-relaxed bg-[--color-surface-bg] rounded-lg p-3 border border-[--color-border]">
          {job.processing_instructions ?? 'No instructions recorded.'}
        </div>
      </Card>

      {/* Service centre queue */}
      {job.queue_updates && job.queue_updates.length > 0 && (
        <Card>
          <SectionHeader icon={Building2} title="Service Centre Queue" />
          <div className="space-y-3">
            {job.queue_updates.map((q: any) => (
              <div key={q.id} className="p-3 rounded-lg border border-[--color-border] bg-[--color-surface-bg]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-xs font-semibold text-[--color-ink]">{q.service_centre?.name}</div>
                    <div className="text-xs text-[--color-ink-muted] mt-0.5">
                      {SERVICE_TYPE_LABELS[q.service_type]} · Queue #{q.queue_number ?? 'N/A'}
                    </div>
                  </div>
                  <div className="text-right">
                    {q.processing_completed_at
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">✓ Completed</span>
                      : q.processing_started_at
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">⚙ Processing</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">⏳ In Queue</span>
                    }
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                  {[['Check-in', formatDateTime(q.checkin_time)],
                    ['Est. time', q.estimated_processing_minutes ? `${q.estimated_processing_minutes} min` : '—'],
                    ['Started', q.processing_started_at ? formatDateTime(q.processing_started_at) : '—'],
                    ['Completed', q.processing_completed_at ? formatDateTime(q.processing_completed_at) : '—'],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div className="text-[10px] text-[--color-ink-faint]">{l}</div>
                      <div className="text-xs font-medium text-[--color-ink-muted]">{v}</div>
                    </div>
                  ))}
                </div>
                {q.notes && <div className="text-xs text-[--color-ink-faint] mt-2 italic">{q.notes}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Expenses */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader icon={Receipt} title={`Expenses (${job.expenses?.length ?? 0})`} />
          <div className="text-xs font-semibold text-[--color-ink]">{formatINR(totalExpenses)}</div>
        </div>
        {pendingExpenses.length > 0 && (
          <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <span className="font-semibold">{pendingExpenses.length} pending approval</span> · {formatINR(pendingExpenses.reduce((a: number,e: any) => a + Number(e.amount_inr), 0))}
          </div>
        )}
        {job.expenses && job.expenses.length > 0 ? (
          <div className="space-y-2">
            {job.expenses.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-[--color-border] bg-[--color-surface-bg]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[--color-ink]">{EXPENSE_CATEGORY_LABELS[e.category]}</span>
                    <ExpenseStatusBadge status={e.status} />
                  </div>
                  <div className="text-xs text-[--color-ink-muted] mt-0.5 truncate">{e.payee_description}</div>
                  <div className="text-[10px] text-[--color-ink-faint] mt-0.5">{SETTLEMENT_LABELS[e.settlement_method]}</div>
                </div>
                <div className="text-sm font-semibold text-[--color-ink] tabular flex-shrink-0">{formatINR(Number(e.amount_inr))}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-[--color-ink-faint]">No expenses logged yet</div>
        )}
      </Card>

      {/* Deliveries */}
      {job.deliveries && job.deliveries.length > 0 && (
        <Card>
          <SectionHeader icon={Truck} title="Delivery Records" />
          <div className="space-y-3">
            {job.deliveries.map((d: any) => (
              <div key={d.id} className="p-3 rounded-lg border border-[--color-border] bg-[--color-surface-bg]">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="text-xs font-semibold text-[--color-ink]">{d.customer_name}</div>
                    <div className="text-xs text-[--color-ink-muted] mt-0.5">{d.delivery_address}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${d.delivery_status === 'delivered' ? 'bg-green-50 text-green-700'
                      : d.delivery_status === 'partial' ? 'bg-amber-50 text-amber-700'
                      : 'bg-gray-100 text-gray-600'}`}>
                    {d.delivery_status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  {[['Vehicle', d.vehicle_number],['Delivered at', formatDateTime(d.delivered_at)]].map(([l,v]) => (
                    <div key={l}>
                      <div className="text-[10px] text-[--color-ink-faint]">{l}</div>
                      <div className="text-xs font-medium text-[--color-ink-muted]">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
