/**
 * DODetailPage.tsx — live Supabase, cancel DO + cascade-cancel all linked jobs.
 * Cancel is available to: admin, planner.
 * Delete (hard) is available to: admin only, and only if DO is draft.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { supabase } from '@/lib/supabase'
import { DO_STATUS_LABELS, JOB_STATUS_LABELS } from '@/types'
import type { DOStatus, JobStatus } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils'
import {
  ClipboardList, ChevronLeft, Package, User, ChevronRight,
  XCircle, Trash2, AlertTriangle, Loader2, Scale, History,
  Factory, Receipt, Truck, MapPin, ArrowRight,
} from 'lucide-react'

type TimelineEvent = {
  id: string
  at: string
  color: string
  icon: React.ElementType
  label: string
  detail: string
  actor?: string
}

const DO_COLORS: Record<DOStatus, string> = {
  draft: '#94a3b8', active: '#60a5fa', partially_dispatched: '#fbbf24',
  fully_dispatched: '#34d399', closed: '#6b7280', cancelled: '#f87171',
}
const JOB_COLORS: Record<JobStatus, string> = {
  assigned: '#94a3b8', acknowledged: '#60a5fa', at_service_centre: '#a78bfa',
  processing: '#fbbf24', processing_done: '#34d399',
  in_transit_to_customer: '#2dd4bf', delivered: '#22c55e', cancelled: '#f87171',
}

const Field = ({ label, value }: { label: string; value: string }) => (
  <div style={{ marginBottom: '0.75rem' }}>
    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: '0.88rem', color: 'var(--tx1)', fontWeight: 500 }}>{value}</div>
  </div>
)

// ── Confirmation Modal ──────────────────────────────────────────────────
const ConfirmModal = ({
  title, body, confirmLabel, confirmColor, onConfirm, onCancel, busy,
}: {
  title: string; body: string; confirmLabel: string; confirmColor: string;
  onConfirm: () => void; onCancel: () => void; busy: boolean;
}) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '1rem', padding: '1.75rem', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
        <AlertTriangle size={18} style={{ color: confirmColor, flexShrink: 0 }} />
        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--tx1)' }}>{title}</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--tx2)', lineHeight: 1.6, marginBottom: '1.5rem' }}>{body}</p>
      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} disabled={busy}
          style={{ padding: '0.5rem 1.1rem', borderRadius: '0.55rem', border: '1px solid var(--gb)', background: 'var(--g2)', color: 'var(--tx2)', fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer' }}>
          Keep it
        </button>
        <button onClick={onConfirm} disabled={busy}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.2rem', borderRadius: '0.55rem', border: 'none', background: confirmColor, color: '#fff', fontWeight: 700, fontSize: '0.83rem', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1 }}>
          {busy ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
          {busy ? 'Processing…' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
)

// ── Page ───────────────────────────────────────────────────────────────
export const DODetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isPlanner, isAdmin } = useRole()

  const [doItem, setDoItem] = useState<any>(null)
  const [linkedJobs, setLinkedJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  // cancel / delete modal state
  const [modal, setModal] = useState<'cancel' | 'delete' | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  // ── fetch
  const fetchData = async () => {
    setLoading(true)
    const { data: doRow, error: doErr } = await supabase
      .from('delivery_orders')
      .select(`id, do_number, status, expected_collection_date, document_url, created_at,
        supplier:suppliers(id,name),
        source_service_centre:service_centres(id,name,city),
        items:do_items(id,coil_grade,thickness_mm,width_mm,quantity,weight_mt)`)
      .eq('id', id)
      .single()
    if (doErr) { setError(doErr.message); setLoading(false); return }
    setDoItem(doRow)

    const { data: jobRows } = await supabase
      .from('jobs')
      .select(`id, job_number, status, delivery_destination, assigned_agent:profiles(id,full_name)`)
      .eq('do_id', id)
    setLinkedJobs(jobRows ?? [])
    setLoading(false)
    fetchTimeline(id ?? '', jobRows ?? [])
  }

  // Merges 4 sources into one chronological feed: audit_log (DO + its jobs),
  // queue_updates, expenses, deliveries. audit_log SELECT is RLS-restricted to
  // admin/planner — for other roles that query just returns fewer rows, not an error.
  const fetchTimeline = async (doId: string, jobRowsForTimeline: any[]) => {
    setTimelineLoading(true)
    const events: TimelineEvent[] = []
    const jobIds = jobRowsForTimeline.map(j => j.id)
    const jobNoOf = (jid: string) => jobRowsForTimeline.find(j => j.id === jid)?.job_number ?? jid.slice(0, 8)

    const { data: doAudit } = await supabase
      .from('audit_log')
      .select('id, field, old_value, new_value, changed_at, changed_by_profile:profiles!audit_log_changed_by_fkey(full_name)')
      .eq('entity', 'delivery_orders').eq('entity_id', doId)
    for (const a of doAudit ?? []) {
      events.push({ id: `audit-do-${a.id}`, at: a.changed_at, color: '#a78bfa', icon: History,
        label: `DO ${a.field} changed`, detail: `${a.old_value || '—'} → ${a.new_value || '—'}`,
        actor: (a.changed_by_profile as any)?.full_name })
    }

    if (jobIds.length > 0) {
      const { data: jobAudit } = await supabase
        .from('audit_log')
        .select('id, entity_id, field, old_value, new_value, changed_at, changed_by_profile:profiles!audit_log_changed_by_fkey(full_name)')
        .eq('entity', 'jobs').in('entity_id', jobIds)
      for (const a of jobAudit ?? []) {
        events.push({ id: `audit-job-${a.id}`, at: a.changed_at, color: '#60a5fa', icon: History,
          label: `Job ${jobNoOf(a.entity_id)} ${a.field} changed`, detail: `${a.old_value || '—'} → ${a.new_value || '—'}`,
          actor: (a.changed_by_profile as any)?.full_name })
      }

      const { data: queueRows } = await supabase
        .from('queue_updates')
        .select('id, job_id, checkin_time, processing_completed_at, queue_number, service_centre:service_centres(name), logged_by_profile:profiles!queue_updates_logged_by_fkey(full_name)')
        .in('job_id', jobIds)
      for (const q of queueRows ?? []) {
        events.push({ id: `queue-${q.id}`, at: q.checkin_time, color: '#fbbf24', icon: Factory,
          label: `SC check-in — ${jobNoOf(q.job_id)}`,
          detail: `${(q.service_centre as any)?.name ?? '—'}${q.queue_number ? ` · Queue #${q.queue_number}` : ''}`,
          actor: (q.logged_by_profile as any)?.full_name })
        if (q.processing_completed_at) {
          events.push({ id: `queue-done-${q.id}`, at: q.processing_completed_at, color: '#34d399', icon: Factory,
            label: `Processing complete — ${jobNoOf(q.job_id)}`, detail: (q.service_centre as any)?.name ?? '—' })
        }
      }

      const { data: expenseRows } = await supabase
        .from('expenses')
        .select('id, job_id, category, amount_inr, status, created_at, reviewed_at, logged_by_profile:profiles!expenses_logged_by_fkey(full_name)')
        .in('job_id', jobIds)
      for (const e of expenseRows ?? []) {
        events.push({ id: `expense-${e.id}`, at: e.created_at, color: '#fbbf24', icon: Receipt,
          label: `Expense logged — ${jobNoOf(e.job_id)}`, detail: `${e.category} · ₹${Number(e.amount_inr).toLocaleString('en-IN')}`,
          actor: (e.logged_by_profile as any)?.full_name })
        if (e.status !== 'pending' && e.reviewed_at) {
          events.push({ id: `expense-review-${e.id}`, at: e.reviewed_at, color: e.status === 'approved' ? '#34d399' : '#f87171', icon: Receipt,
            label: `Expense ${e.status} — ${jobNoOf(e.job_id)}`, detail: `${e.category} · ₹${Number(e.amount_inr).toLocaleString('en-IN')}` })
        }
      }

      const { data: deliveryRows } = await supabase
        .from('deliveries')
        .select('id, job_id, delivery_status, customer_name, delivered_at, created_at, destination_changed, old_destination, new_destination, authorised_by_office, created_by_profile:profiles!deliveries_created_by_fkey(full_name)')
        .in('job_id', jobIds)
      for (const d of deliveryRows ?? []) {
        events.push({ id: `delivery-${d.id}`, at: d.delivered_at, color: '#2dd4bf', icon: Truck,
          label: `Delivery recorded — ${jobNoOf(d.job_id)}`, detail: `${d.delivery_status} · ${d.customer_name}`,
          actor: (d.created_by_profile as any)?.full_name })
        if (d.destination_changed) {
          events.push({ id: `dest-change-${d.id}`, at: d.created_at, color: '#fb923c', icon: MapPin,
            label: `Destination changed — ${jobNoOf(d.job_id)}`,
            detail: `${d.old_destination ?? '—'} → ${d.new_destination ?? '—'} (${d.authorised_by_office ? 'office-authorised' : 'self-authorised'})` })
        }
      }
    }

    events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    setTimeline(events)
    setTimelineLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  // ── Cancel DO + cascade cancel all active linked jobs
  const handleCancel = async () => {
    setBusy(true)
    try {
      // Cancel the DO first — if this fails, no jobs get cancelled as an inconsistent side effect
      const { error: doErr } = await supabase.from('delivery_orders').update({ status: 'cancelled' }).eq('id', id)
      if (doErr) throw doErr

      const cancelableJobs = linkedJobs.filter(j => !['delivered', 'cancelled'].includes(j.status))
      if (cancelableJobs.length > 0) {
        const { error: jobsErr } = await supabase.from('jobs')
          .update({ status: 'cancelled' })
          .in('id', cancelableJobs.map(j => j.id))
        if (jobsErr) throw jobsErr
      }
      setModal(null)
      setToast(`DO cancelled. ${cancelableJobs.length} job(s) also cancelled.`)
      await fetchData()
    } catch (e: any) {
      setToast('Error: ' + (e?.message ?? 'Failed to cancel DO'))
    } finally {
      setBusy(false)
    }
  }

  // ── Hard delete (admin, draft only). do_items.do_id is ON DELETE CASCADE, so
  // deleting the DO row alone cleans up its items too.
  const handleDelete = async () => {
    setBusy(true)
    try {
      const { error: doErr, data: deletedRows } = await supabase.from('delivery_orders').delete().eq('id', id).select('id')
      if (doErr) throw doErr
      if (!deletedRows || deletedRows.length === 0) throw new Error('Delete was blocked — you may not have permission to delete this DO')
      navigate('/dos', { replace: true })
    } catch (e: any) {
      setToast('Error: ' + (e?.message ?? 'Failed to delete DO'))
      setBusy(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '0.5rem', color: 'var(--tx3)', fontSize: '0.85rem' }}>
      <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading DO…
    </div>
  )
  if (error || !doItem) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--tx3)' }}>
      DO not found. <Link to="/dos" style={{ color: 'var(--accent)' }}>Back to list</Link>
    </div>
  )

  const doColor = DO_COLORS[(doItem.status as DOStatus)] ?? '#94a3b8'
  const isCancelled = doItem.status === 'cancelled'
  const isDraft     = doItem.status === 'draft'
  const hasJob      = linkedJobs.length > 0
  const canPlan     = (isPlanner || isAdmin) && !hasJob && !isDraft && !isCancelled
  const canCancel   = (isPlanner || isAdmin) && !isCancelled && !['fully_dispatched','closed'].includes(doItem.status)
  const canDelete   = isAdmin && isDraft

  return (
    <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
      {modal && (
        <ConfirmModal
          title={modal === 'cancel' ? 'Cancel this Delivery Order?' : 'Delete this DO?'}
          body={
            modal === 'cancel'
              ? `This will mark the DO as CANCELLED and cancel all ${linkedJobs.filter(j=>!['delivered','cancelled'].includes(j.status)).length} active linked job(s). Agents will no longer see those jobs. This cannot be undone easily.`
              : 'This will permanently delete the DO and all its coil items. Only possible on Draft DOs with no jobs. This cannot be undone.'
          }
          confirmLabel={modal === 'cancel' ? 'Yes, Cancel DO & Jobs' : 'Yes, Delete Permanently'}
          confirmColor={modal === 'cancel' ? '#fb923c' : '#ef4444'}
          onConfirm={modal === 'cancel' ? handleCancel : handleDelete}
          onCancel={() => setModal(null)}
          busy={busy}
        />
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9998, background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderLeft: '4px solid #34d399', borderRadius: '0.65rem', padding: '0.75rem 1.1rem', fontSize: '0.84rem', color: 'var(--tx1)', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', maxWidth: 340 }}>
          {toast}
          <button onClick={() => setToast('')} style={{ marginLeft: '0.75rem', background: 'none', border: 'none', color: 'var(--tx4)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button onClick={() => navigate('/dos')} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--tx3)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
          <ChevronLeft size={14} /> Orders & Jobs
        </button>
        <span style={{ color: 'var(--tx4)' }}>›</span>
        <span style={{ fontSize: '0.82rem', color: 'var(--tx2)', fontWeight: 600 }}>{doItem.do_number}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>{doItem.do_number}</h1>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.22rem 0.65rem', borderRadius: 999, background: `${doColor}22`, color: doColor, border: `1px solid ${doColor}44`, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 6, display: 'inline-block' }}>
            {DO_STATUS_LABELS[(doItem.status as DOStatus)] ?? doItem.status}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {isAdmin && (
            <button onClick={() => navigate(`/reconciliation?do=${id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', borderRadius: '0.6rem', border: '1px solid var(--gb)', background: 'var(--g2)', color: 'var(--tx2)', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}>
              <Scale size={14} /> Reconciliation
            </button>
          )}
          {canPlan && (
            <button onClick={() => navigate(`/planning?do=${id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
              <ClipboardList size={14} /> Plan Job
            </button>
          )}
          {canCancel && (
            <button onClick={() => setModal('cancel')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', borderRadius: '0.6rem', border: '1px solid rgba(251,146,60,0.5)', background: 'rgba(251,146,60,0.1)', color: '#fb923c', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}>
              <XCircle size={14} /> Cancel DO
            </button>
          )}
          {canDelete && (
            <button onClick={() => setModal('delete')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', borderRadius: '0.6rem', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}>
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Cancelled banner */}
      {isCancelled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.85rem 1.1rem', borderRadius: '0.7rem', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)', marginBottom: '1.25rem' }}>
          <XCircle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.88rem' }}>This Delivery Order is Cancelled</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--tx3)', marginTop: 2 }}>All linked jobs have been cancelled. No further processing will occur.</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: 'var(--sh-card)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx1)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Package size={14} style={{ color: 'var(--accent)' }} /> DO Details
            </div>
            <Field label="Supplier" value={doItem.supplier?.name ?? '—'} />
            <Field label="Service Centre" value={doItem.source_service_centre?.name ?? '—'} />
            <Field label="Expected Collection" value={formatDate(doItem.expected_collection_date)} />
            <Field label="Created" value={formatDate(doItem.created_at)} />
          </div>

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--gb)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx1)' }}>Coil Items ({doItem.items?.length ?? 0})</div>
            <table className="st-table">
              <thead><tr><th>Grade</th><th>Thick (mm)</th><th>Width (mm)</th><th>Qty</th><th>Wt (MT)</th></tr></thead>
              <tbody>
                {(doItem.items ?? []).map((it: any, i: number) => (
                  <tr key={i}>
                    <td className="cell-primary">{it.coil_grade}</td>
                    <td className="cell-mono">{it.thickness_mm}</td>
                    <td className="cell-mono">{it.width_mm}</td>
                    <td className="cell-mono">{it.quantity}</td>
                    <td className="cell-mono">{it.weight_mt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Linked jobs */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--gb)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx1)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={14} style={{ color: 'var(--accent)' }} /> Linked Jobs ({linkedJobs.length})
            </div>
            {linkedJobs.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--tx4)', fontSize: '0.84rem' }}>
                {isDraft ? 'Activate DO first before planning a job.' : isCancelled ? 'DO is cancelled — no jobs can be created.' : 'No job planned yet — click Plan Job above.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {linkedJobs.map((j: any) => {
                  const jc = JOB_COLORS[(j.status as JobStatus)] ?? '#94a3b8'
                  return (
                    <div key={j.id} style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--gb)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: j.status === 'cancelled' ? 0.6 : 1 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--tx1)', fontSize: '0.88rem' }}>{j.job_number}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--tx3)', marginTop: 2 }}>{j.assigned_agent?.full_name ?? 'Unassigned'} · {j.delivery_destination}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: `${jc}22`, color: jc, border: `1px solid ${jc}44`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {JOB_STATUS_LABELS[(j.status as JobStatus)] ?? j.status}
                        </span>
                        {j.status !== 'cancelled' && (
                          <Link to={`/jobs/${j.id}`} style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>View <ChevronRight size={12} /></Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)', marginTop: '1.25rem' }}>
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--gb)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx1)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <History size={14} style={{ color: 'var(--accent)' }} /> Timeline
        </div>
        {timelineLoading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--tx4)', fontSize: '0.84rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading timeline…
          </div>
        ) : timeline.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--tx4)', fontSize: '0.84rem' }}>
            No activity recorded yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {timeline.map(ev => {
              const Icon = ev.icon
              return (
                <div key={ev.id} style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--gb)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${ev.color}22`, border: `1px solid ${ev.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Icon size={13} style={{ color: ev.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--tx1)' }}>{ev.label}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--tx4)', whiteSpace: 'nowrap' }}>{formatDateTime(ev.at)}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--tx3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ArrowRight size={10} style={{ opacity: 0.5, flexShrink: 0 }} />
                      <span>{ev.detail}</span>
                    </div>
                    {ev.actor && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--tx4)', marginTop: 2 }}>by {ev.actor}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
