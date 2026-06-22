import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { useDataStore } from '@/store/dataStore'
import { DO_STATUS_LABELS } from '@/types'
import type { DOStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import { Plus, ClipboardList, ChevronRight, Loader2, FileText } from 'lucide-react'

const STATUS_COLORS: Record<DOStatus, string> = {
  draft:               '#94a3b8',
  active:              '#60a5fa',
  partially_dispatched:'#fbbf24',
  fully_dispatched:    '#34d399',
  closed:              '#6b7280',
}

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
    {children}
  </div>
)

export const DOListPage = () => {
  const { isPurchase, isPlanner, isAdmin } = useRole()
  const navigate = useNavigate()
  const { dos, jobs, loading, fetchDOs, fetchJobs } = useDataStore()
  const [statusFilter, setStatusFilter] = useState<DOStatus | 'all'>('all')

  useEffect(() => { fetchDOs(); fetchJobs() }, [])

  const isLoading = !!loading['dos']

  const filtered = statusFilter === 'all'
    ? dos
    : dos.filter(d => d.status === statusFilter)

  const filterBtn = (val: DOStatus | 'all', label: string, color?: string) => {
    const active = statusFilter === val
    const count  = val === 'all' ? dos.length : dos.filter(d => d.status === val).length
    return (
      <button
        key={val}
        onClick={() => setStatusFilter(val)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.38rem 0.9rem', borderRadius: 999, fontSize: '0.76rem', fontWeight: 600,
          border: active ? `1px solid ${color ?? 'var(--accent)'}` : '1px solid var(--gb)',
          background: active ? `${color ?? 'var(--accent)'}22` : 'transparent',
          color: active ? (color ?? 'var(--accent)') : 'var(--tx3)',
          cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}
      >
        {label}
        {count > 0 && (
          <span style={{
            fontSize: '0.62rem', fontWeight: 700, padding: '0.08rem 0.38rem', borderRadius: 999,
            background: active ? `${color ?? 'var(--accent)'}33` : 'var(--g3)',
            color: active ? (color ?? 'var(--accent)') : 'var(--tx4)',
          }}>
            {count}
          </span>
        )}
      </button>
    )
  }

  return (
    <PageShell>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div className="breadcrumb" style={{ marginBottom: '0.4rem' }}>
            <span>SteelTrack</span><span className="sep">›</span>
            <span className="active">Delivery Orders</span>
          </div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Delivery Orders</h1>
          <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Manage supplier DOs — plan jobs directly from an active DO</p>
        </div>
        {(isPurchase || isAdmin) && (
          <button
            onClick={() => navigate('/dos/new')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(45,212,191,0.25)' }}
          >
            <Plus size={14} /> New DO
          </button>
        )}
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
        {filterBtn('all',                'All')}
        {filterBtn('draft',              'Draft',              STATUS_COLORS.draft)}
        {filterBtn('active',             'Active',             STATUS_COLORS.active)}
        {filterBtn('partially_dispatched','Partially Dispatched',STATUS_COLORS.partially_dispatched)}
        {filterBtn('fully_dispatched',   'Fully Dispatched',   STATUS_COLORS.fully_dispatched)}
        {filterBtn('closed',             'Closed',             STATUS_COLORS.closed)}
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--tx3)', fontSize: '0.88rem' }}>
          <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading orders…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', boxShadow: 'var(--sh-card)' }}>
          <FileText size={32} style={{ color: 'var(--tx4)', marginBottom: '0.75rem' }} />
          <div style={{ color: 'var(--tx2)', fontWeight: 600, fontSize: '0.9rem' }}>No delivery orders found</div>
          <div style={{ color: 'var(--tx4)', fontSize: '0.8rem', marginTop: '0.3rem' }}>Create one using the “+ New DO” button above.</div>
        </div>
      ) : (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="st-table">
              <thead>
                <tr>
                  <th>DO Number</th>
                  <th>Supplier</th>
                  <th>Service Centre</th>
                  <th>Coils</th>
                  <th>Status</th>
                  <th>Collection Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const color   = STATUS_COLORS[d.status]
                  // A DO can have multiple jobs; show Plan button if active and no job yet
                  const hasJob  = jobs.some(j => j.do_id === d.id)
                  const canPlan = (isPlanner || isAdmin) && d.status === 'active' && !hasJob
                  return (
                    <tr key={d.id}>
                      <td><span className="cell-primary">{d.do_number}</span></td>
                      <td>{d.supplier?.name ?? '—'}</td>
                      <td>{d.source_service_centre?.name ?? '—'}</td>
                      <td className="cell-mono">{d.items?.length ?? 0}</td>
                      <td>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem',
                          borderRadius: 999, background: `${color}22`, color,
                          border: `1px solid ${color}44`, textTransform: 'uppercase',
                          letterSpacing: '0.05em', whiteSpace: 'nowrap',
                        }}>
                          {DO_STATUS_LABELS[d.status]}
                        </span>
                      </td>
                      <td className="cell-mono" style={{ color: 'var(--tx3)', fontSize: '0.78rem' }}>
                        {formatDate(d.expected_collection_date)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* Plan Job — primary CTA for active, unplanned DOs */}
                          {canPlan && (
                            <button
                              onClick={() => navigate(`/jobs/new?do=${d.id}`)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.3rem 0.75rem', borderRadius: '0.45rem', border: 'none',
                                background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff',
                                fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                                whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                              }}
                            >
                              <ClipboardList size={12} /> Plan Job
                            </button>
                          )}
                          {/* View DO detail */}
                          <button
                            onClick={() => navigate(`/dos/${d.id}`)}
                            style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--accent)', fontWeight: 600, fontSize: '0.78rem', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            View <ChevronRight size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {/* Footer */}
          <div style={{ padding: '0.6rem 1.25rem', borderTop: '1px solid var(--gb)', fontSize: '0.75rem', color: 'var(--tx4)' }}>
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}{statusFilter !== 'all' ? ` · filtered by "${DO_STATUS_LABELS[statusFilter as DOStatus]}"` : ''}
          </div>
        </div>
      )}
    </PageShell>
  )
}
