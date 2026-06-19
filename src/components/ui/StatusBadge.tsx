import { cls } from '@/lib/utils'
import type { DOStatus, JobStatus, ExpenseStatus } from '@/types'
import { DO_STATUS_LABELS, JOB_STATUS_LABELS } from '@/types'

const DO_COLORS: Record<DOStatus,string> = {
  draft:'bg-slate-100 text-slate-600',
  active:'bg-blue-50 text-blue-700',
  partially_dispatched:'bg-amber-50 text-amber-700',
  fully_dispatched:'bg-teal-50 text-teal-700',
  closed:'bg-slate-100 text-slate-500',
}
const JOB_COLORS: Record<JobStatus,string> = {
  assigned:'bg-slate-100 text-slate-600',
  acknowledged:'bg-blue-50 text-blue-700',
  at_service_centre:'bg-indigo-50 text-indigo-700',
  processing:'bg-violet-50 text-violet-700',
  processing_done:'bg-cyan-50 text-cyan-700',
  in_transit_to_customer:'bg-amber-50 text-amber-700',
  delivered:'bg-emerald-50 text-emerald-700',
  cancelled:'bg-red-50 text-red-500',
}
const EXP_COLORS: Record<ExpenseStatus,string> = {
  pending:'bg-amber-50 text-amber-700',
  approved:'bg-emerald-50 text-emerald-700',
  rejected:'bg-red-50 text-red-600',
}

export const DOStatusBadge = ({status}:{status:DOStatus}) => (
  <span className={cls('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', DO_COLORS[status])}>{DO_STATUS_LABELS[status]}</span>
)
export const JobStatusBadge = ({status}:{status:JobStatus}) => (
  <span className={cls('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', JOB_COLORS[status])}>{JOB_STATUS_LABELS[status]}</span>
)
export const ExpenseStatusBadge = ({status}:{status:ExpenseStatus}) => (
  <span className={cls('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', EXP_COLORS[status])}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>
)
