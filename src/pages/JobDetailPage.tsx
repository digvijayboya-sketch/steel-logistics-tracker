import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { DEMO_JOBS } from '@/lib/demoData'
import { Card } from '@/components/ui/Card'
import { JobStatusBadge, ExpenseStatusBadge } from '@/components/ui/StatusBadge'
import { formatINR, formatDate, formatDateTime } from '@/lib/utils'
import {
  ArrowLeft, Briefcase, MapPin, Calendar, User, Package, ClipboardList,
  Clock, CheckCircle2, Receipt, Truck, AlertTriangle, Building2
} from 'lucide-react'
import {
  SERVICE_TYPE_LABELS, EXPENSE_CATEGORY_LABELS, SETTLEMENT_LABELS, JOB_STATUS_LABELS
} from '@/types'

const STEP_STATUSES = [
  'assigned','acknowledged','at_service_centre','processing','processing_done','in_transit_to_customer','delivered'
]

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon size={15} className="text-[--color-primary]" />
    <h2 className="font-semibold text-sm text-[--color-ink]">{title}</h2>
  </div>
)

export const JobDetailPage = () => {
  const { id } = useParams()
  const { user } = useAuthStore()
  const job = DEMO_JOBS.find(j => j.id === id)

  if (!job) return (
    <div className="p-8 text-center">
      <div className="text-[--color-ink-muted] text-sm">Job not found.</div>
      <Link to="/jobs" className="text-sm text-[--color-primary] mt-2 inline-block hover:underline">← Back to Jobs</Link>
    </div>
  )

  const currentStepIdx = STEP_STATUSES.indexOf(job.status)
  const totalExpenses = (job.expenses ?? []).reduce((a, e) => a + e.amount_inr, 0)
  const pendingExpenses = (job.expenses ?? []).filter(e => e.status === 'pending')

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back + Header */}
      <div>
        <Link to="/jobs" className="flex items-center gap-1.5 text-xs text-[--color-ink-muted] hover:text-[--color-primary] mb-3 transition-colors">
          <ArrowLeft size={13} /> Back to Jobs
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[--color-ink]">{job.job_number}</h1>
              <JobStatusBadge status={job.status} />
            </div>
            <div className="text-sm text-[--color-ink-muted] mt-0.5">{job.customer?.name}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[--color-ink-faint]">DO Reference</div>
            <Link to={`/dos/${job.do_id}`} className="text-sm font-medium text-[--color-primary] hover:underline">{job.do?.do_number}</Link>
          </div>
        </div>
      </div>

      {/* Progress timeline */}
      <Card>
        <SectionHeader icon={ClipboardList} title="Job Progress" />
        <div className="flex items-center gap-0 overflow-x-auto pb-1">
          {STEP_STATUSES.map((s, i) => {
            const done = i <= currentStepIdx
            const active = i === currentStepIdx
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center gap-1 min-w-[72px]">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${active ? 'bg-[--color-primary] text-white ring-4 ring-[--color-primary]/20'
                      : done ? 'bg-green-500 text-white'
                      : 'bg-[--color-surface-divider] text-[--color-ink-faint]'}`}>
                    {done && !active ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span className={`text-[10px] text-center leading-tight font-medium
                    ${active ? 'text-[--color-primary]' : done ? 'text-green-600' : 'text-[--color-ink-faint]'}`}>
                    {JOB_STATUS_LABELS[s as keyof typeof JOB_STATUS_LABELS]}
                  </span>
                </div>
                {i < STEP_STATUSES.length - 1 && (
                  <div className={`h-0.5 w-6 flex-shrink-0 mb-5 transition-colors
                    ${i < currentStepIdx ? 'bg-green-400' : 'bg-[--color-surface-divider]'}`} />
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Job details */}
        <Card>
          <SectionHeader icon={Briefcase} title="Job Details" />
          <dl className="space-y-2.5">
            {([
              ['Service Type', SERVICE_TYPE_LABELS[job.service_type]],
              ['Packing Type', job.packing_type],
              ['Planned Delivery', formatDate(job.planned_delivery_date)],
              ['Agent', job.assigned_agent?.full_name ?? 'Unassigned'],
              ['Agent Phone', job.assigned_agent?.phone ?? '—'],
            ] as [string, string][]).map(([label, val]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-xs text-[--color-ink-muted] flex-shrink-0">{label}</dt>
                <dd className="text-xs font-medium text-[--color-ink] text-right">{val}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Delivery info */}
        <Card>
          <SectionHeader icon={MapPin} title="Delivery Destination" />
          <div className="text-sm font-medium text-[--color-ink]">{job.delivery_destination}</div>
          <div className="text-xs text-[--color-ink-muted] mt-1">Customer: {job.customer?.name}</div>
          {job.deliveries && job.deliveries.length > 0 && job.deliveries[0].destination_changed && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-amber-800">Destination Changed</div>
                  <div className="text-xs text-amber-700 mt-0.5">New: {job.deliveries[0].new_destination}</div>
                  <div className="text-xs text-amber-600 mt-0.5">Reason: {job.deliveries[0].change_reason}</div>
                  <div className="text-xs text-amber-600 mt-0.5">
                    {job.deliveries[0].authorised_by_office ? '✓ Office authorised' : '⚠ Self-authorised'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Processing instructions */}
      <Card>
        <SectionHeader icon={Package} title="Processing Instructions" />
        <div className="text-sm text-[--color-ink] leading-relaxed bg-[--color-surface-bg] rounded-lg p-3 border border-[--color-border]">
          {job.processing_instructions}
        </div>
      </Card>

      {/* Service centre queue */}
      {job.queue_updates && job.queue_updates.length > 0 && (
        <Card>
          <SectionHeader icon={Building2} title="Service Centre Queue" />
          <div className="space-y-3">
            {job.queue_updates.map(q => (
              <div key={q.id} className="p-3 rounded-lg border border-[--color-border] bg-[--color-surface-bg]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-xs font-semibold text-[--color-ink]">{q.service_centre?.name}</div>
                    <div className="text-xs text-[--color-ink-muted] mt-0.5">
                      {SERVICE_TYPE_LABELS[q.service_type]} · Queue #{q.queue_number ?? 'N/A'}
                    </div>
                  </div>
                  <div className="text-right">
                    {q.processing_completed_at
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">✓ Completed</span>
                      : q.processing_started_at
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">⚙ Processing</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">⏳ In Queue</span>
                    }
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                  {[['Check-in', formatDateTime(q.checkin_time)],
                    ['Est. time', q.estimated_processing_minutes ? `${q.estimated_processing_minutes} min` : '—'],
                    ['Started', q.processing_started_at ? formatDateTime(q.processing_started_at) : '—'],
                    ['Completed', q.processing_completed_at ? formatDateTime(q.processing_completed_at) : '—'],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <div className="text-[10px] text-[--color-ink-faint]">{l}</div>
                      <div className="text-xs font-medium text-[--color-ink-muted]">{v}</div>
                    </div>
                  ))}
                </div>
                {q.notes && <div className="text-xs text-[--color-ink-faint] mt-2 italic">{q.notes}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Expenses */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader icon={Receipt} title={`Expenses (${job.expenses?.length ?? 0})`} />
          <div className="text-xs font-semibold text-[--color-ink]">{formatINR(totalExpenses)}</div>
        </div>
        {pendingExpenses.length > 0 && (
          <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <span className="font-semibold">{pendingExpenses.length} pending approval</span> · {formatINR(pendingExpenses.reduce((a,e)=>a+e.amount_inr,0))}
          </div>
        )}
        {job.expenses && job.expenses.length > 0 ? (
          <div className="space-y-2">
            {job.expenses.map(e => (
              <div key={e.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-[--color-border] bg-[--color-surface-bg]">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[--color-ink]">{EXPENSE_CATEGORY_LABELS[e.category]}</span>
                    <ExpenseStatusBadge status={e.status} />
                  </div>
                  <div className="text-xs text-[--color-ink-muted] mt-0.5 truncate">{e.payee_description}</div>
                  <div className="text-[10px] text-[--color-ink-faint] mt-0.5">{SETTLEMENT_LABELS[e.settlement_method]}</div>
                </div>
                <div className="text-sm font-semibold text-[--color-ink] tabular flex-shrink-0">{formatINR(e.amount_inr)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-[--color-ink-faint]">No expenses logged yet</div>
        )}
      </Card>

      {/* Deliveries */}
      {job.deliveries && job.deliveries.length > 0 && (
        <Card>
          <SectionHeader icon={Truck} title="Delivery Records" />
          <div className="space-y-3">
            {job.deliveries.map(d => (
              <div key={d.id} className="p-3 rounded-lg border border-[--color-border] bg-[--color-surface-bg]">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="text-xs font-semibold text-[--color-ink]">{d.customer_name}</div>
                    <div className="text-xs text-[--color-ink-muted] mt-0.5">{d.delivery_address}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${d.delivery_status === 'delivered' ? 'bg-green-50 text-green-700'
                      : d.delivery_status === 'partial' ? 'bg-amber-50 text-amber-700'
                      : 'bg-gray-100 text-gray-600'}`}>
                    {d.delivery_status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  {[['Vehicle', d.vehicle_number], ['Delivered at', formatDateTime(d.delivered_at)]].map(([l,v]) => (
                    <div key={l}>
                      <div className="text-[10px] text-[--color-ink-faint]">{l}</div>
                      <div className="text-xs font-medium text-[--color-ink-muted]">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
