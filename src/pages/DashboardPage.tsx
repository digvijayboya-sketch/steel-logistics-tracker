import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRole, ROLE_META } from '@/hooks/useRole'
import { useDataStore } from '@/store/dataStore'
import { formatDate } from '@/lib/utils'
import { JOB_STATUS_LABELS, DO_STATUS_LABELS } from '@/types'
import type { JobStatus, DOStatus } from '@/types'
import {
  Briefcase, FileText, Receipt, Truck, Factory,
  AlertTriangle, TrendingUp, ChevronRight, Activity, Loader2, Clock, X,
} from 'lucide-react'

const JS_COLORS: Record<JobStatus, string> = {
  assigned:'#94a3b8', acknowledged:'#60a5fa', at_service_centre:'#a78bfa',
  processing:'#fbbf24', processing_done:'#34d399',
  in_transit_to_customer:'#2dd4bf', delivered:'#22c55e', cancelled:'#f87171',
}

const DO_COLORS: Record<string, string> = {
  draft: '#94a3b8', active: '#60a5fa', partially_dispatched: '#fbbf24',
  fully_dispatched: '#34d399', closed: '#6b7280', cancelled: '#f87171',
}

const STALL_MS = 48 * 60 * 60 * 1000

const timeAgo = (dateStr?: string) => {
  if (!dateStr) return '—'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const hrs = Math.floor(diffMs / (60 * 60 * 1000))
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
    {children}
  </div>
)

