import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { DEMO_JOBS } from '@/lib/demoData'
import { JOB_STATUS_LABELS } from '@/types'
import type { JobStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import { ChevronRight, Plus } from 'lucide-react'

const JOB_COLORS: Record<JobStatus, string> = {
  assigned: '#94a3b8', acknowledged: '#60a5fa', at_service_centre: '#a78bfa',
  processing: '#fbbf24', processing_done: '#34d399',
  in_transit_to_customer: '#2dd4bf', delivered: '#22c55e', cancelled: '#f87171',
}

// Jobs shown here = only those that are in queue/processing stages
const QUEUE_STAGES: JobStatus[] = ['at_service_centre', 'processing', 'processing_done']

export const JobsListPage = () => {
  const { isAgent, isPlanner, isAdmin, user } = useRole()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<JobStatus | 'all'>('all')

  const baseJobs = isAgent
    ? DEMO_JOBS.filter(j => j.assigned_agent_id === user?.id)
    : DEMO_JOBS

  // Only show jobs that are in queue/processing pipeline
  const queueJobs = baseJobs.filter(j => QUEUE_STAGES.includes(j.status))
  const filtered = filter === 'all' ? queueJobs : queueJobs.filter(j => j.status === filter)

  const filterBtn = (val: JobStatus | 'all', label: string, color?: string) => (
    <button
      onClick={() => setFilter(val)}
      style={{
        padding: '0.35rem 0.85rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
        border: filter === val ? `1px solid ${color ?? 'var(--accent)'}` : '1px solid var(--gb)',
        background: filter === val ? `${color ?? 'var(--accent)'}22` : 'transparent',
        color: filter === val ? (color ?? 'var(--accent)') : 'var(--tx3)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >{label}</button>
  )

  return (
    <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div className="breadcrumb" style={{ marginBottom: '0.4rem' }}>
            <span>SteelTrack</span><span className="sep">›</span><span className="active">Queue Jobs</span>
          </div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Jobs at Service Centre</h1>
          <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Jobs currently in queue or processing — mark done to move to deliveries</p>
        </div>
        {(isPlanner || isAdmin) && (
          <button onClick={() => navigate('/jobs/new')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}>
            <Plus size={14} /> New Job
          </button>
        )}
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
        {filterBtn('all', 'All')}
        {filterBtn('at_service_centre', 'At SC', '#a78bfa')}
        {filterBtn('processing', 'Processing', '#fbbf24')}
        {filterBtn('processing_done', 'Done — Ready', '#34d399')}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', color: 'var(--tx3)', fontSize: '0.88rem' }}>
          No jobs in this stage
        </div>
      ) : (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="st-table">
              <thead>
                <tr><th>Job #</th><th>Customer</th><th>Destination</th><th>Service Type</th><th>Agent</th><th>Status</th><th>Delivery Date</th><th /></tr>
              </thead>
              <tbody>
                {filtered.map(j => {
                  const color = JOB_COLORS[j.status]
                  const isDone = j.status === 'processing_done'
                  return (
                    <tr key={j.id}>
                      <td><span className="cell-primary">{j.job_number}</span></td>
                      <td>{j.customer?.name ?? '—'}</td>
                      <td>{j.delivery_destination}</td>
                      <td style={{ color: 'var(--tx3)', fontSize: '0.8rem' }}>{j.service_type}</td>
                      <td style={{ color: 'var(--tx3)' }}>{j.assigned_agent?.full_name ?? '—'}</td>
                      <td>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: `${color}22`, color, border: `1px solid ${color}44`, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                          {JOB_STATUS_LABELS[j.status]}
                        </span>
                      </td>
                      <td className="cell-mono" style={{ color: 'var(--tx3)', fontSize: '0.78rem' }}>{j.planned_delivery_date ? formatDate(j.planned_delivery_date) : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          {isDone && (
                            <button
                              onClick={() => navigate(`/deliveries/log?job=${j.id}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.75rem', borderRadius: '0.45rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              → Deliver
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/jobs/${j.id}`)}
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
    </div>
  )
}
