import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { DEMO_DOS, DEMO_JOBS } from '@/lib/demoData'
import { DO_STATUS_LABELS } from '@/types'
import type { DOStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import { Plus, ClipboardList, ChevronRight, FileText } from 'lucide-react'

const STATUS_COLORS: Record<DOStatus, string> = {
  draft: '#94a3b8',
  active: '#60a5fa',
  partially_dispatched: '#fbbf24',
  fully_dispatched: '#34d399',
  closed: '#6b7280',
}

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
    {children}
  </div>
)

export const DOListPage = () => {
  const { isPurchase, isPlanner, isAdmin, isAgent } = useRole()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'dos' | 'jobs'>('dos')

  // Jobs that are assigned/acknowledged (pipeline stage: needs queue)
  const pipelineJobs = DEMO_JOBS.filter(j =>
    ['assigned', 'acknowledged'].includes(j.status)
  )

  const tabStyle = (active: boolean) => ({
    padding: '0.5rem 1.25rem',
    borderRadius: '0.5rem 0.5rem 0 0',
    border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    background: 'transparent',
    color: active ? 'var(--accent)' : 'var(--tx3)',
    fontWeight: active ? 700 : 500,
    fontSize: '0.88rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  return (
    <PageShell>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div className="breadcrumb" style={{ marginBottom: '0.4rem' }}>
            <span>SteelTrack</span><span className="sep">›</span>
            <span className="active">{tab === 'dos' ? 'Delivery Orders' : 'Jobs'}</span>
          </div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Orders & Jobs</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {tab === 'dos' && (isPurchase || isAdmin) && (
            <button onClick={() => navigate('/dos/new')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(45,212,191,0.25)' }}>
              <Plus size={14} /> New DO
            </button>
          )}
          {tab === 'jobs' && (isPlanner || isAdmin) && (
            <button onClick={() => navigate('/jobs/new')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(45,212,191,0.25)' }}>
              <Plus size={14} /> New Job
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--gb)', marginBottom: '1.25rem' }}>
        <button style={tabStyle(tab === 'dos')} onClick={() => setTab('dos')}>
          <FileText size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
          Delivery Orders
        </button>
        {!isPurchase && (
          <button style={tabStyle(tab === 'jobs')} onClick={() => setTab('jobs')}>
            <ClipboardList size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
            Jobs
            {pipelineJobs.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 999, background: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                {pipelineJobs.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* DO List */}
      {tab === 'dos' && (
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
                {DEMO_DOS.map(d => {
                  const color = STATUS_COLORS[d.status]
                  const hasJob = DEMO_JOBS.some(j => j.do_id === d.id)
                  const canPlan = (isPlanner || isAdmin) && d.status === 'active' && !hasJob
                  return (
                    <tr key={d.id}>
                      <td><span className="cell-primary">{d.do_number}</span></td>
                      <td>{d.supplier?.name ?? '—'}</td>
                      <td>{d.source_service_centre?.name ?? '—'}</td>
                      <td className="cell-mono">{d.items?.length ?? 0}</td>
                      <td>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: `${color}22`, color, border: `1px solid ${color}44`, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                          {DO_STATUS_LABELS[d.status]}
                        </span>
                      </td>
                      <td className="cell-mono" style={{ color: 'var(--tx3)', fontSize: '0.78rem' }}>{formatDate(d.expected_collection_date)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {canPlan && (
                            <button
                              onClick={() => navigate(`/dos/${d.id}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.75rem', borderRadius: '0.45rem', border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}
                            >
                              <ClipboardList size={12} /> Plan
                            </button>
                          )}
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
        </div>
      )}

      {/* Jobs List (pipeline: assigned/acknowledged only) */}
      {tab === 'jobs' && (
        <div>
          {pipelineJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--tx3)', fontSize: '0.88rem' }}>No jobs pending queue assignment</div>
          ) : (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="st-table">
                  <thead>
                    <tr><th>Job #</th><th>Customer</th><th>Destination</th><th>Service Type</th><th>Agent</th><th>Status</th><th /></tr>
                  </thead>
                  <tbody>
                    {pipelineJobs.map(j => (
                      <tr key={j.id}>
                        <td><span className="cell-primary">{j.job_number}</span></td>
                        <td>{j.customer?.name ?? '—'}</td>
                        <td>{j.delivery_destination}</td>
                        <td style={{ color: 'var(--tx3)', fontSize: '0.8rem' }}>{j.service_type}</td>
                        <td style={{ color: 'var(--tx3)' }}>{j.assigned_agent?.full_name ?? '—'}</td>
                        <td>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {j.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => navigate(`/queue/log?job=${j.id}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.75rem', borderRadius: '0.45rem', border: 'none', background: 'linear-gradient(135deg,#34d399,#059669)', color: '#fff', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              + Queue
                            </button>
                            <button
                              onClick={() => navigate(`/jobs/${j.id}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--accent)', fontWeight: 600, fontSize: '0.78rem', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              View <ChevronRight size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}
