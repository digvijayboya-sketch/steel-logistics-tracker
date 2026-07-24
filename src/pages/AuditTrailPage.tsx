import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { useDataStore } from '@/store/dataStore'
import { formatDateTime } from '@/lib/utils'
import { History, Loader2, ChevronRight, ArrowRight } from 'lucide-react'
import { DO_STATUS_LABELS, JOB_STATUS_LABELS } from '@/types'
import type { DOStatus, JobStatus } from '@/types'

const inp: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.7rem', borderRadius: '0.55rem',
  border: '1px solid var(--input-border)', background: 'var(--input-bg)',
  color: 'var(--tx1)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' as const,
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.68rem', fontWeight: 700,
  color: 'var(--tx4)', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 4,
}

const ENTITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'delivery_orders', label: 'Delivery Order' },
  { value: 'jobs',            label: 'Job' },
  { value: 'expenses',        label: 'Expense' },
  { value: 'deliveries',      label: 'Delivery' },
]

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1000, margin: '0 auto' }}>
    {children}
  </div>
)

export const AuditTrailPage = () => {
  const { isAdmin } = useRole()
  const {
    auditLog, dos, jobs, expenses, allProfiles, loading,
    fetchAuditLog, fetchDOs, fetchJobs, fetchExpenses, fetchAllProfiles,
  } = useDataStore()

  useEffect(() => { fetchAuditLog(); fetchDOs(); fetchJobs(); fetchExpenses(); fetchAllProfiles() }, [])

  const [entityFilter, setEntityFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const isLoading = loading['auditLog']

  const resolveRef = (entity: string, entityId: string): { label: string; href?: string } => {
    if (entity === 'delivery_orders') {
      const d = dos.find(x => x.id === entityId)
      return { label: d?.do_number ?? entityId.slice(0, 8), href: d ? `/dos/${d.id}` : undefined }
    }
    if (entity === 'jobs') {
      const j = jobs.find(x => x.id === entityId)
      return { label: j?.job_number ?? entityId.slice(0, 8), href: j ? `/jobs/${j.id}` : undefined }
    }
    if (entity === 'expenses') {
      const e = expenses.find(x => x.id === entityId)
      const jobNo = e ? jobs.find(j => j.id === e.job_id)?.job_number : undefined
      return { label: jobNo ? `Expense on ${jobNo}` : `Expense #${entityId.slice(0, 8)}`, href: '/expenses' }
    }
    if (entity === 'deliveries') {
      return { label: `Delivery #${entityId.slice(0, 8)}`, href: '/deliveries' }
    }
    return { label: entityId.slice(0, 8) }
  }

  const formatValue = (entity: string, field: string, value: string | null): string => {
    if (!value) return '—'
    if (field === 'status' && entity === 'delivery_orders') return DO_STATUS_LABELS[value as DOStatus] ?? value
    if (field === 'status' && entity === 'jobs') return JOB_STATUS_LABELS[value as JobStatus] ?? value
    return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')
  }

  const filtered = useMemo(() => {
    return auditLog.filter(entry => {
      if (entityFilter && entry.entity !== entityFilter) return false
      if (userFilter && entry.changed_by !== userFilter) return false
      if (dateFrom && new Date(entry.changed_at) < new Date(dateFrom)) return false
      if (dateTo && new Date(entry.changed_at) > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
  }, [auditLog, entityFilter, userFilter, dateFrom, dateTo])

  const ENTITY_LABELS: Record<string, string> = {
    delivery_orders: 'Delivery Order', jobs: 'Job', expenses: 'Expense', deliveries: 'Delivery',
  }
  const ENTITY_COLORS: Record<string, string> = {
    delivery_orders: '#a78bfa', jobs: '#60a5fa', expenses: '#fbbf24', deliveries: '#34d399',
  }

  if (!isAdmin) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--tx3)' }}>
      Only Admin can view the Audit Trail.
    </div>
  )

  return (
    <PageShell>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Audit Trail</h1>
        <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Chronological log of status changes across DOs, jobs, expenses, and deliveries</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
        <div>
          <label style={lbl}>Entity Type</label>
          <select style={inp} value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
            <option value="">All entities</option>
            {ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>User</label>
          <select style={inp} value={userFilter} onChange={e => setUserFilter(e.target.value)}>
            <option value="">All users</option>
            {allProfiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>From</label>
          <input style={inp} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div>
          <label style={lbl}>To</label>
          <input style={inp} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--tx3)', fontSize: '0.82rem', marginBottom: '1rem' }}>
          <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading audit log…
        </div>
      )}

      {!isLoading && filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem' }}>
          <History size={32} style={{ color: 'var(--tx4)', margin: '0 auto 0.75rem' }} />
          <div style={{ color: 'var(--tx2)', fontWeight: 600 }}>No audit events found</div>
          <div style={{ color: 'var(--tx4)', fontSize: '0.78rem', marginTop: 4 }}>Status changes on DOs, jobs, expenses, and deliveries will appear here</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(entry => {
            const ref = resolveRef(entry.entity, entry.entity_id)
            const color = ENTITY_COLORS[entry.entity] ?? '#94a3b8'
            return (
              <div key={entry.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderLeft: `3px solid ${color}`, borderRadius: '0.7rem', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 130, fontSize: '0.74rem', color: 'var(--tx4)' }}>{formatDateTime(entry.changed_at)}</div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.16rem 0.5rem', borderRadius: 999, background: `${color}22`, color, border: `1px solid ${color}44`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {ENTITY_LABELS[entry.entity] ?? entry.entity}
                </span>
                {ref.href ? (
                  <Link to={ref.href} style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.84rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                    {ref.label} <ChevronRight size={12} />
                  </Link>
                ) : (
                  <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--tx1)' }}>{ref.label}</span>
                )}
                <div style={{ fontSize: '0.82rem', color: 'var(--tx2)', display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: 200 }}>
                  <span style={{ color: 'var(--tx4)' }}>{entry.field}:</span>
                  <span>{formatValue(entry.entity, entry.field, entry.old_value)}</span>
                  <ArrowRight size={11} style={{ color: 'var(--tx4)' }} />
                  <span style={{ fontWeight: 700, color: 'var(--tx1)' }}>{formatValue(entry.entity, entry.field, entry.new_value)}</span>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--tx3)' }}>{entry.changed_by_profile?.full_name ?? entry.changed_by}</div>
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
