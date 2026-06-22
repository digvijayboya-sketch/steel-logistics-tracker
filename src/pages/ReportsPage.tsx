import { useNavigate } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { DEMO_JOBS, DEMO_EXPENSES, DEMO_DELIVERIES } from '@/lib/demoData'
import { formatINR } from '@/lib/utils'
import { JOB_STATUS_LABELS } from '@/types'
import type { JobStatus } from '@/types'
import { BarChart3, TrendingUp, AlertTriangle, Receipt, Truck, Briefcase } from 'lucide-react'

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

export const ReportsPage = () => {
  const { isAgent, canManage, user } = useRole()
  const navigate = useNavigate()

  // Redirect agents — no reports access
  if (isAgent) return (
    <PageShell>
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <span style={{ fontSize: '2.5rem' }}>🚫</span>
        <div style={{ color: 'var(--tx1)', fontWeight: 700, fontSize: '1rem', marginTop: '0.75rem' }}>Access restricted</div>
        <div style={{ color: 'var(--tx3)', fontSize: '0.85rem', marginTop: '0.35rem', maxWidth: 280, margin: '0.35rem auto 0' }}>
          Reports are available to Planners, Purchase, and Admins.
        </div>
        <button onClick={() => navigate('/dashboard')}
          style={{ marginTop: '1rem', padding: '0.55rem 1.25rem', borderRadius: 8, background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', border: 'none', color: '#07211e', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    </PageShell>
  )

  // Job status breakdown
  const statusBreakdown = (Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map(s => ({
    status: s, label: JOB_STATUS_LABELS[s],
    count: DEMO_JOBS.filter(j => j.status === s).length,
    color: JS_COLORS[s],
  })).filter(s => s.count > 0)
  const maxCount = Math.max(...statusBreakdown.map(s => s.count), 1)

  // Expense summary
  const totalExpenses  = DEMO_EXPENSES.reduce((a, e) => a + e.amount_inr, 0)
  const approvedExpenses = DEMO_EXPENSES.filter(e => e.status === 'approved').reduce((a, e) => a + e.amount_inr, 0)
  const pendingExpenses  = DEMO_EXPENSES.filter(e => e.status === 'pending').reduce((a, e) => a + e.amount_inr, 0)

  // Delivery summary
  const deviations = DEMO_DELIVERIES.filter(d => d.destination_changed).length
  const unauthorised = DEMO_DELIVERIES.filter(d => d.destination_changed && !d.authorised_by_office).length

  return (
    <PageShell>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="breadcrumb" style={{ marginBottom: '0.4rem' }}>
          <span>SteelTrack</span><span className="sep">›</span><span className="active">Reports</span>
        </div>
        <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Reports & Analytics</h1>
        <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Operations overview and key metrics</p>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.85rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Jobs',      value: DEMO_JOBS.length,       icon: Briefcase, color: '#60a5fa', caption: `${DEMO_JOBS.filter(j => j.status === 'delivered').length} delivered` },
          { label: 'Total Expenses',  value: formatINR(totalExpenses), icon: Receipt, color: '#a78bfa', caption: `${formatINR(approvedExpenses)} approved` },
          { label: 'Delivery Issues', value: deviations,              icon: AlertTriangle, color: '#fb923c', caption: `${unauthorised} unauthorised` },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderTop: `3px solid ${k.color}`, borderRadius: '0.85rem', padding: '1rem 1.1rem', boxShadow: 'var(--sh-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${k.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} style={{ color: k.color }} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--tx2)', marginTop: '0.3rem' }}>{k.label}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--tx4)', marginTop: 2 }}>{k.caption}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Job status breakdown bar chart */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: 'var(--sh-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.1rem' }}>
            <BarChart3 size={16} style={{ color: '#60a5fa' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx1)' }}>Jobs by Status</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {statusBreakdown.map(s => (
              <div key={s.status}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--tx2)', fontWeight: 500 }}>{s.label}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.color }}>{s.count}</span>
                </div>
                <div style={{ height: 7, borderRadius: 999, background: 'var(--g3)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 999, background: s.color, width: `${(s.count / maxCount) * 100}%`, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense & delivery summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: 'var(--sh-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <Receipt size={15} style={{ color: '#a78bfa' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx1)' }}>Expense Breakdown</span>
            </div>
            {[{ label: 'Total', value: formatINR(totalExpenses), color: '#60a5fa' },
              { label: 'Approved', value: formatINR(approvedExpenses), color: '#34d399' },
              { label: 'Pending', value: formatINR(pendingExpenses), color: '#fbbf24' },
              { label: 'Count', value: `${DEMO_EXPENSES.length} claims`, color: 'var(--tx2)' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid var(--gb)' }}>
                <span style={{ fontSize: '0.80rem', color: 'var(--tx3)' }}>{r.label}</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: r.color, fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: 'var(--sh-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <Truck size={15} style={{ color: '#34d399' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx1)' }}>Delivery Overview</span>
            </div>
            {[{ label: 'Total Deliveries',   value: DEMO_DELIVERIES.length,   color: 'var(--tx1)' },
              { label: 'Destination Changes', value: deviations,               color: '#fb923c' },
              { label: 'Self-authorised',     value: unauthorised,              color: '#f87171' },
              { label: 'Office authorised',   value: deviations - unauthorised, color: '#34d399' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid var(--gb)' }}>
                <span style={{ fontSize: '0.80rem', color: 'var(--tx3)' }}>{r.label}</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
