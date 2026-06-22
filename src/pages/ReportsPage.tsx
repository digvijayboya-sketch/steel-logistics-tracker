/**
 * ReportsPage.tsx — fully live Supabase data, no demo data.
 * Accessible to: admin, planner, purchase. Blocked for agents.
 * Cancelled DO KPI card added to the main KPI row.
 */
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { useDataStore } from '@/store/dataStore'
import type { JobStatus, ExpenseStatus } from '@/store/dataStore'
import { BarChart3, Receipt, Truck, Briefcase, AlertTriangle, Factory, Loader2, XCircle } from 'lucide-react'

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  assigned:               'Assigned',
  acknowledged:           'Acknowledged',
  at_service_centre:      'At Service Centre',
  processing:             'Processing',
  processing_done:        'Processing Done',
  in_transit_to_customer: 'In Transit',
  delivered:              'Delivered',
  cancelled:              'Cancelled',
}

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

const EXP_COLORS: Record<string, string> = {
  packing_materials: '#60a5fa',
  worker_incentive:  '#a78bfa',
  sc_extra_charge:   '#fbbf24',
  miscellaneous:     '#94a3b8',
}

const EXP_LABELS: Record<string, string> = {
  packing_materials: 'Packing Materials',
  worker_incentive:  'Worker Incentive',
  sc_extra_charge:   'SC Extra Charge',
  miscellaneous:     'Miscellaneous',
}

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
    {children}
  </div>
)

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', padding: '1.25rem', boxShadow: 'var(--sh-card)', ...style }}>
    {children}
  </div>
)

const SectionTitle = ({ icon: Icon, color, label }: { icon: React.ElementType; color: string; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
    <Icon size={15} style={{ color }} />
    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx1)' }}>{label}</span>
  </div>
)

