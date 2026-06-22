import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { DEMO_JOBS } from '@/lib/demoData'
import { formatDate } from '@/lib/utils'
import { Briefcase, Search, Filter, MapPin, Calendar, User, PlusCircle, ChevronRight } from 'lucide-react'
import { JOB_STATUS_LABELS, SERVICE_TYPE_LABELS } from '@/types'
import type { JobStatus } from '@/types'

const JS_COLORS: Record<JobStatus, string> = {
  assigned:               '#94a3b8',
  acknowledged:           '#60a5fa',
  at_service_centre:      '#a78bfa',
  processing:             '#fbbf24',
  processing_done:        '#34d399',
  in_transit_to_customer: '#2dd4bf',
  delivered:              '#22c55e',
  cancelled:              '#f87171',
}

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 960, margin: '0 auto' }}>
    {children}
  </div>
)

export const JobsListPage = () => {
  const { isAgent, canCreate, user } = useRole()
  const navigate = useNavigate()
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState<JobStatus | 'all'>('all')

  // Agent sees only their jobs; everyone else sees all
  const base = isAgent
    ? DEMO_JOBS.filter(j => j.assigned_agent_id === user?.id)
    : DEMO_JOBS

  const filtered = base.filter(j => {
    const ms = !search ||
      j.job_number.toLowerCase().includes(search.toLowerCase()) ||
      (j.customer?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      j.delivery_destination.toLowerCase().includes(search.toLowerCase())
    const mf = statusFilter === 'all' || j.status === statusFilter
    return ms && mf
  })

  const activeCount    = base.filter(j => !['delivered', 'cancelled'].includes(j.status)).length
  const deliveredCount = base.filter(j => j.status === 'delivered').length

  return (
    <PageShell>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <div className="breadcrumb" style={{ marginBottom: '0.4rem' }}>
            <span>SteelTrack</span><span className="sep">›</span>
            <span className="active">{isAgent ? 'My Jobs' : 'All Jobs'}</span>
          </div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            {isAgent ? 'My Job Cards' : 'Jobs'}
          </h1>
          <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            {isAgent
              ? 'Your assigned field jobs — update status at each stage'
              : 'All field jobs across agents'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.70rem', fontWeight: 700, padding: '0.26rem 0.7rem', borderRadius: 999, background: 'rgba(99,102,241,0.15)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.25)' }}>
            {activeCount} active
          </span>
          <span style={{ fontSize: '0.70rem', fontWeight: 700, padding: '0.26rem 0.7rem', borderRadius: 999, background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
            {deliveredCount} delivered
          </span>
          {canCreate && (
            <button onClick={() => navigate('/jobs/new')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none',
                background: 'linear-gradient(135deg,#2dd4bf,#0d9488)',
                color: '#07211e', fontWeight: 700, fontSize: '0.82rem',
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(45,212,191,0.25)',
              }}>
              <PlusCircle size={14} /> New Job
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx3)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search job #, customer, destination…"
            style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 36, borderRadius: '0.55rem', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--tx1)', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx3)', pointerEvents: 'none' }} />
          <select value={statusFilter} onChange={e => setStatus(e.target.value as JobStatus | 'all')}
            style={{ height: 36, paddingLeft: 28, paddingRight: 10, borderRadius: '0.55rem', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--tx2)', fontSize: '0.84rem', outline: 'none', cursor: 'pointer' }}>
            <option value="all">All Statuses</option>
            {(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map(s => (
              <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Agent workflow hint */}
      {isAgent && (
        <div style={{
          display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '1rem',
          paddingBottom: '0.25rem',
        }}>
          {[
            { step: '1', label: 'Acknowledge Job',    color: '#60a5fa' },
            { step: '2', label: 'Check-in to SC',     color: '#a78bfa' },
            { step: '3', label: 'Log SC Queue',       color: '#fbbf24' },
            { step: '4', label: 'Mark Processing Done', color: '#34d399' },
            { step: '5', label: 'Log Weight Slip + Dispatch', color: '#2dd4bf' },
            { step: '6', label: 'Log Delivery',       color: '#22c55e' },
          ].map(s => (
            <div key={s.step} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0,
              padding: '0.35rem 0.75rem', borderRadius: 999,
              background: 'var(--g1)', border: `1px solid ${s.color}44`,
            }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: '#07211e', flexShrink: 0 }}>{s.step}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--tx2)', fontWeight: 500, whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Job cards */}
      {filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem' }}>
          <Briefcase size={32} style={{ color: 'var(--tx4)', margin: '0 auto 0.75rem' }} />
          <div style={{ color: 'var(--tx2)', fontWeight: 600 }}>No jobs found</div>
          <div style={{ color: 'var(--tx3)', fontSize: '0.80rem', marginTop: '0.25rem' }}>Adjust your search or filter</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filtered.map(job => {
            const accent = JS_COLORS[job.status]
            return (
              <Link key={job.id} to={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                  borderRadius: '0.85rem', padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  transition: 'all 0.16s ease',
                  borderLeft: `3px solid ${accent}`,
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--g3)'; el.style.transform = 'translateX(3px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--card-bg)'; el.style.transform = 'translateX(0)' }}
                >
                  {/* Icon */}
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Briefcase size={16} style={{ color: accent }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx1)' }}>{job.job_number}</span>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem',
                        borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: `${accent}22`, color: accent, border: `1px solid ${accent}44`,
                      }}>
                        {JOB_STATUS_LABELS[job.status]}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--tx2)', marginTop: '0.2rem' }}>{job.customer?.name}</div>
                    <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--tx3)' }}>
                        <MapPin size={11} /> {job.delivery_destination}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--tx3)' }}>
                        <Calendar size={11} /> {formatDate(job.planned_delivery_date)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--tx3)' }}>
                        <User size={11} /> {job.assigned_agent?.full_name ?? 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  {/* Right meta */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--tx4)' }}>DO Ref</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--tx2)', marginTop: 2 }}>{job.do?.do_number}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--tx3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{SERVICE_TYPE_LABELS[job.service_type]}</div>
                  </div>

                  <ChevronRight size={15} style={{ color: 'var(--tx4)', flexShrink: 0 }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
