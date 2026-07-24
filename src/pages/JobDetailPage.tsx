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
import { formatINR, formatDate, formatDateTime, getCoords } from '@/lib/utils'
import { toast as sonnerToast } from 'sonner'
import {
  ArrowLeft, Briefcase, MapPin, Package, ClipboardList,
  CheckCircle2, Receipt, Truck, AlertTriangle, Building2,
  XCircle, Loader2, PlusCircle, LogIn, Pencil, History, PlayCircle, PackageCheck,
} from 'lucide-react'
import {
  SERVICE_TYPE_LABELS, EXPENSE_CATEGORY_LABELS, SETTLEMENT_LABELS, JOB_STATUS_LABELS,
} from '@/types'
import type { ServiceType, JobStatus, ExpenseStatus, ExpenseCategory, SettlementMethod } from '@/types'

const inp: React.CSSProperties = {
  width:'100%', padding:'0.5rem 0.7rem', borderRadius:'0.5rem',
  border:'1px solid var(--input-border)', background:'var(--input-bg)',
  color:'var(--tx1)', fontSize:'0.82rem', outline:'none', boxSizing:'border-box' as const,
}
const lbl: React.CSSProperties = {
  display:'block', fontSize:'0.66rem', fontWeight:700,
  color:'var(--tx4)', textTransform:'uppercase' as const, letterSpacing:'0.06em', marginBottom:3,
}
const card: React.CSSProperties = {
  background: 'var(--card-bg)', border: '1px solid var(--card-border)',
  borderRadius: '0.85rem', padding: '1.25rem', boxShadow: 'var(--sh-card)',
}
const PLAN_FIELDS = [
  'customer_id', 'delivery_destination', 'service_type', 'packing_type',
  'assigned_agent_id', 'planned_delivery_date', 'processing_instructions',
] as const

const STEP_STATUSES = [
  'assigned','acknowledged','at_service_centre','processing',
  'processing_done','in_transit_to_customer','delivered',
]

const JOB_COLORS: Record<JobStatus, string> = {
  assigned: '#94a3b8', acknowledged: '#60a5fa', at_service_centre: '#a78bfa',
  processing: '#fbbf24', processing_done: '#34d399',
  in_transit_to_customer: '#2dd4bf', delivered: '#22c55e', cancelled: '#f87171',
}
const EXPENSE_COLORS: Record<ExpenseStatus, string> = {
  pending: '#fbbf24', approved: '#34d399', rejected: '#f87171',
}
const DELIVERY_COLORS: Record<string, string> = { delivered: '#34d399', partial: '#fbbf24' }

const Pill = ({ label, color }: { label: string; color: string }) => (
  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: `${color}22`, color, border: `1px solid ${color}44`, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
    {label}
  </span>
)

const SectionHeader = ({ icon: Icon, title, right }: { icon: React.ElementType; title: string; right?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Icon size={15} style={{ color: 'var(--accent)' }} />
      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx1)' }}>{title}</span>
    </div>
    {right}
  </div>
)

const FieldRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.6rem' }}>
    <div style={{ fontSize: '0.76rem', color: 'var(--tx4)', flexShrink: 0 }}>{label}</div>
    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tx1)', textAlign: 'right' }}>{value}</div>
  </div>
)

