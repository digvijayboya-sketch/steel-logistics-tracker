import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { DEMO_DELIVERIES, DEMO_JOBS } from '@/lib/demoData'
import { Card } from '@/components/ui/Card'
import { formatDateTime } from '@/lib/utils'
import { Truck, Search, MapPin, AlertTriangle, CheckCircle2, Clock, RotateCcw } from 'lucide-react'
import type { DeliveryStatus } from '@/types'

type Filter = DeliveryStatus | 'all'

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; icon: React.ElementType; cls: string }> = {
  planned:    { label: 'Planned',    icon: Clock,         cls: 'bg-gray-100 text-gray-600' },
  partial:    { label: 'Partial',    icon: RotateCcw,     cls: 'bg-amber-50 text-amber-700' },
  delivered:  { label: 'Delivered', icon: CheckCircle2,  cls: 'bg-green-50 text-green-700' },
  redirected: { label: 'Redirected', icon: AlertTriangle, cls: 'bg-orange-50 text-orange-700' },
}

export const DeliveriesPage = () => {
  const { user } = useAuthStore()
  const isAgent = user?.role === 'agent'
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const enriched = DEMO_DELIVERIES.map(d => ({
    ...d,
    job: DEMO_JOBS.find(j => j.id === d.job_id)
  }))

  const base = isAgent
    ? enriched.filter(d => d.job?.assigned_agent_id === user?.id)
    : enriched

  const filtered = base.filter(d => {
    const matchSearch = !search ||
      d.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      d.delivery_address.toLowerCase().includes(search.toLowerCase()) ||
      d.vehicle_number.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || d.delivery_status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    all: base.length,
    delivered: base.filter(d => d.delivery_status === 'delivered').length,
    partial: base.filter(d => d.delivery_status === 'partial').length,
    redirected: base.filter(d => d.delivery_status === 'redirected').length,
    planned: base.filter(d => d.delivery_status === 'planned').length,
  }

  const deviations = base.filter(d => d.destination_changed).length

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[--color-ink]">Deliveries</h1>
        <p className="text-sm text-[--color-ink-muted] mt-0.5">Delivery records, confirmations, and destination changes</p>
      </div>

      {/* Deviation alert */}
      {deviations > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-200">
          <AlertTriangle size={16} className="text-orange-600 flex-shrink-0" />
          <div className="text-sm text-orange-800">
            <span className="font-semibold">{deviations} delivery{deviations > 1 ? 'ies' : ''}</span> had destination changes — review for authorisation
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {(['all','delivered','partial','planned','redirected'] as Filter[]).map(f => {
          const cfg = f !== 'all' ? STATUS_CONFIG[f as DeliveryStatus] : null
          const Icon = cfg?.icon ?? Truck
          const count = counts[f]
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all border-2
                ${filter === f
                  ? 'border-[--color-primary] bg-[--color-primary]/5 text-[--color-primary]'
                  : 'border-transparent bg-[--color-surface-bg] text-[--color-ink-muted] hover:bg-[--color-surface-divider]'}`}
            >
              <Icon size={11} /> {f} <span className="font-bold">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-ink-faint]" />
        <input
          className="w-full pl-8 pr-3 py-2 text-sm border border-[--color-border] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary]"
          placeholder="Search customer, address, vehicle…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Deliveries */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Truck size={32} className="mx-auto mb-3 text-[--color-ink-faint]" />
          <div className="text-sm font-medium text-[--color-ink-muted]">No deliveries found</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(d => {
            const cfg = STATUS_CONFIG[d.delivery_status]
            const Icon = cfg.icon
            return (
              <Card key={d.id}>
                <div className="flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.cls}`}>
                    <Icon size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[--color-ink]">{d.customer_name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                        {d.destination_changed && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-medium flex items-center gap-1">
                            <AlertTriangle size={9} /> Rerouted
                          </span>
                        )}
                      </div>
                      {d.job && (
                        <Link to={`/jobs/${d.job_id}`} className="text-xs text-[--color-primary] hover:underline flex-shrink-0">
                          {d.job.job_number}
                        </Link>
                      )}
                    </div>

                    {/* Address + vehicle */}
                    <div className="flex items-start gap-1.5 mt-1.5">
                      <MapPin size={11} className="text-[--color-ink-faint] mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-[--color-ink-muted]">{d.delivery_address}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 mt-2">
                      {[['Vehicle', d.vehicle_number],
                        ['Delivered', formatDateTime(d.delivered_at)],
                        ['Logged by', d.job?.assigned_agent?.full_name ?? d.created_by],
                      ].map(([l, v]) => (
                        <div key={l}>
                          <div className="text-[10px] text-[--color-ink-faint]">{l}</div>
                          <div className="text-xs font-medium text-[--color-ink-muted]">{v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Destination change detail */}
                    {d.destination_changed && (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                        <div className="text-[10px] font-semibold text-orange-700 mb-1">DESTINATION CHANGE DETAIL</div>
                        <div className="space-y-0.5">
                          <div className="text-xs text-orange-700"><span className="font-medium">Original:</span> {d.old_destination}</div>
                          <div className="text-xs text-orange-700"><span className="font-medium">New:</span> {d.new_destination}</div>
                          <div className="text-xs text-orange-600 italic">Reason: {d.change_reason}</div>
                          <div className="text-[10px] mt-1">
                            {d.authorised_by_office
                              ? <span className="text-green-700 font-medium">✓ Office authorised</span>
                              : <span className="text-red-600 font-medium">⚠ Self-authorised – review required</span>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
