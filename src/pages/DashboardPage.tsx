import { Link, useNavigate } from 'react-router-dom'
import { useRole, ROLE_META } from '@/hooks/useRole'
import { DEMO_JOBS, DEMO_DOS, DEMO_EXPENSES, DEMO_DELIVERIES } from '@/lib/demoData'
import { formatDate } from '@/lib/utils'
import { JOB_STATUS_LABELS } from '@/types'
import type { JobStatus } from '@/types'
import {
  Briefcase, FileText, Receipt, Truck,
  AlertTriangle, Clock, TrendingUp, CheckCircle2,
  ChevronRight, Activity,
} from 'lucide-react'

const JS_COLORS: Record<JobStatus, string> = {
  assigned:'#94a3b8', acknowledged:'#60a5fa', at_service_centre:'#a78bfa',
  processing:'#fbbf24', processing_done:'#34d399',
  in_transit_to_customer:'#2dd4bf', delivered:'#22c55e', cancelled:'#f87171',
}

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
    {children}
  </div>
)

export const DashboardPage = () => {
  const { user, isAgent, isAdmin, canManage } = useRole()
  const navigate = useNavigate()
  const roleMeta = ROLE_META[user?.role ?? 'agent']

  // --- Data slices ---
  const myJobs      = isAgent ? DEMO_JOBS.filter(j => j.assigned_agent_id === user?.id) : DEMO_JOBS
  const activeJobs  = myJobs.filter(j => !['delivered','cancelled'].includes(j.status))
  const activeDOs   = DEMO_DOS.filter(d => d.status === 'active')
  const pendingExp  = DEMO_EXPENSES.filter(e => e.status === 'pending')
  const deviations  = DEMO_DELIVERIES.filter(d => d.destination_changed && !d.authorised_by_office)

  const recentJobs  = myJobs.slice(0, 5)

  // --- KPI cards ---
  const kpis = isAgent
    ? [
        { label: 'My Active Jobs',  value: activeJobs.length,  icon: Briefcase,  color: '#60a5fa', route: '/jobs',       caption: 'In progress' },
        { label: 'Pending Expenses',value: pendingExp.filter(e => { const j = DEMO_JOBS.find(x => x.id === e.job_id); return j?.assigned_agent_id === user?.id }).length,
          icon: Receipt, color: '#fbbf24', route: '/expenses', caption: 'Awaiting approval' },
        { label: 'Deliveries',      value: DEMO_DELIVERIES.filter(d => { const j = DEMO_JOBS.find(x => x.id === d.job_id); return j?.assigned_agent_id === user?.id }).length,
          icon: Truck, color: '#34d399', route: '/deliveries', caption: 'Total records' },
      ]
    : [
        { label: 'Active Jobs',       value: activeJobs.length,   icon: Briefcase,    color: '#60a5fa', route: '/jobs',       caption: 'Across all agents'     },
        { label: 'Active DOs',        value: activeDOs.length,    icon: FileText,     color: '#a78bfa', route: '/dos',        caption: 'In circulation'        },
        { label: 'Pending Expenses',  value: pendingExp.length,   icon: Receipt,      color: '#fbbf24', route: '/expenses',   caption: 'Awaiting approval'     },
        { label: 'Route Deviations',  value: deviations.length,   icon: AlertTriangle,color: '#fb923c', route: '/deliveries', caption: 'Unauthorised reroutes' },
      ]

  return (
    <PageShell>
      {/* Welcome banner */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, padding: '0.22rem 0.65rem',
              borderRadius: 999, background: roleMeta.bg,
              color: roleMeta.color, border: `1px solid ${roleMeta.accent}44`,
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              {roleMeta.label}
            </span>
          </div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {user?.full_name?.split(' ')[0] ?? 'there'} 👋
          </h1>
          <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            {isAgent
              ? `Here's your field dashboard for today, ${formatDate(new Date().toISOString())}`
              : `Operations overview · ${formatDate(new Date().toISOString())}`}
          </p>
        </div>
        {/* Quick action */}
        {isAgent && (
          <button onClick={() => navigate('/jobs')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.1rem', borderRadius: '0.6rem', border: 'none',
              background: 'linear-gradient(135deg,#2dd4bf,#0d9488)',
              color: '#07211e', fontWeight: 700, fontSize: '0.84rem',
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(45,212,191,0.28)',
            }}>
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

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, gap: '0.85rem', marginBottom: '1.75rem' }}>
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <button key={k.label} onClick={() => navigate(k.route)}
              style={{
                textAlign: 'left', background: 'var(--card-bg)',
                border: `1px solid var(--card-border)`,
                borderTop: `3px solid ${k.color}`,
                borderRadius: '0.85rem', padding: '1rem 1.1rem',
                cursor: 'pointer', transition: 'all 0.15s ease',
                boxShadow: 'var(--sh-card)',
              }}
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

      {/* Alerts for non-agents */}
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
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx1)' }}>
            {isAgent ? 'Your Recent Jobs' : 'Recent Jobs'}
          </div>
          <Link to="/jobs" style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
            View all <ChevronRight size={13} />
          </Link>
        </div>
        {recentJobs.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--tx3)', fontSize: '0.84rem' }}>No jobs yet</div>
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
    </PageShell>
  )
}
