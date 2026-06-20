import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { DEMO_DOS, DEMO_JOBS, DEMO_EXPENSES, DEMO_DELIVERIES } from '@/lib/demoData'
import { formatINR, formatDateTime } from '@/lib/utils'
import {
  FileText, Briefcase, Receipt, TrendingUp, AlertCircle,
  CheckCircle2, ArrowRight, Clock, Truck, Activity
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  Legend
} from 'recharts'

/* ─── colour tokens (mirror CSS vars for JS use) ─────────────── */
const C = {
  brand:   '#2dd4bf', brandD: '#0d9488',
  blue:    '#3b82f6', purple: '#8b5cf6',
  amber:   '#f59e0b', green:  '#10b981',
  error:   '#ef4444',
}

/* ─── Demo chart data ──────────────────────────────────────────── */
const weeklyDispatch = [
  { day: 'Mon', dispatched: 4, delivered: 3, pending: 2 },
  { day: 'Tue', dispatched: 7, delivered: 6, pending: 1 },
  { day: 'Wed', dispatched: 5, delivered: 5, pending: 3 },
  { day: 'Thu', dispatched: 9, delivered: 7, pending: 2 },
  { day: 'Fri', dispatched: 6, delivered: 5, pending: 4 },
  { day: 'Sat', dispatched: 3, delivered: 3, pending: 1 },
  { day: 'Sun', dispatched: 2, delivered: 2, pending: 0 },
]

const monthlyExpense = [
  { month: 'Jan', amount: 18400 }, { month: 'Feb', amount: 22100 },
  { month: 'Mar', amount: 19800 }, { month: 'Apr', amount: 31200 },
  { month: 'May', amount: 26500 }, { month: 'Jun', amount: 14700 },
]

const expenseCategoryData = [
  { name: 'Packing', value: 3360,  color: C.brand  },
  { name: 'Worker',  value: 500,   color: C.blue   },
  { name: 'SC Extra',value: 1800,  color: C.purple },
  { name: 'Misc',    value: 400,   color: C.amber  },
]

/* ─── Calendar ─────────────────────────────────────────────────── */
const JUNE_JOBS: Record<number, { count: number; label: string }> = {
  16: { count: 1, label: 'JOB-002 assigned' },
  17: { count: 2, label: 'JOB-001 + JOB-002 at SC' },
  18: { count: 3, label: 'JOB-001 in transit · delivery' },
  19: { count: 1, label: 'JOB-002 planned delivery' },
  20: { count: 0, label: '' },
}