export const DashboardPage = () => {
  const { user, isAgent, isAdmin } = useRole()
  const navigate = useNavigate()
  const roleMeta = ROLE_META[user?.role ?? 'agent']
  const { dos, jobs, expenses, deliveries, loading, error, fetchDOs, fetchJobs, fetchExpenses, fetchDeliveries } = useDataStore()
  const [errorDismissed, setErrorDismissed] = useState(false)

  useEffect(() => {
    fetchDOs()
    fetchJobs()
    fetchExpenses()
    fetchDeliveries()
  }, [])

  useEffect(() => { setErrorDismissed(false) }, [error])

  const isLoading = loading['dos'] || loading['jobs']

  const myJobs     = isAgent ? jobs.filter(j => j.assigned_agent_id === user?.id) : jobs
  const activeJobs = myJobs.filter(j => !['delivered','cancelled'].includes(j.status))
  const activeDOs  = dos.filter(d => d.status === 'active')
  const pendingExp = expenses.filter(e => e.status === 'pending')
  const deviations = deliveries.filter(d => d.destination_changed && !d.authorised_by_office)
  const today = new Date().toDateString()
  const deliveriesToday = deliveries.filter(d => new Date(d.delivered_at).toDateString() === today)
  const scQueueActive = jobs.filter(j => ['at_service_centre', 'processing'].includes(j.status))
  const stalledJobs = jobs
    .filter(j => !['delivered', 'cancelled'].includes(j.status) && (Date.now() - new Date(j.updated_at ?? j.created_at).getTime()) > STALL_MS)
    .sort((a, b) => new Date(a.updated_at ?? a.created_at).getTime() - new Date(b.updated_at ?? b.created_at).getTime())
    .slice(0, 5)

  const recentJobs = myJobs.slice(0, 5)
  const recentDOs = dos.slice(0, 5)

  const kpis = isAgent
    ? [
        { label: 'My Active Jobs',   value: activeJobs.length,  icon: Briefcase, color: '#60a5fa', route: '/jobs',       caption: 'In progress' },
        { label: 'Pending Expenses', value: pendingExp.filter(e => { const j = jobs.find(x => x.id === e.job_id); return j?.assigned_agent_id === user?.id }).length,
          icon: Receipt, color: '#fbbf24', route: '/expenses?status=pending', caption: 'Awaiting approval' },
        { label: 'Deliveries',       value: deliveries.filter(d => { const j = jobs.find(x => x.id === d.job_id); return j?.assigned_agent_id === user?.id }).length,
          icon: Truck, color: '#34d399', route: '/deliveries', caption: 'Total records' },
      ]
    : [
        { label: 'Active Jobs',      value: activeJobs.length,      icon: Briefcase,    color: '#60a5fa', route: '/jobs',                  caption: 'Across all agents'     },
        { label: 'Active DOs',       value: activeDOs.length,       icon: FileText,     color: '#a78bfa', route: '/dos?status=active',      caption: 'In circulation'        },
        { label: 'Pending Expenses', value: pendingExp.length,      icon: Receipt,      color: '#fbbf24', route: '/expenses?status=pending',caption: 'Awaiting approval'     },
        { label: 'Deliveries Today', value: deliveriesToday.length, icon: Truck,        color: '#2dd4bf', route: '/deliveries',             caption: 'Delivered today'       },
        { label: 'SC Queue Active',  value: scQueueActive.length,   icon: Factory,      color: '#34d399', route: '/queue',                  caption: 'At SC or processing'   },
        { label: 'Route Deviations', value: deviations.length,      icon: AlertTriangle,color: '#fb923c', route: '/deliveries',             caption: 'Unauthorised reroutes' },
      ]

  return (
    <PageShell>
      {/* Welcome banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.22rem 0.65rem', borderRadius: 999, background: roleMeta.bg, color: roleMeta.color, border: `1px solid ${roleMeta.accent}44`, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {roleMeta.label}
            </span>
          </div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {user?.name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            {isAgent
              ? `Here's your field dashboard for today, ${formatDate(new Date().toISOString())}`
              : `Operations overview · ${formatDate(new Date().toISOString())}`}
          </p>
        </div>
        {isAgent && (
          <button onClick={() => navigate('/jobs')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(45,212,191,0.28)' }}>
            <Activity size={14} /> My Jobs
          </button>
        )}
        {!isAgent && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/dos')}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: '1px solid var(--gb)', background: 'var(--g2)', color: 'var(--tx2)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
              Delivery Orders
            </button>
            <button onClick={() => navigate('/jobs')}
              style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(45,212,191,0.25)' }}>
              All Jobs
            </button>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && !errorDismissed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '0.7rem', marginBottom: '1.25rem', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.28)' }}>
          <AlertTriangle size={15} style={{ color: '#f87171', flexShrink: 0 }} />
          <div style={{ fontSize: '0.84rem', color: 'var(--tx1)', flex: 1 }}>
            <span style={{ fontWeight: 700 }}>Couldn't load live data. </span>
            <span style={{ color: 'var(--tx2)' }}>{error}</span>
          </div>
          <button onClick={() => setErrorDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx3)', display: 'flex' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Loading shimmer */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--tx3)', fontSize: '0.82rem', marginBottom: '1rem' }}>
          <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading live data…
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.75rem' }}>
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <button key={k.label} onClick={() => navigate(k.route)}
              style={{ textAlign: 'left', background: 'var(--card-bg)', border: `1px solid var(--card-border)`, borderTop: `3px solid ${k.color}`, borderRadius: '0.85rem', padding: '1rem 1.1rem', cursor: 'pointer', transition: 'all 0.15s ease', boxShadow: 'var(--sh-card)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sh-lg)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--sh-card)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${k.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} style={{ color: k.color }} />
                </div>
                <TrendingUp size={12} style={{ color: 'var(--tx4)' }} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--tx2)', marginTop: '0.35rem' }}>{k.label}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--tx4)', marginTop: 2 }}>{k.caption}</div>
            </button>
          )
        })}
      </div>

      {/* Route deviation alert */}
      {!isAgent && deviations.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '0.7rem', marginBottom: '1.25rem', background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.28)' }}>
          <AlertTriangle size={15} style={{ color: '#fb923c', flexShrink: 0 }} />
          <div style={{ fontSize: '0.84rem', color: 'var(--tx1)' }}>
            <span style={{ fontWeight: 700 }}>{deviations.length} delivery reroute{deviations.length > 1 ? 's' : ''}</span>
            <span style={{ color: 'var(--tx2)' }}> require authorisation. </span>
            <Link to="/deliveries" style={{ color: '#fb923c', fontWeight: 600, textDecoration: 'none' }}>Review →</Link>
          </div>
        </div>
      )}

      {/* Recent jobs */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--gb)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx1)' }}>{isAgent ? 'Your Recent Jobs' : 'Recent Jobs'}</div>
          <Link to="/jobs" style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
            View all <ChevronRight size={13} />
          </Link>
        </div>
        {recentJobs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--tx3)', fontSize: '0.84rem' }}>
            {isLoading ? 'Loading…' : 'No jobs yet'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="st-table">
              <thead><tr><th>Job #</th><th>Customer</th><th>Destination</th><th>Status</th><th>Agent</th><th>Date</th><th /></tr></thead>
              <tbody>
                {recentJobs.map(j => {
                  const accent = JS_COLORS[j.status]
                  return (
                    <tr key={j.id}>
                      <td><span className="cell-primary">{j.job_number}</span></td>
                      <td>{j.customer?.name}</td>
                      <td>{j.delivery_destination}</td>
                      <td>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: `${accent}22`, color: accent, border: `1px solid ${accent}44`, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                          {JOB_STATUS_LABELS[j.status]}
                        </span>
                      </td>
                      <td style={{ color: 'var(--tx3)' }}>{j.assigned_agent?.full_name ?? '—'}</td>
                      <td className="cell-mono" style={{ color: 'var(--tx3)', fontSize: '0.78rem' }}>{formatDate(j.planned_delivery_date)}</td>
                      <td>
                        <Link to={`/jobs/${j.id}`} style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                          View <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isAgent && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
          {/* DO pipeline mini-table */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--gb)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx1)' }}>DO Pipeline</div>
              <Link to="/dos" style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                View all <ChevronRight size={13} />
              </Link>
            </div>
            {recentDOs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--tx3)', fontSize: '0.84rem' }}>
                {isLoading ? 'Loading…' : 'No delivery orders yet'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="st-table">
                  <thead><tr><th>DO #</th><th>Supplier</th><th>Status</th><th>Items</th><th /></tr></thead>
                  <tbody>
                    {recentDOs.map(d => {
                      const accent = DO_COLORS[d.status] ?? '#94a3b8'
                      return (
                        <tr key={d.id}>
                          <td><span className="cell-primary">{d.do_number}</span></td>
                          <td>{d.supplier?.name ?? '—'}</td>
                          <td>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: `${accent}22`, color: accent, border: `1px solid ${accent}44`, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                              {DO_STATUS_LABELS[d.status as DOStatus] ?? d.status}
                            </span>
                          </td>
                          <td style={{ color: 'var(--tx3)' }}>{d.items?.length ?? 0}</td>
                          <td>
                            <Link to={`/dos/${d.id}`} style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                              View <ChevronRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stalled jobs widget */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--gb)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx1)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} style={{ color: '#fb923c' }} /> Stalled Jobs
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--tx4)' }}>No update in 48h+</span>
            </div>
            {stalledJobs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--tx3)', fontSize: '0.84rem' }}>
                {isLoading ? 'Loading…' : 'Nothing stalled — all jobs progressing'}
              </div>
            ) : (
              <div>
                {stalledJobs.map(j => {
                  const accent = JS_COLORS[j.status]
                  return (
                    <Link key={j.id} to={`/jobs/${j.id}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.7rem 1.25rem', borderBottom: '1px solid var(--gb)', textDecoration: 'none' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--tx1)' }}>{j.job_number}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--tx3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.delivery_destination}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.16rem 0.45rem', borderRadius: 999, background: `${accent}22`, color: accent, border: `1px solid ${accent}44`, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                          {JOB_STATUS_LABELS[j.status]}
                        </span>
                        <div style={{ fontSize: '0.68rem', color: '#fb923c', marginTop: 3 }}>{timeAgo(j.updated_at ?? j.created_at)}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  )
}