// ── Confirm Modal ────────────────────────────────────────────────
const ConfirmModal = ({
  onConfirm, onCancel, busy, jobNumber,
}: {
  onConfirm: () => void; onCancel: () => void; busy: boolean; jobNumber: string;
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
  const { id = '' } = useParams()
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
      const { error } = await supabase.from('jobs').update(patch as never).eq('id', id)
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
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ color: 'var(--tx4)', fontSize: '0.85rem' }}>Job not found.</div>
      <Link to="/jobs" style={{ color: 'var(--accent)', fontSize: '0.85rem', marginTop: '0.5rem', display: 'inline-block' }}>← Back to Jobs</Link>
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
  const statusColor = JOB_COLORS[job.status as JobStatus] ?? '#94a3b8'

  return (
    <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
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
        <Link to="/jobs" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--tx4)', textDecoration: 'none', marginBottom: '0.75rem' }}>
          <ArrowLeft size={13} /> Back to Jobs
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1 style={{ color: 'var(--tx1)', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>{job.job_number}</h1>
              <Pill label={JOB_STATUS_LABELS[job.status as JobStatus] ?? job.status} color={statusColor} />
              {revisionCount > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: 999, background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <History size={10} /> Plan Revised
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--tx3)', marginTop: '0.3rem' }}>{job.customer?.name ?? '—'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--tx4)' }}>DO Reference</div>
              <Link to={`/dos/${job.do?.id}`} style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
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
        <div style={card}>
          <SectionHeader icon={Pencil} title="Edit Plan" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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
            <div style={{ gridColumn: '1/-1' }}>
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
            <div style={{ gridColumn: '1/-1' }}>
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
        </div>
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
        <div style={card}>
          <SectionHeader icon={ClipboardList} title="Job Progress" />
          <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            {STEP_STATUSES.map((s, i) => {
              const done   = i <= currentStepIdx
              const active = i === currentStepIdx
              const dotColor = active ? 'var(--accent)' : done ? '#34d399' : 'var(--g3)'
              const txColor  = active ? 'var(--accent)' : done ? '#34d399' : 'var(--tx4)'
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', minWidth: 74 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, background: dotColor, color: done || active ? '#fff' : 'var(--tx4)', boxShadow: active ? '0 0 0 4px rgba(45,212,191,0.2)' : 'none' }}>
                      {done && !active ? <CheckCircle2 size={13} /> : i + 1}
                    </div>
                    <span style={{ fontSize: '0.62rem', textAlign: 'center', lineHeight: 1.2, fontWeight: 600, color: txColor }}>
                      {JOB_STATUS_LABELS[s as keyof typeof JOB_STATUS_LABELS]}
                    </span>
                  </div>
                  {i < STEP_STATUSES.length - 1 && (
                    <div style={{ height: 2, width: 24, flexShrink: 0, marginBottom: '1.1rem', background: i < currentStepIdx ? '#34d399' : 'var(--g3)' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>
        {/* Job details */}
        <div style={card}>
          <SectionHeader icon={Briefcase} title="Job Details" />
          <FieldRow label="Service Type" value={SERVICE_TYPE_LABELS[job.service_type as ServiceType]} />
          <FieldRow label="Packing Type" value={job.packing_type ?? '—'} />
          <FieldRow label="Planned Delivery" value={formatDate(job.planned_delivery_date)} />
          <FieldRow label="Agent" value={job.assigned_agent?.full_name ?? 'Unassigned'} />
          <FieldRow label="Agent Phone" value={job.assigned_agent?.phone ?? '—'} />
        </div>

        {/* Delivery info */}
        <div style={card}>
          <SectionHeader icon={MapPin} title="Delivery Destination" />
          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--tx1)' }}>{job.delivery_destination}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--tx3)', marginTop: '0.3rem' }}>Customer: {job.customer?.name ?? '—'}</div>
          {job.deliveries && job.deliveries.length > 0 && job.deliveries[0].destination_changed && (
            <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', borderRadius: '0.55rem', background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.28)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <AlertTriangle size={13} style={{ color: '#fb923c', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fb923c' }}>Destination Changed</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--tx2)', marginTop: 2 }}>New: {job.deliveries[0].new_destination}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--tx3)', marginTop: 2 }}>Reason: {job.deliveries[0].change_reason}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--tx3)', marginTop: 2 }}>
                    {job.deliveries[0].authorised_by_office ? '✓ Office authorised' : '⚠ Self-authorised'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Processing instructions */}
      <div style={card}>
        <SectionHeader icon={Package} title="Processing Instructions" />
        <div style={{ fontSize: '0.83rem', color: 'var(--tx1)', lineHeight: 1.6, background: 'var(--g1)', borderRadius: '0.55rem', padding: '0.75rem 0.9rem', border: '1px solid var(--gb)' }}>
          {job.processing_instructions ?? 'No instructions recorded.'}
        </div>
      </div>

      {/* Service centre queue */}
      {job.queue_updates && job.queue_updates.length > 0 && (
        <div style={card}>
          <SectionHeader icon={Building2} title="Service Centre Queue" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {job.queue_updates.map((q: any) => {
              const stageColor = q.processing_completed_at ? '#34d399' : q.processing_started_at ? '#fbbf24' : '#60a5fa'
              const stageLabel = q.processing_completed_at ? 'Complete' : q.processing_started_at ? 'Partial' : 'Queued'
              return (
                <div key={q.id} style={{ padding: '0.75rem 0.9rem', borderRadius: '0.6rem', border: '1px solid var(--gb)', background: 'var(--g1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tx1)' }}>{q.service_centre?.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--tx3)', marginTop: 2 }}>
                        {SERVICE_TYPE_LABELS[q.service_type as ServiceType]} · Queue #{q.queue_number ?? 'N/A'}
                      </div>
                    </div>
                    <Pill label={stageLabel} color={stageColor} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem 1rem', marginTop: '0.65rem' }}>
                    {[['Check-in', formatDateTime(q.checkin_time)],
                      ['Est. time', q.estimated_processing_minutes ? `${q.estimated_processing_minutes} min` : '—'],
                      ['Started', q.processing_started_at ? formatDateTime(q.processing_started_at) : '—'],
                      ['Completed', q.processing_completed_at ? formatDateTime(q.processing_completed_at) : '—'],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--tx4)' }}>{l}</div>
                        <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--tx2)', marginTop: 1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {q.notes && <div style={{ fontSize: '0.75rem', color: 'var(--tx4)', marginTop: '0.5rem', fontStyle: 'italic' }}>{q.notes}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Expenses */}
      <div style={card}>
        <SectionHeader icon={Receipt} title={`Expenses (${job.expenses?.length ?? 0})`}
          right={<span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--tx1)' }}>{formatINR(totalExpenses)}</span>} />
        {pendingExpenses.length > 0 && (
          <div style={{ marginBottom: '0.75rem', padding: '0.6rem 0.85rem', borderRadius: '0.55rem', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.28)', fontSize: '0.78rem', color: '#fbbf24' }}>
            <strong>{pendingExpenses.length} pending approval</strong> · {formatINR(pendingExpenses.reduce((a: number,e: any) => a + Number(e.amount_inr), 0))}
          </div>
        )}
        {job.expenses && job.expenses.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {job.expenses.map((e: any) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: '0.55rem', border: '1px solid var(--gb)', background: 'var(--g1)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--tx1)' }}>{EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory]}</span>
                    <Pill label={e.status} color={EXPENSE_COLORS[e.status as ExpenseStatus] ?? '#94a3b8'} />
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--tx3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.payee_description}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--tx4)', marginTop: 1 }}>{SETTLEMENT_LABELS[e.settlement_method as SettlementMethod]}</div>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--tx1)', flexShrink: 0 }}>{formatINR(Number(e.amount_inr))}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.78rem', color: 'var(--tx4)' }}>No expenses logged yet</div>
        )}
      </div>

      {/* Deliveries */}
      {job.deliveries && job.deliveries.length > 0 && (
        <div style={card}>
          <SectionHeader icon={Truck} title="Delivery Records" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {job.deliveries.map((d: any) => (
              <div key={d.id} style={{ padding: '0.75rem 0.9rem', borderRadius: '0.6rem', border: '1px solid var(--gb)', background: 'var(--g1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--tx1)' }}>{d.customer_name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--tx3)', marginTop: 2 }}>{d.delivery_address}</div>
                  </div>
                  <Pill label={d.delivery_status} color={DELIVERY_COLORS[d.delivery_status] ?? '#94a3b8'} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', marginTop: '0.6rem' }}>
                  {[['Vehicle', d.vehicle_number],['Delivered at', formatDateTime(d.delivered_at)]].map(([l,v]) => (
                    <div key={l}>
                      <div style={{ fontSize: '0.62rem', color: 'var(--tx4)' }}>{l}</div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--tx2)', marginTop: 1 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
