import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { DEMO_DOS, DEMO_JOBS, DEMO_AGENTS } from '@/lib/demoData'
import { DO_STATUS_LABELS, JOB_STATUS_LABELS } from '@/types'
import type { DOStatus, JobStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import { ClipboardList, ChevronLeft, Package, User, ChevronRight, CheckCircle2 } from 'lucide-react'

const DO_COLORS: Record<DOStatus, string> = {
  draft: '#94a3b8', active: '#60a5fa', partially_dispatched: '#fbbf24',
  fully_dispatched: '#34d399', closed: '#6b7280',
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

export const DODetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isPlanner, isAdmin } = useRole()

  const doItem = DEMO_DOS.find(d => d.id === id)
  const linkedJobs = DEMO_JOBS.filter(j => j.do_id === id)
  const hasJob = linkedJobs.length > 0

  const [planning, setPlanning] = useState(false)
  const [form, setForm] = useState({ agentId: '', destination: '', serviceType: 'slitting', plannedDate: '', instructions: '' })
  const [saved, setSaved] = useState(false)

  if (!doItem) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--tx3)' }}>
      DO not found. <Link to="/dos" style={{ color: 'var(--accent)' }}>Back to list</Link>
    </div>
  )

  const doColor = DO_COLORS[doItem.status]
  const canPlan = (isPlanner || isAdmin) && !hasJob && doItem.status !== 'draft'

  const handleSavePlan = () => { setSaved(true); setPlanning(false) }

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
    border: '1px solid var(--input-border)', background: 'var(--input-bg)',
    color: 'var(--tx1)', fontSize: '0.84rem', outline: 'none', ...extra,
  })

  return (
    <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button onClick={() => navigate('/dos')} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--tx3)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
          <ChevronLeft size={14} /> Orders & Jobs
        </button>
        <span style={{ color: 'var(--tx4)' }}>›</span>
        <span style={{ fontSize: '0.82rem', color: 'var(--tx2)', fontWeight: 600 }}>{doItem.do_number}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>{doItem.do_number}</h1>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.22rem 0.65rem', borderRadius: 999, background: `${doColor}22`, color: doColor, border: `1px solid ${doColor}44`, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 6, display: 'inline-block' }}>
            {DO_STATUS_LABELS[doItem.status]}
          </span>
        </div>
        {canPlan && !planning && (
          <button onClick={() => setPlanning(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124,58,237,0.3)' }}>
            <ClipboardList size={15} /> Plan Job
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
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
                {(doItem.items ?? []).map((it, i) => (
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                    {DEMO_AGENTS.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
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
                  <button onClick={() => setPlanning(false)} style={{ padding: '0.45rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--gb)', background: 'var(--g2)', color: 'var(--tx2)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>Cancel</button>
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

          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--gb)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx1)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={14} style={{ color: 'var(--accent)' }} /> Linked Jobs ({linkedJobs.length})
            </div>
            {linkedJobs.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--tx4)', fontSize: '0.84rem' }}>
                {doItem.status === 'draft' ? 'Activate DO first before planning a job.' : 'No job planned yet — click Plan Job above.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {linkedJobs.map(j => {
                  const jc = JOB_COLORS[j.status]
                  return (
                    <div key={j.id} style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--gb)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--tx1)', fontSize: '0.88rem' }}>{j.job_number}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--tx3)', marginTop: 2 }}>{j.assigned_agent?.full_name ?? '—'} · {j.delivery_destination}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: `${jc}22`, color: jc, border: `1px solid ${jc}44`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{JOB_STATUS_LABELS[j.status]}</span>
                        <Link to={`/jobs/${j.id}`} style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>View <ChevronRight size={12} /></Link>
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
