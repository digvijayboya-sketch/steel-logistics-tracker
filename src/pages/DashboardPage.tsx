import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { DEMO_DOS, DEMO_JOBS, DEMO_EXPENSES, DEMO_DELIVERIES } from '@/lib/demoData'
import { Card } from '@/components/ui/Card'
import { DOStatusBadge, JobStatusBadge } from '@/components/ui/StatusBadge'
import { formatINR, formatDate, formatDateTime } from '@/lib/utils'
import {
  FileText, Briefcase, Receipt, Truck,
  Clock, AlertCircle, CheckCircle2, TrendingUp,
  ArrowRight
} from 'lucide-react'

interface KPIProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  gradFrom: string
  gradTo: string
  glow: string
}

const KPI = ({ label, value, sub, icon: Icon, gradFrom, gradTo, glow }: KPIProps) => (
  <div className="kpi-card relative overflow-hidden">
    {/* Subtle radial glow */}
    <div
      className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 pointer-events-none"
      style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }}
    />
    <div className="relative flex items-start gap-4">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)`,
          boxShadow: `0 4px 16px ${glow}55`,
        }}
      >
        <Icon size={22} color="white" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-white tabular leading-tight">{value}</div>
        <div className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.60)' }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{sub}</div>}
      </div>
    </div>
  </div>
)

const SectionHeader = ({ title, link, linkLabel = 'View all' }: { title: string; link?: string; linkLabel?: string }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.50)' }}>{title}</h2>
    {link && (
      <Link
        to={link}
        className="flex items-center gap-1 text-xs font-semibold transition-colors"
        style={{ color: '#2dd4bf' }}
      >
        {linkLabel} <ArrowRight size={12} />
      </Link>
    )}
  </div>
)

export const DashboardPage = () => {
  const { user } = useAuthStore()
  const isAgent = user?.role === 'agent'

  const activeDOs       = DEMO_DOS.filter(d => ['active','partially_dispatched'].includes(d.status))
  const activeJobs      = DEMO_JOBS.filter(j => !['delivered','cancelled'].includes(j.status))
  const pendingExpenses = DEMO_EXPENSES.filter(e => e.status === 'pending')
  const pendingExpAmt   = pendingExpenses.reduce((a, e) => a + e.amount_inr, 0)
  const totalExpAmt     = DEMO_EXPENSES.reduce((a, e) => a + e.amount_inr, 0)
  const myJobs          = isAgent ? DEMO_JOBS.filter(j => j.assigned_agent_id === user?.id) : activeJobs

  const recentActivity = [
    ...DEMO_JOBS.map(j     => ({ type: 'job'      as const, time: j.created_at,     label: `Job ${j.job_number} — ${j.customer?.name}`,            status: j.status,           link: `/jobs/${j.id}` })),
    ...DEMO_EXPENSES.map(e => ({ type: 'expense'  as const, time: e.created_at,     label: `Expense ${formatINR(e.amount_inr)} — ${e.payee_description}`, status: e.status,       link: '/expenses' })),
    ...DEMO_DELIVERIES.map(d=>({ type: 'delivery' as const, time: d.delivered_at,   label: `Delivery to ${d.customer_name}`,                          status: d.delivery_status, link: '/deliveries' })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8)

  const activityDot: Record<string, string> = {
    job: '#2dd4bf', expense: '#f59e0b', delivery: '#10b981',
  }

  return (
    <div className="page-shell space-y-6 fade-in">
      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <div className="pt-2">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Good {getGreeting()}, {user?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.50)' }}>
          Here's what's happening across your operations today.
        </p>
      </div>

      {/* ── KPI row ───────────────────────────────────────────────────────── */}
      {!isAgent && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI
            label="Active Delivery Orders" value={activeDOs.length}
            sub={`${DEMO_DOS.length} total`} icon={FileText}
            gradFrom="#3b82f6" gradTo="#1d4ed8" glow="#3b82f6"
          />
          <KPI
            label="Jobs In Progress" value={activeJobs.length}
            sub={`${DEMO_JOBS.length} total`} icon={Briefcase}
            gradFrom="#8b5cf6" gradTo="#6d28d9" glow="#8b5cf6"
          />
          <KPI
            label="Pending Claims" value={pendingExpenses.length}
            sub={formatINR(pendingExpAmt)} icon={Receipt}
            gradFrom="#f59e0b" gradTo="#b45309" glow="#f59e0b"
          />
          <KPI
            label="Total Field Spend" value={formatINR(totalExpAmt)}
            sub="All time" icon={TrendingUp}
            gradFrom="#2dd4bf" gradTo="#0d9488" glow="#2dd4bf"
          />
        </div>
      )}

      {/* ── Main content columns ──────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Active Jobs */}
        <div className="lg:col-span-2 space-y-3">
          <SectionHeader title={isAgent ? 'My Jobs' : 'Active Jobs'} link="/jobs" />

          {myJobs.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center py-8 gap-3">
                <CheckCircle2 size={32} color="#10b981" />
                <div className="text-center">
                  <div className="text-sm font-semibold text-white">All clear!</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>No active jobs right now.</div>
                </div>
              </div>
            </Card>
          ) : (
            myJobs.map(job => (
              <Link to={`/jobs/${job.id}`} key={job.id} className="block">
                <Card className="hover:scale-[1.01] transition-transform cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">{job.job_number}</span>
                        <JobStatusBadge status={job.status} />
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.60)' }}>
                        {job.customer?.name} · {job.delivery_destination}
                      </div>
                      <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.38)' }}>
                        <Clock size={11} />
                        Planned: {formatDate(job.planned_delivery_date)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {job.assigned_agent?.full_name}
                      </div>
                      <ArrowRight size={14} style={{ color: '#2dd4bf' }} />
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pending expense alert */}
          {!isAgent && pendingExpenses.length > 0 && (
            <div>
              <SectionHeader title="Pending Approvals" link="/expenses" linkLabel="Review" />
              <Card>
                <div
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.30)' }}
                >
                  <AlertCircle size={20} color="#fcd34d" className="flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-white">
                      {pendingExpenses.length} expense{pendingExpenses.length > 1 ? 's' : ''} need approval
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Total: {formatINR(pendingExpAmt)}
                    </div>
                    {pendingExpenses.slice(0, 2).map(e => (
                      <div key={e.id} className="text-xs mt-1 truncate" style={{ color: 'rgba(252,211,77,0.80)' }}>
                        • {e.payee_description}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Recent activity */}
          <div>
            <SectionHeader title="Recent Activity" />
            <Card padding={false}>
              <ul>
                {recentActivity.map((a, i) => (
                  <li key={i} style={{ borderBottom: i < recentActivity.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                    <Link
                      to={a.link}
                      className="flex items-start gap-3 px-4 py-3 transition-colors"
                      style={{ borderRadius: i === 0 ? 'var(--r-lg) var(--r-lg) 0 0' : i === recentActivity.length - 1 ? '0 0 var(--r-lg) var(--r-lg)' : '0' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{ background: activityDot[a.type] ?? '#94a3b8' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{a.label}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{formatDateTime(a.time)}</div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
