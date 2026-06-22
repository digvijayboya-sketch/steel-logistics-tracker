/**
 * JobsListPage.tsx – live Supabase via useDataStore.
 * AGENT view: cancelled jobs are HIDDEN by default (they only show if agent
 *   explicitly clicks the Cancelled filter tab).
 * PLANNER/ADMIN view: all jobs, with Cancelled filter tab available.
 * Cancelled rows are visually dimmed and + Queue / → Deliver buttons are suppressed.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { useDataStore } from '@/store/dataStore'
import { JOB_STATUS_LABELS } from '@/types'
import type { JobStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import { Briefcase, ChevronRight, Plus, Loader2, XCircle } from 'lucide-react'

const JOB_COLORS: Record<JobStatus, string> = {
  assigned:               '#94a3b8',
  acknowledged:           '#60a5fa',
  at_service_centre:      '#a78bfa',
  processing:             '#fbbf24',
  processing_done:        '#34d399',
  in_transit_to_customer: '#2dd4bf',
  delivered:              '#22c55e',
  cancelled:              '#f87171',
}

const ALL_STATUSES: JobStatus[] = [
  'assigned', 'acknowledged', 'at_service_centre',
  'processing', 'processing_done',
  'in_transit_to_customer', 'delivered', 'cancelled',
]

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
    {children}
  </div>
)

export const JobsListPage = () => {
  const { isAgent, isPlanner, isAdmin, user } = useRole()
  const navigate = useNavigate()
  const { jobs, loading, fetchJobs } = useDataStore()
  const [filter, setFilter] = useState<JobStatus | 'all'>('all')

  useEffect(() => { fetchJobs() }, [])

  const isLoading = !!loading['jobs']

  // Agents see only their own jobs; by default cancelled are excluded for agents
  const baseJobs = isAgent
    ? jobs.filter(j => j.assigned_agent_id === user?.id)
    : jobs

  // When filter is 'all', agents don't see cancelled jobs by default
  // They have to explicitly click the Cancelled tab to see them
  const filtered = filter === 'all'
    ? isAgent
      ? baseJobs.filter(j => j.status !== 'cancelled')
      : baseJobs
    : baseJobs.filter(j => j.status === filter)

  const counts = ALL_STATUSES.reduce<Partial<Record<JobStatus, number>>>((acc, s) => {
    acc[s] = baseJobs.filter(j => j.status === s).length
    return acc
  }, {})

  const cancelledCount = counts['cancelled'] ?? 0

  const filterBtn = (val: JobStatus | 'all', label: string, color?: string) => {
    const count = val === 'all'
      ? isAgent
        ? baseJobs.filter(j => j.status !== 'cancelled').length
        : baseJobs.length
      : (counts[val as JobStatus] ?? 0)
    const active = filter === val
    return (
      <button
        key={val}
        onClick={() => setFilter(val)}
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
            <span className="active">Jobs</span>
          </div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            {isAgent ? 'My Jobs' : 'All Jobs'}
          </h1>
          <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            {isAgent
              ? `Jobs assigned to you · ${cancelledCount > 0 ? `${cancelledCount} cancelled (hidden)` : 'no cancelled jobs'}`
              : 'All jobs across agents and stages'}
          </p>
        </div>
        {(isPlanner || isAdmin) && (
          <button
            onClick={() => navigate('/jobs/new')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(45,212,191,0.25)' }}
          >
            <Plus size={14} /> New Job
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.1rem', alignItems: 'center' }}>
        {filterBtn('all', 'All')}
        {filterBtn('assigned',               'Assigned',       JOB_COLORS.assigned)}
        {filterBtn('acknowledged',            'Acknowledged',   JOB_COLORS.acknowledged)}
        {filterBtn('at_service_centre',       'At SC',          JOB_COLORS.at_service_centre)}
        {filterBtn('processing',              'Processing',     JOB_COLORS.processing)}
        {filterBtn('processing_done',         'Ready',          JOB_COLORS.processing_done)}
        {filterBtn('in_transit_to_customer',  'In Transit',     JOB_COLORS.in_transit_to_customer)}
        {filterBtn('delivered',               'Delivered',      JOB_COLORS.delivered)}
        {/* Cancelled tab — always visible but visually de-emphasised */}
        {cancelledCount > 0 && (
          <button
            onClick={() => setFilter(filter === 'cancelled' ? 'all' : 'cancelled')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.38rem 0.9rem', borderRadius: 999, fontSize: '0.76rem', fontWeight: 600,
              border: filter === 'cancelled' ? '1px solid #f87171' : '1px dashed rgba(248,113,113,0.4)',
              background: filter === 'cancelled' ? 'rgba(248,113,113,0.15)' : 'transparent',
              color: filter === 'cancelled' ? '#f87171' : 'rgba(248,113,113,0.7)',
              cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            <XCircle size={11} />
            Cancelled
            <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.08rem 0.38rem', borderRadius: 999, background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
              {cancelledCount}
            </span>
          </button>
        )}
      </div>

      {/* Agent notice when they have cancelled jobs */}
      {isAgent && cancelledCount > 0 && filter !== 'cancelled' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', borderRadius: '0.6rem', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', marginBottom: '0.85rem', fontSize: '0.78rem', color: 'rgba(248,113,113,0.9)' }}>
          <XCircle size={12} />
          <span><strong>{cancelledCount}</strong> of your job{cancelledCount !== 1 ? 's have' : ' has'} been cancelled by the operations team and {cancelledCount !== 1 ? 'are' : 'is'} hidden. <button onClick={() => setFilter('cancelled')} style={{ background: 'none', border: 'none', color: '#f87171', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', padding: 0 }}>View them →</button></span>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--tx3)', fontSize: '0.88rem' }}>
          <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading jobs…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', boxShadow: 'var(--sh-card)' }}>
          <Briefcase size={32} style={{ color: 'var(--tx4)', marginBottom: '0.75rem' }} />
          <div style={{ color: 'var(--tx2)', fontWeight: 600, fontSize: '0.9rem' }}>No jobs found</div>
          <div style={{ color: 'var(--tx4)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
            {filter === 'all' ? 'No jobs have been created yet.' : `No jobs with status "${JOB_STATUS_LABELS[filter as JobStatus]}".`}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="st-table">
              <thead>
                <tr>
                  <th>Job #</th>
                  <th>Customer</th>
                  <th>Destination</th>
                  <th>Service Type</th>
                  <th>Agent</th>
                  <th>Status</th>
                  <th>Delivery Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map(j => {
                  const color = JOB_COLORS[j.status]
                  const isCancelled = j.status === 'cancelled'
                  const isDone = j.status === 'processing_done'
                  const canQueue = ['assigned', 'acknowledged'].includes(j.status)
                  return (
                    <tr key={j.id} style={{ opacity: isCancelled ? 0.5 : 1 }}>
                      <td>
                        <span className="cell-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {isCancelled && <XCircle size={11} style={{ color: '#f87171', flexShrink: 0 }} />}
                          {j.job_number}
                        </span>
                      </td>
                      <td>{j.customer?.name ?? '—'}</td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {j.delivery_destination}
                      </td>
                      <td style={{ color: 'var(--tx3)', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                        {j.service_type?.replace(/_/g, ' ') ?? '—'}
                      </td>
                      <td style={{ color: 'var(--tx3)' }}>{j.assigned_agent?.full_name ?? '—'}</td>
                      <td>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem',
                          borderRadius: 999, background: `${color}22`, color,
                          border: `1px solid ${color}44`, textTransform: 'uppercase',
                          letterSpacing: '0.05em', whiteSpace: 'nowrap',
                        }}>
                          {JOB_STATUS_LABELS[j.status]}
                        </span>
                      </td>
                      <td className="cell-mono" style={{ color: 'var(--tx3)', fontSize: '0.78rem' }}>
                        {j.planned_delivery_date ? formatDate(j.planned_delivery_date) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          {/* Suppress action buttons for cancelled jobs */}
                          {!isCancelled && canQueue && (isAgent || isAdmin || isPlanner) && (
                            <button
                              onClick={() => navigate(`/queue/log?job=${j.id}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: '0.45rem', border: 'none', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: '0.73rem', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(124,58,237,0.25)' }}
                            >
                              + Queue
                            </button>
                          )}
                          {!isCancelled && isDone && (
                            <button
                              onClick={() => navigate(`/deliveries/log?job=${j.id}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', borderRadius: '0.45rem', border: 'none', background: 'linear-gradient(135deg,#34d399,#059669)', color: '#fff', fontWeight: 700, fontSize: '0.73rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            >
                              → Deliver
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/jobs/${j.id}`)}
                            style={{ display: 'flex', alignItems: 'center', gap: 2, color: isCancelled ? 'var(--tx4)' : 'var(--accent)', fontWeight: 600, fontSize: '0.78rem', background: 'none', border: 'none', cursor: 'pointer' }}
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

          <div style={{ padding: '0.6rem 1.25rem', borderTop: '1px solid var(--gb)', fontSize: '0.75rem', color: 'var(--tx4)' }}>
            {filtered.length} job{filtered.length !== 1 ? 's' : ''}{filter !== 'all' ? ` · filtered by "${JOB_STATUS_LABELS[filter as JobStatus]}"` : ''}
          </div>
        </div>
      )}
    </PageShell>
  )
}
