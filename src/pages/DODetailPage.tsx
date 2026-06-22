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
import { formatDate } from '@/lib/utils'
import {
  ClipboardList, ChevronLeft, Package, User, ChevronRight,
  CheckCircle2, XCircle, Trash2, AlertTriangle, Loader2,
} from 'lucide-react'

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

  // cancel / delete modal state
  const [modal, setModal] = useState<'cancel' | 'delete' | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  // plan job form
  const [planning, setPlanning] = useState(false)
  const [agents, setAgents] = useState<any[]>([])
  const [form, setForm] = useState({ agentId: '', destination: '', serviceType: 'slitting', plannedDate: '', instructions: '' })
  const [saved, setSaved] = useState(false)

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

    const { data: agentRows } = await supabase
      .from('profiles').select('id, full_name').in('role', ['agent']).order('full_name')
    setAgents(agentRows ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [id])

  // ── Cancel DO + cascade cancel all active linked jobs
  const handleCancel = async () => {
    setBusy(true)
    try {
      // Cancel all non-terminal linked jobs
      const cancelableJobs = linkedJobs.filter(j => !['delivered', 'cancelled'].includes(j.status))
      if (cancelableJobs.length > 0) {
        await supabase.from('jobs')
          .update({ status: 'cancelled' })
          .in('id', cancelableJobs.map(j => j.id))
      }
      // Cancel the DO
      await supabase.from('delivery_orders').update({ status: 'cancelled' as any }).eq('id', id)
      setModal(null)
      setToast(`DO cancelled. ${cancelableJobs.length} job(s) also cancelled.`)
      await fetchData()
    } catch (e: any) {
      setToast('Error: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  // ── Hard delete (admin, draft only)
  const handleDelete = async () => {
    setBusy(true)
    try {
      await supabase.from('do_items').delete().eq('do_id', id)
      await supabase.from('delivery_orders').delete().eq('id', id)
      navigate('/dos', { replace: true })
    } catch (e: any) {
      setToast('Error: ' + e.message)
      setBusy(false)
    }
  }

  // ── Save job plan
  const handleSavePlan = async () => {
    if (!form.agentId || !form.destination) return
    const jobNum = `JOB-${Date.now().toString().slice(-6)}`
    const { error } = await supabase.from('jobs').insert({
      job_number: jobNum, do_id: id, customer_id: null,
      delivery_destination: form.destination,
      service_type: form.serviceType,
      assigned_agent_id: form.agentId,
      planned_delivery_date: form.plannedDate || null,
      processing_instructions: form.instructions,
      status: 'assigned',
    })
    if (!error) { setSaved(true); setPlanning(false); await fetchData() }
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

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
    border: '1px solid var(--input-border)', background: 'var(--input-bg)',
    color: 'var(--tx1)', fontSize: '0.84rem', outline: 'none', ...extra,
  })

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
          {canPlan && !planning && (
            <button onClick={() => setPlanning(true)}
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
          {/* Plan job form */}
          {planning && (
            <div style={{ background: 'var(--card-bg)', border: '2px solid rgba(167,139,250,0.4)', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: '0 4px 24px rgba(124,58,237,0.15)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx1)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ClipboardList size={15} style={{ color: '#a78bfa' }} /> Plan & Assign Job
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>Assign Agent</label>
                  <select value={form.agentId} onChange={e => setForm(f => ({ ...f, agentId: e.target.value }))} style={inp()}>
                    <option value="">Select agent…</option>
                    {agents.map((a: any) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>Delivery Destination</label>
                  <input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="City / address" style={inp()} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>Service Type</label>
                    <select value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} style={inp()}>
                      <option value="ctl">Cut-to-Length</option>
                      <option value="slitting">Slitting</option>
                      <option value="packing_only">Packing Only</option>
                      <option value="coil_to_coil">Coil-to-Coil</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>Planned Delivery</label>
                    <input type="date" value={form.plannedDate} onChange={e => setForm(f => ({ ...f, plannedDate: e.target.value }))} style={inp()} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 4 }}>Processing Instructions</label>
                  <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Cut sizes, tolerances, special notes…" rows={3} style={inp({ resize: 'vertical' })} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <button onClick={() => setPlanning(false)} style={{ padding: '0.45rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--gb)', background: 'var(--g2)', color: 'var(--tx2)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>Discard</button>
                  <button onClick={handleSavePlan} style={{ padding: '0.45rem 1.1rem', borderRadius: '0.5rem', border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>Save Job</button>
                </div>
              </div>
            </div>
          )}

          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem', borderRadius: '0.65rem', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)' }}>
              <CheckCircle2 size={15} style={{ color: '#34d399' }} />
              <span style={{ fontSize: '0.84rem', color: 'var(--tx1)', fontWeight: 600 }}>Job created and agent assigned successfully.</span>
            </div>
          )}

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
    </div>
  )
}
