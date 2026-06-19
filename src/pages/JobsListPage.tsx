import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { DEMO_JOBS } from '@/lib/demoData'
import { Card } from '@/components/ui/Card'
import { JobStatusBadge } from '@/components/ui/StatusBadge'
import { formatDate } from '@/lib/utils'
import { Briefcase, Search, Filter, MapPin, Calendar, User } from 'lucide-react'
import type { JobStatus } from '@/types'

const ALL_STATUSES: JobStatus[] = ['assigned','acknowledged','at_service_centre','processing','processing_done','in_transit_to_customer','delivered','cancelled']
const STATUS_LABELS: Record<JobStatus, string> = {
  assigned:'Assigned', acknowledged:'Acknowledged', at_service_centre:'At SC', processing:'Processing',
  processing_done:'Done at SC', in_transit_to_customer:'In Transit', delivered:'Delivered', cancelled:'Cancelled'
}

export const JobsListPage = () => {
  const { user } = useAuthStore()
  const isAgent = user?.role === 'agent'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')

  const base = isAgent ? DEMO_JOBS.filter(j => j.assigned_agent_id === user?.id) : DEMO_JOBS
  const filtered = base.filter(j => {
    const matchSearch = !search ||
      j.job_number.toLowerCase().includes(search.toLowerCase()) ||
      (j.customer?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      j.delivery_destination.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || j.status === statusFilter
    return matchSearch && matchStatus
  })

  const activeCount = base.filter(j => !['delivered','cancelled'].includes(j.status)).length
  const deliveredCount = base.filter(j => j.status === 'delivered').length

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[--color-ink]">Jobs</h1>
          <p className="text-sm text-[--color-ink-muted] mt-0.5">
            {isAgent ? 'Your assigned jobs' : 'All field jobs across agents'}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 font-medium">{activeCount} active</span>
          <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-medium">{deliveredCount} delivered</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-ink-faint]" />
          <input
            className="w-full pl-8 pr-3 py-2 text-sm border border-[--color-border] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary]"
            placeholder="Search job #, customer, destination…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-ink-faint]" />
          <select
            className="pl-8 pr-8 py-2 text-sm border border-[--color-border] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 appearance-none cursor-pointer"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as JobStatus | 'all')}
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      {/* Job cards */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Briefcase size={32} className="mx-auto mb-3 text-[--color-ink-faint]" />
          <div className="text-sm font-medium text-[--color-ink-muted]">No jobs found</div>
          <div className="text-xs text-[--color-ink-faint] mt-1">Try adjusting your search or filter</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <Link to={`/jobs/${job.id}`} key={job.id}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  {/* Left icon */}
                  <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={16} className="text-violet-600" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-[--color-ink]">{job.job_number}</span>
                      <JobStatusBadge status={job.status} />
                    </div>
                    <div className="text-xs text-[--color-ink] font-medium mt-1">{job.customer?.name}</div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-[--color-ink-muted]">
                        <MapPin size={11} /> {job.delivery_destination}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[--color-ink-muted]">
                        <Calendar size={11} /> {formatDate(job.planned_delivery_date)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[--color-ink-muted]">
                        <User size={11} /> {job.assigned_agent?.full_name ?? 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  {/* DO ref */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="text-xs text-[--color-ink-faint]">DO Ref</div>
                    <div className="text-xs font-medium text-[--color-ink-muted] mt-0.5">{job.do?.do_number}</div>
                    <div className="text-xs text-[--color-ink-faint] mt-1">{job.service_type.replace('_',' ').toUpperCase()}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
