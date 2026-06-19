import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { DEMO_DOS, DEMO_JOBS, DEMO_EXPENSES, DEMO_DELIVERIES } from '@/lib/demoData'
import { Card } from '@/components/ui/Card'
import { DOStatusBadge, JobStatusBadge, ExpenseStatusBadge } from '@/components/ui/StatusBadge'
import { formatINR, formatDate, formatDateTime } from '@/lib/utils'
import { FileText, Briefcase, Receipt, Truck, Clock, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react'

const KPI = ({ label, value, sub, icon: Icon, color }: { label:string; value:string|number; sub?:string; icon:React.ElementType; color:string }) => (
  <Card className="flex items-start gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={18} />
    </div>
    <div>
      <div className="text-2xl font-bold text-[--color-ink] tabular">{value}</div>
      <div className="text-xs font-medium text-[--color-ink-muted] mt-0.5">{label}</div>
      {sub && <div className="text-xs text-[--color-ink-faint] mt-0.5">{sub}</div>}
    </div>
  </Card>
)

export const DashboardPage = () => {
  const { user } = useAuthStore()
  const isAgent = user?.role === 'agent'

  const activeDOs = DEMO_DOS.filter(d => ['active','partially_dispatched'].includes(d.status))
  const activeJobs = DEMO_JOBS.filter(j => !['delivered','cancelled'].includes(j.status))
  const pendingExpenses = DEMO_EXPENSES.filter(e => e.status === 'pending')
  const pendingExpAmt = pendingExpenses.reduce((a,e) => a+e.amount_inr, 0)
  const totalExpAmt = DEMO_EXPENSES.reduce((a,e) => a+e.amount_inr, 0)

  const myJobs = isAgent ? DEMO_JOBS.filter(j => j.assigned_agent_id === user?.id) : activeJobs

  const recentActivity = [
    ...DEMO_JOBS.map(j=>({ type:'job' as const, time:j.created_at, label:`Job ${j.job_number} — ${j.customer?.name}`, status:j.status, link:`/jobs/${j.id}` })),
    ...DEMO_EXPENSES.map(e=>({ type:'expense' as const, time:e.created_at, label:`Expense ${formatINR(e.amount_inr)} — ${e.payee_description}`, status:e.status, link:'/expenses' })),
    ...DEMO_DELIVERIES.map(d=>({ type:'delivery' as const, time:d.delivered_at, label:`Delivery to ${d.customer_name}`, status:d.delivery_status, link:'/deliveries' })),
  ].sort((a,b)=>new Date(b.time).getTime()-new Date(a.time).getTime()).slice(0,8)

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[--color-ink]">Good evening, {user?.name.split(' ')[0]} 👋</h1>
        <p className="text-sm text-[--color-ink-muted] mt-0.5">Here's what's happening across your operations today.</p>
      </div>

      {/* KPIs */}
      {!isAgent && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Active Delivery Orders" value={activeDOs.length} sub={`${DEMO_DOS.length} total`} icon={FileText} color="bg-blue-50 text-blue-600" />
          <KPI label="Jobs In Progress" value={activeJobs.length} sub={`${DEMO_JOBS.length} total`} icon={Briefcase} color="bg-violet-50 text-violet-600" />
          <KPI label="Pending Expense Claims" value={pendingExpenses.length} sub={formatINR(pendingExpAmt)} icon={Receipt} color="bg-amber-50 text-amber-600" />
          <KPI label="Total Field Spend" value={formatINR(totalExpAmt)} sub="All time" icon={TrendingUp} color="bg-teal-50 text-teal-600" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Jobs */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[--color-ink]">{isAgent ? 'My Jobs' : 'Active Jobs'}</h2>
            <Link to="/jobs" className="text-xs text-[--color-primary] hover:underline">View all →</Link>
          </div>
          {myJobs.length === 0 ? (
            <Card className="text-center py-8 text-[--color-ink-muted] text-sm">
              <CheckCircle2 size={28} className="mx-auto mb-2 text-[--color-success]" />
              No active jobs — all clear!
            </Card>
          ) : (
            myJobs.map(job=>(
              <Link to={`/jobs/${job.id}`} key={job.id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[--color-ink]">{job.job_number}</span>
                        <JobStatusBadge status={job.status} />
                      </div>
                      <div className="text-xs text-[--color-ink-muted] mt-1">{job.customer?.name} · {job.delivery_destination}</div>
                      <div className="text-xs text-[--color-ink-faint] mt-0.5 flex items-center gap-1">
                        <Clock size={11}/>
                        Planned: {formatDate(job.planned_delivery_date)}
                      </div>
                    </div>
                    <div className="text-xs text-[--color-ink-faint] whitespace-nowrap">{job.assigned_agent?.full_name}</div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pending Expenses Alert */}
          {!isAgent && pendingExpenses.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-[--color-ink]">Pending Approvals</h2>
                <Link to="/expenses" className="text-xs text-[--color-primary] hover:underline">Review →</Link>
              </div>
              <Card className="bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-amber-800">{pendingExpenses.length} expense{pendingExpenses.length>1?'s':''} awaiting approval</div>
                    <div className="text-xs text-amber-700 mt-0.5">Total: {formatINR(pendingExpAmt)}</div>
                    {pendingExpenses.slice(0,2).map(e=>(
                      <div key={e.id} className="text-xs text-amber-600 mt-1 truncate">• {e.payee_description}</div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <h2 className="font-semibold text-[--color-ink] mb-2">Recent Activity</h2>
            <Card padding={false}>
              <ul className="divide-y divide-[--color-surface-divider]">
                {recentActivity.map((a,i)=>(
                  <li key={i}>
                    <Link to={a.link} className="flex items-start gap-3 px-4 py-3 hover:bg-[--color-surface-bg] transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-[--color-primary] mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-[--color-ink] truncate">{a.label}</div>
                        <div className="text-[11px] text-[--color-ink-faint] mt-0.5">{formatDateTime(a.time)}</div>
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
