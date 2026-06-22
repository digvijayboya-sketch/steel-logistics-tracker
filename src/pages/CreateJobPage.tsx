import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { useDataStore } from '@/store/dataStore'
import { ArrowLeft, ClipboardList, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { SERVICE_TYPE_LABELS } from '@/types'
import type { ServiceType } from '@/types'

const inp: React.CSSProperties = {
  width:'100%', padding:'0.55rem 0.75rem', borderRadius:'0.55rem',
  border:'1px solid var(--input-border)', background:'var(--input-bg)',
  color:'var(--tx1)', fontSize:'0.875rem', outline:'none', boxSizing:'border-box' as const,
}
const inpLocked: React.CSSProperties = {
  ...inp,
  background: 'var(--g2)',
  color: 'var(--tx3)',
  cursor: 'not-allowed',
  border: '1px solid var(--gb)',
}
const lbl: React.CSSProperties = {
  display:'block', fontSize:'0.70rem', fontWeight:700,
  color:'var(--tx4)', textTransform:'uppercase' as const,
  letterSpacing:'0.07em', marginBottom:4,
}

export const CreateJobPage = () => {
  const navigate       = useNavigate()
  const [sp]           = useSearchParams()
  const { user }       = useAuthStore()
  const { dos, profiles, customers, fetchDOs, fetchLookups, createJob } = useDataStore()

  useEffect(() => { fetchDOs(); fetchLookups() }, [])

  // If opened with ?do=<id>, that DO is locked
  const lockedDoId = sp.get('do') ?? ''

  const activeDOs = dos.filter(d => d.status !== 'closed' && d.status !== 'draft')
  const agents    = profiles.filter(p => p.role === 'agent' || (p.role as string) === 'manager')

  const [form, setForm] = useState({
    do_id:                   lockedDoId,
    customer_id:             '',
    delivery_destination:    '',
    service_type:            'ctl' as ServiceType,
    packing_type:            '',
    assigned_agent_id:       '',
    planned_delivery_date:   '',
    processing_instructions: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const canCreate = user?.role === 'admin' || user?.role === 'planner' || user?.role === 'purchase' || (user?.role as string) === 'manager'
  if (!canCreate) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--tx3)' }}>
      Only Planner / Admin can create Jobs.
    </div>
  )

  // Derive locked DO label once DOS are loaded
  const lockedDO = lockedDoId ? dos.find(d => d.id === lockedDoId) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.do_id)                     { toast.error('Select a DO'); return }
    if (!form.customer_id)               { toast.error('Select a customer'); return }
    if (!form.delivery_destination.trim()){ toast.error('Enter delivery destination'); return }
    if (!form.assigned_agent_id)          { toast.error('Assign an agent'); return }
    setSubmitting(true)
    try {
      const jobNo = `JOB-${String(Date.now()).slice(-5)}`
      await createJob({
        job_number:              jobNo,
        do_id:                   form.do_id,
        customer_id:             form.customer_id,
        delivery_destination:    form.delivery_destination.trim(),
        service_type:            form.service_type,
        packing_type:            form.packing_type || undefined,
        assigned_agent_id:       form.assigned_agent_id,
        planned_delivery_date:   form.planned_delivery_date || undefined,
        processing_instructions: form.processing_instructions || undefined,
        created_by:              user?.id ?? '',
      } as any)
      toast.success(`${jobNo} created and pushed to Jobs`)
      navigate('/jobs')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally { setSubmitting(false) }
  }

  const card: React.CSSProperties = {
    background: 'var(--card-bg)', border: '1px solid var(--card-border)',
    borderRadius: '0.85rem', padding: '1.25rem', boxShadow: 'var(--sh-card)', marginBottom: '1rem',
  }

  return (
    <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => lockedDoId ? navigate('/dos') : navigate('/jobs')}
          style={{ width: 34, height: 34, borderRadius: '0.5rem', border: '1px solid var(--gb)', background: 'var(--g2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tx3)' }}
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Plan Job</h1>
          <p style={{ color: 'var(--tx4)', fontSize: '0.78rem', margin: 0 }}>
            {lockedDO
              ? `Planning job for ${lockedDO.do_number} — ${lockedDO.supplier?.name ?? ''}`
              : 'Plan a job from an active DO and assign an agent'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
            <ClipboardList size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx1)' }}>Job Details</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

            {/* DO field — locked if came from DO row, selectable otherwise */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>
                Delivery Order *
                {lockedDoId && <Lock size={10} style={{ marginLeft: 5, verticalAlign: 'middle', color: 'var(--tx4)' }} />}
              </label>
              {lockedDoId ? (
                <div style={{ ...inpLocked, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ flex: 1 }}>
                    {lockedDO ? `${lockedDO.do_number} — ${lockedDO.supplier?.name ?? ''}` : lockedDoId}
                  </span>
                  <Lock size={13} style={{ color: 'var(--tx4)', flexShrink: 0 }} />
                </div>
              ) : (
                <select style={inp} value={form.do_id} onChange={e => setField('do_id', e.target.value)}>
                  <option value="">Select active DO…</option>
                  {activeDOs.map(d => (
                    <option key={d.id} value={d.id}>{d.do_number} — {d.supplier?.name}</option>
                  ))}
                </select>
              )}
            </div>

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
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', paddingBottom: '2rem' }}>
          <button
            type="button"
            onClick={() => lockedDoId ? navigate('/dos') : navigate('/jobs')}
            style={{ flex: 1, padding: '0.7rem', borderRadius: '0.6rem', border: '1px solid var(--gb)', background: 'var(--g2)', color: 'var(--tx2)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{ flex: 1, padding: '0.7rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', opacity: submitting ? 0.65 : 1 }}
          >
            {submitting ? 'Creating…' : 'Create Job & Push to Jobs →'}
          </button>
        </div>
      </form>
    </div>
  )
}