const CalendarWidget = () => {
  const today = new Date()
  const day   = today.getDate()
  const days  = Array.from({ length: 30 }, (_, i) => i + 1)  // June 2026
  const startDow = 1  // June 1 2026 = Monday
  const blanks = Array.from({ length: startDow }, (_, i) => i)

  return (
    <div>
      <div className="section-label mb-3">June 2026 — Job Calendar</div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold" style={{ color: 'var(--tx3)' }}>{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {blanks.map(i => <div key={`b${i}`} />)}
        {days.map(d => {
          const info = JUNE_JOBS[d]
          const isToday = d === day
          const hasJob  = info && info.count > 0
          return (
            <div
              key={d}
              title={info?.label || ''}
              className="relative flex flex-col items-center justify-center rounded-lg transition-all"
              style={{
                height: 34,
                background: isToday
                  ? 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)'
                  : hasJob
                  ? 'var(--g2)'
                  : 'transparent',
                border: isToday ? 'none' : hasJob ? '1px solid var(--gb)' : '1px solid transparent',
                cursor: hasJob ? 'pointer' : 'default',
                boxShadow: isToday ? '0 0 14px rgba(45,212,191,0.40)' : 'none',
              }}
            >
              <span
                className="text-xs font-semibold"
                style={{ color: isToday ? '#0d2137' : hasJob ? 'var(--tx1)' : 'var(--tx3)' }}
              >{d}</span>
              {hasJob && !isToday && (
                <span
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{
                    background: info.count >= 3 ? C.amber : info.count === 2 ? C.blue : C.brand,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        {[
          { color: C.brand, label: '1 job' },
          { color: C.blue,  label: '2 jobs' },
          { color: C.amber, label: '3+ jobs' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            <span className="text-[10px]" style={{ color: 'var(--tx3)' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Custom tooltip ───────────────────────────────────────────── */
const GlassTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-sm px-3 py-2">
      <div className="text-xs font-bold mb-1" style={{ color: 'var(--tx1)' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'var(--tx2)' }}>{p.name}:</span>
          <span className="font-semibold" style={{ color: 'var(--tx1)' }}>
            {typeof p.value === 'number' && p.name?.toLowerCase().includes('amount')
              ? `₹${p.value.toLocaleString('en-IN')}`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── KPI card ─────────────────────────────────────────────────── */
const KPI = ({ label, value, sub, icon: Icon, gradFrom, gradTo, glow }: {
  label: string; value: string|number; sub?: string;
  icon: React.ElementType; gradFrom: string; gradTo: string; glow: string;
}) => (
  <div className="glass glass-lift relative overflow-hidden p-5 slide-up">
    <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full pointer-events-none"
      style={{ background: `radial-gradient(circle, ${glow}44 0%, transparent 70%)` }} />
    <div className="relative flex items-start gap-4">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)`, boxShadow: `0 4px 18px ${glow}55` }}>
        <Icon size={22} color="white" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold tabular leading-tight" style={{ color: 'var(--tx1)' }}>{value}</div>
        <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--tx2)' }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: 'var(--tx3)' }}>{sub}</div>}
      </div>
    </div>
  </div>
)

/* ─── Section header ────────────────────────────────────────────── */
const SH = ({ title, link, linkLabel = 'View all' }: { title: string; link?: string; linkLabel?: string }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="section-label">{title}</h2>
    {link && (
      <Link to={link} className="flex items-center gap-1 text-xs font-semibold transition-colors"
        style={{ color: 'var(--brand)' }}>
        {linkLabel} <ArrowRight size={12} />
      </Link>
    )}
  </div>
)

/* ─── Kanban pipeline ───────────────────────────────────────────── */
const PIPELINE_STAGES = [
  { key: 'assigned',              label: 'Assigned',      color: C.blue   },
  { key: 'at_service_centre',     label: 'At SC',         color: C.purple },
  { key: 'in_transit_to_customer',label: 'In Transit',    color: C.amber  },
  { key: 'delivered',             label: 'Delivered',     color: C.green  },
]

const KanbanPipeline = ({ jobs }: { jobs: typeof DEMO_JOBS }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
    {PIPELINE_STAGES.map(stage => {
      const stageJobs = jobs.filter(j => j.status === stage.key)
      return (
        <div key={stage.key} className="glass-sm p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: stage.color }} />
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--tx2)' }}>
              {stage.label}
            </span>
            <span className="ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: `${stage.color}22`, color: stage.color }}>
              {stageJobs.length}
            </span>
          </div>
          <div className="space-y-2">
            {stageJobs.length === 0 ? (
              <div className="text-[11px] text-center py-4" style={{ color: 'var(--tx3)' }}>Empty</div>
            ) : stageJobs.map(job => (
              <Link key={job.id} to={`/jobs/${job.id}`}>
                <div className="rounded-xl p-2.5 transition-all cursor-pointer"
                  style={{ background: 'var(--g1)', border: '1px solid var(--gb)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--g2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--g1)')}>
                  <div className="text-xs font-bold" style={{ color: 'var(--tx1)' }}>{job.job_number}</div>
                  <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--tx2)' }}>{job.customer?.name}</div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock size={10} style={{ color: 'var(--tx3)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--tx3)' }}>{job.planned_delivery_date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )
    })}
  </div>
)

/* ─── Page ─────────────────────────────────────────────────────── */
export const DashboardPage = () => {
  const { user } = useAuthStore()
  const isAgent = user?.role === 'agent'

  const activeDOs       = DEMO_DOS.filter(d => ['active','partially_dispatched'].includes(d.status))
  const activeJobs      = DEMO_JOBS.filter(j => !['delivered','cancelled'].includes(j.status))
  const pendingExpenses = DEMO_EXPENSES.filter(e => e.status === 'pending')
  const pendingExpAmt   = pendingExpenses.reduce((a, e) => a + e.amount_inr, 0)
  const totalExpAmt     = DEMO_EXPENSES.reduce((a, e) => a + e.amount_inr, 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="page-shell space-y-6 fade-in">

      {/* ── Greeting ───────────────────────────────────────────── */}
      <div className="pt-1">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--tx1)' }}>
          {greeting}, {user?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--tx2)' }}>
          Steel operations snapshot — {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
        </p>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────── */}
      {!isAgent && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
          <KPI label="Active Orders"       value={activeDOs.length}          sub={`${DEMO_DOS.length} total DOs`}      icon={FileText}    gradFrom={C.blue}   gradTo="#1d4ed8" glow={C.blue}   />
          <KPI label="Jobs In Progress"    value={activeJobs.length}         sub={`${DEMO_JOBS.length} total`}         icon={Briefcase}   gradFrom={C.purple} gradTo="#6d28d9" glow={C.purple} />
          <KPI label="Pending Claims"      value={pendingExpenses.length}    sub={formatINR(pendingExpAmt)}           icon={Receipt}     gradFrom={C.amber}  gradTo="#b45309" glow={C.amber}  />
          <KPI label="Total Field Spend"   value={formatINR(totalExpAmt)}    sub="All time"                           icon={TrendingUp}  gradFrom={C.brand}  gradTo={C.brandD} glow={C.brand}  />
        </div>
      )}

      {/* ── Charts row ─────────────────────────────────────────── */}
      {!isAgent && (
        <div className="grid lg:grid-cols-3 gap-4">

          {/* Area chart — weekly dispatch */}
          <div className="lg:col-span-2 glass p-5 slide-up">
            <SH title="Weekly Dispatch vs Delivery" />
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyDispatch} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gDispatched" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.brand}  stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={C.brand}  stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gDelivered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.blue}  stopOpacity={0.30}/>
                    <stop offset="95%" stopColor={C.blue}  stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill:'var(--ax)', fontSize:11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill:'var(--ax)', fontSize:11 }} />
                <Tooltip content={<GlassTooltip />} />
                <Legend wrapperStyle={{ fontSize:11, color:'var(--tx2)', paddingTop:8 }} />
                <Area type="monotone" dataKey="dispatched" name="Dispatched" stroke={C.brand} fill="url(#gDispatched)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="delivered"  name="Delivered"  stroke={C.blue}  fill="url(#gDelivered)"  strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Donut — expense breakdown */}
          <div className="glass p-5 slide-up" style={{ animationDelay: '0.1s' }}>
            <SH title="Expense Breakdown" />
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={expenseCategoryData} dataKey="value" innerRadius={45} outerRadius={68}
                  paddingAngle={3} startAngle={90} endAngle={450}>
                  {expenseCategoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<GlassTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {expenseCategoryData.map(e => (
                <div key={e.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                  <span className="text-xs flex-1" style={{ color: 'var(--tx2)' }}>{e.name}</span>
                  <span className="text-xs font-semibold tabular" style={{ color: 'var(--tx1)' }}>{formatINR(e.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar chart — monthly expenses */}
          <div className="glass p-5 slide-up" style={{ animationDelay: '0.15s' }}>
            <SH title="Monthly Field Expenses" />
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthlyExpense} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill:'var(--ax)', fontSize:11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill:'var(--ax)', fontSize:11 }}
                  tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="amount" name="Amount" fill={C.brand} radius={[5,5,0,0]}>
                  {monthlyExpense.map((_, i) => (
                    <Cell key={i} fill={i === monthlyExpense.length - 1 ? C.amber : C.brand}
                      fillOpacity={i === monthlyExpense.length - 1 ? 1 : 0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-2 glass p-5 slide-up" style={{ animationDelay: '0.20s' }}>
            <CalendarWidget />
          </div>
        </div>
      )}

      {/* ── Kanban pipeline ────────────────────────────────────── */}
      <div className="glass p-5 slide-up" style={{ animationDelay: '0.25s' }}>
        <SH title="Job Pipeline" link="/jobs" />
        <KanbanPipeline jobs={DEMO_JOBS} />
      </div>

      {/* ── Bottom row ─────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Pending expense alert */}
        {!isAgent && pendingExpenses.length > 0 && (
          <div className="glass p-5 slide-up" style={{ animationDelay: '0.30s' }}>
            <SH title="Pending Approvals" link="/expenses" linkLabel="Review" />
            <div className="rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.28)' }}>
              <div className="flex items-start gap-3">
                <AlertCircle size={20} color={C.amber} className="flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--tx1)' }}>
                    {pendingExpenses.length} expense{pendingExpenses.length > 1 ? 's' : ''} need approval
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--tx2)' }}>Total: {formatINR(pendingExpAmt)}</div>
                  {pendingExpenses.slice(0, 3).map(e => (
                    <div key={e.id} className="text-xs mt-1.5 truncate" style={{ color: 'rgba(252,211,77,0.85)' }}>• {e.payee_description}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active DOs summary */}
        <div className="glass p-5 slide-up" style={{ animationDelay: '0.32s' }}>
          <SH title="Delivery Orders" link="/dos" />
          <div className="space-y-2">
            {DEMO_DOS.map(d => (
              <Link key={d.id} to="/dos">
                <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all"
                  style={{ background: 'var(--g1)', border: '1px solid var(--gb)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--g2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--g1)')}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--brand-subtle)' }}>
                    <FileText size={14} style={{ color: 'var(--brand)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold" style={{ color: 'var(--tx1)' }}>{d.do_number}</div>
                    <div className="text-[11px] truncate" style={{ color: 'var(--tx2)' }}>{d.supplier?.name}</div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: d.status === 'active' ? 'rgba(59,130,246,0.20)' : 'rgba(245,158,11,0.20)',
                      color: d.status === 'active' ? C.blue : C.amber,
                    }}>
                    {d.status.replace(/_/g,' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="glass p-5 slide-up" style={{ animationDelay: '0.34s' }}>
          <SH title="Recent Activity" />
          <div className="space-y-2">
            {[
              ...DEMO_JOBS.map(j     => ({ time: j.created_at,   icon: Briefcase, color: C.brand,  label: `${j.job_number} created`, sub: j.customer?.name ?? '' })),
              ...DEMO_EXPENSES.map(e => ({ time: e.created_at,   icon: Receipt,   color: C.amber,  label: formatINR(e.amount_inr),   sub: e.payee_description })),
              ...DEMO_DELIVERIES.map(d=>({ time: d.delivered_at, icon: Truck,     color: C.green,  label: `Delivered`,                sub: d.customer_name })),
            ]
            .sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 6)
            .map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${a.color}22` }}>
                  <a.icon size={13} style={{ color: a.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: 'var(--tx1)' }}>{a.label}</div>
                  <div className="text-[11px] truncate" style={{ color: 'var(--tx2)' }}>{a.sub}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--tx3)' }}>{formatDateTime(a.time)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