const BarRow = ({ label, value, max, color, suffix = '' }: { label: string; value: number; max: number; color: string; suffix?: string }) => (
  <div style={{ marginBottom: '0.65rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--tx2)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{value}{suffix}</span>
    </div>
    <div style={{ height: 7, borderRadius: 999, background: 'var(--g3)', overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 999, background: color, width: `${max > 0 ? (value / max) * 100 : 0}%`, transition: 'width 0.5s ease' }} />
    </div>
  </div>
)

const StatRow = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.38rem 0', borderBottom: '1px solid var(--gb)' }}>
    <span style={{ fontSize: '0.80rem', color: 'var(--tx3)' }}>{label}</span>
    <span style={{ fontSize: '0.84rem', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
  </div>
)

export const ReportsPage = () => {
  const { isAgent } = useRole()
  const navigate = useNavigate()

  const {
    jobs, expenses, deliveries, queueUpdates, dos,
    fetchJobs, fetchExpenses, fetchDeliveries, fetchQueueUpdates, fetchDOs,
    loading,
  } = useDataStore()

  const isLoading = loading['jobs'] || loading['expenses'] || loading['deliveries'] || loading['queue'] || loading['dos']

  useEffect(() => {
    fetchJobs()
    fetchExpenses()
    fetchDeliveries()
    fetchQueueUpdates()
    fetchDOs()
  }, [])

  const jobStats = useMemo(() => {
    const breakdown = (Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map(s => ({
      status: s,
      label: JOB_STATUS_LABELS[s],
      count: jobs.filter(j => j.status === s).length,
      color: JS_COLORS[s],
    })).filter(s => s.count > 0)
    return {
      breakdown,
      maxCount: Math.max(...breakdown.map(s => s.count), 1),
      total: jobs.length,
      delivered: jobs.filter(j => j.status === 'delivered').length,
      active: jobs.filter(j => !['delivered', 'cancelled'].includes(j.status)).length,
      cancelled: jobs.filter(j => j.status === 'cancelled').length,
    }
  }, [jobs])

  const expenseStats = useMemo(() => {
    const byStatus = (s: ExpenseStatus) => expenses.filter(e => e.status === s).reduce((a, e) => a + Number(e.amount_inr), 0)
    const total    = expenses.reduce((a, e) => a + Number(e.amount_inr), 0)
    const approved = byStatus('approved')
    const pending  = byStatus('pending')
    const rejected = byStatus('rejected')
    const cats = ['packing_materials', 'worker_incentive', 'sc_extra_charge', 'miscellaneous']
    const byCat = cats.map(c => ({
      key: c,
      label: EXP_LABELS[c] ?? c,
      color: EXP_COLORS[c] ?? '#94a3b8',
      amount: expenses.filter(e => e.category === c).reduce((a, e) => a + Number(e.amount_inr), 0),
      count:  expenses.filter(e => e.category === c).length,
    })).filter(c => c.amount > 0)
    const maxCat = Math.max(...byCat.map(c => c.amount), 1)
    return { total, approved, pending, rejected, byCat, maxCat, count: expenses.length }
  }, [expenses])

  const deliveryStats = useMemo(() => ({
    total:         deliveries.length,
    deviations:    deliveries.filter(d => d.destination_changed).length,
    unauthorised:  deliveries.filter(d => d.destination_changed && !d.authorised_by_office).length,
    authorised:    deliveries.filter(d => d.destination_changed && d.authorised_by_office).length,
    clean:         deliveries.filter(d => !d.destination_changed).length,
  }), [deliveries])

  const queueStats = useMemo(() => {
    const completed = queueUpdates.filter(q => q.processing_completed_at)
    const durations = completed.map(q => {
      const start = new Date(q.processing_started_at ?? q.checkin_time).getTime()
      const end   = new Date(q.processing_completed_at!).getTime()
      return (end - start) / 60000
    }).filter(d => d > 0)
    const avgMins = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0
    return { total: queueUpdates.length, completed: completed.length, avgMins }
  }, [queueUpdates])

  const doStats = useMemo(() => ({
    total:      dos.length,
    active:     dos.filter(d => d.status === 'active').length,
    closed:     dos.filter(d => d.status === 'closed').length,
    draft:      dos.filter(d => d.status === 'draft').length,
    cancelled:  dos.filter(d => d.status === 'cancelled').length,
    dispatched: dos.filter(d => ['partially_dispatched','fully_dispatched'].includes(d.status)).length,
    // cancellation rate as a percentage
    cancelRate: dos.length > 0 ? Math.round((dos.filter(d => d.status === 'cancelled').length / dos.length) * 100) : 0,
  }), [dos])

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

  return (
    <PageShell>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div className="breadcrumb" style={{ marginBottom: '0.4rem' }}>
          <span>SteelTrack</span><span className="sep">›</span><span className="active">Reports</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Reports & Analytics</h1>
            <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Live operations overview from Supabase</p>
          </div>
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--tx4)', fontSize: '0.75rem' }}>
              <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Refreshing…
            </div>
          )}
        </div>
      </div>

      {/* KPI row — 7 cards including Cancelled DOs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: '0.85rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Jobs',      value: jobStats.total,                icon: Briefcase,     color: '#60a5fa', caption: `${jobStats.delivered} delivered` },
          { label: 'Active Jobs',     value: jobStats.active,               icon: BarChart3,     color: '#2dd4bf', caption: `${jobStats.cancelled} job(s) cancelled` },
          { label: 'Cancelled Jobs',  value: jobStats.cancelled,            icon: XCircle,       color: '#f87171', caption: jobStats.total > 0 ? `${Math.round((jobStats.cancelled/jobStats.total)*100)}% of total` : '—' },
          { label: 'Total Expenses',  value: formatINR(expenseStats.total), icon: Receipt,       color: '#a78bfa', caption: `${formatINR(expenseStats.approved)} approved` },
          { label: 'Delivery Issues', value: deliveryStats.deviations,      icon: AlertTriangle, color: '#fb923c', caption: `${deliveryStats.unauthorised} unauthorised` },
          { label: 'Active DOs',      value: doStats.active,                icon: Factory,       color: '#34d399', caption: `${doStats.cancelled} DO(s) cancelled · ${doStats.cancelRate}%` },
          { label: 'Queue Updates',   value: queueStats.total,              icon: Truck,         color: '#fbbf24', caption: queueStats.avgMins > 0 ? `avg ${queueStats.avgMins}m process` : 'no time data' },
        ].map(k => {
          const Icon = k.icon
          const isCancelCard = k.color === '#f87171'
          return (
            <div key={k.label} style={{ background: 'var(--card-bg)', border: isCancelCard ? '1px solid rgba(248,113,113,0.25)' : '1px solid var(--card-border)', borderTop: `3px solid ${k.color}`, borderRadius: '0.85rem', padding: '1rem 1.1rem', boxShadow: 'var(--sh-card)', background: isCancelCard ? 'rgba(248,113,113,0.04)' : 'var(--card-bg)' } as React.CSSProperties}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${k.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <Icon size={14} style={{ color: k.color }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--tx2)', marginTop: '0.3rem' }}>{k.label}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--tx4)', marginTop: 2 }}>{k.caption}</div>
            </div>
          )
        })}
      </div>

      {/* Row 2: Jobs + Expenses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <Card>
          <SectionTitle icon={BarChart3} color="#60a5fa" label="Jobs by Status" />
          {jobStats.breakdown.length === 0
            ? <div style={{ color: 'var(--tx4)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>No jobs yet</div>
            : jobStats.breakdown.map(s => (
              <BarRow key={s.status} label={s.label} value={s.count} max={jobStats.maxCount} color={s.color} />
            ))
          }
          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--gb)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--tx3)' }}>Total: <strong style={{ color: 'var(--tx1)' }}>{jobStats.total}</strong></span>
            <span style={{ fontSize: '0.72rem', color: '#22c55e' }}>Delivered: <strong>{jobStats.delivered}</strong></span>
            <span style={{ fontSize: '0.72rem', color: '#f87171' }}>Cancelled: <strong>{jobStats.cancelled}</strong></span>
            <span style={{ fontSize: '0.72rem', color: '#2dd4bf' }}>Active: <strong>{jobStats.active}</strong></span>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Receipt} color="#a78bfa" label="Expenses by Category" />
          {expenseStats.byCat.length === 0
            ? <div style={{ color: 'var(--tx4)', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>No expenses yet</div>
            : expenseStats.byCat.map(c => (
              <BarRow key={c.key} label={`${c.label} (${c.count})`} value={c.amount} max={expenseStats.maxCat} color={c.color} />
            ))
          }
          <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--gb)' }}>
            <StatRow label="Total Claimed" value={formatINR(expenseStats.total)} color="#60a5fa" />
            <StatRow label="Approved" value={formatINR(expenseStats.approved)} color="#22c55e" />
            <StatRow label="Pending" value={formatINR(expenseStats.pending)} color="#fbbf24" />
            <StatRow label="Rejected" value={formatINR(expenseStats.rejected)} color="#f87171" />
          </div>
        </Card>
      </div>

      {/* Row 3: Deliveries + Queue + DOs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <Card>
          <SectionTitle icon={Truck} color="#34d399" label="Deliveries" />
          <StatRow label="Total Deliveries"     value={deliveryStats.total}        color="var(--tx1)" />
          <StatRow label="Clean Deliveries"     value={deliveryStats.clean}        color="#22c55e" />
          <StatRow label="Destination Changes"  value={deliveryStats.deviations}   color="#fb923c" />
          <StatRow label="Office Authorised"    value={deliveryStats.authorised}   color="#34d399" />
          <StatRow label="Self-authorised ⚠️"   value={deliveryStats.unauthorised} color="#f87171" />
        </Card>

        <Card>
          <SectionTitle icon={Factory} color="#fbbf24" label="Service Centre Queue" />
          <StatRow label="Total Check-ins"      value={queueStats.total}     color="var(--tx1)" />
          <StatRow label="Completed Processing" value={queueStats.completed} color="#22c55e" />
          <StatRow label="In Progress"          value={queueStats.total - queueStats.completed} color="#fbbf24" />
          <StatRow label="Avg Process Time"     value={queueStats.avgMins > 0 ? `${queueStats.avgMins} min` : '—'} color="#60a5fa" />
        </Card>

        {/* DO summary — with Cancelled row */}
        <Card>
          <SectionTitle icon={Briefcase} color="#2dd4bf" label="Delivery Orders" />
          <StatRow label="Total DOs"             value={doStats.total}      color="var(--tx1)" />
          <StatRow label="Draft"                 value={doStats.draft}      color="#94a3b8" />
          <StatRow label="Active"                value={doStats.active}     color="#2dd4bf" />
          <StatRow label="Dispatched / Partial"  value={doStats.dispatched} color="#60a5fa" />
          <StatRow label="Closed"                value={doStats.closed}     color="#22c55e" />
          <StatRow label="Cancelled ❌"           value={doStats.cancelled}  color="#f87171" />
          {doStats.cancelled > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#f87171', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <XCircle size={11} />
              {doStats.cancelRate}% cancellation rate
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  )
}
