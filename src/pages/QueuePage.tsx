import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DEMO_QUEUE, DEMO_JOBS } from '@/lib/demoData'
import { Card } from '@/components/ui/Card'
import { formatDateTime } from '@/lib/utils'
import { Building2, Clock, Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { SERVICE_TYPE_LABELS } from '@/types'

type QueueStage = 'all' | 'waiting' | 'processing' | 'done'

const getStage = (q: typeof DEMO_QUEUE[0]): QueueStage => {
  if (q.processing_completed_at) return 'done'
  if (q.processing_started_at) return 'processing'
  return 'waiting'
}

export const QueuePage = () => {
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState<QueueStage>('all')

  const enriched = DEMO_QUEUE.map(q => ({
    ...q,
    job: DEMO_JOBS.find(j => j.id === q.job_id),
    stage: getStage(q)
  }))

  const filtered = enriched.filter(q => {
    const matchSearch = !search ||
      (q.service_centre?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (q.job?.job_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (q.queue_number ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStage = stage === 'all' || q.stage === stage
    return matchSearch && matchStage
  })

  const counts = {
    waiting: enriched.filter(q => q.stage === 'waiting').length,
    processing: enriched.filter(q => q.stage === 'processing').length,
    done: enriched.filter(q => q.stage === 'done').length,
  }

  const stageConfig: Record<QueueStage, { label: string; color: string; icon: React.ElementType }> = {
    all:        { label: 'All', color: 'bg-gray-100 text-gray-700', icon: Building2 },
    waiting:    { label: 'Waiting', color: 'bg-amber-50 text-amber-700', icon: Clock },
    processing: { label: 'Processing', color: 'bg-blue-50 text-blue-700', icon: Loader2 },
    done:       { label: 'Done', color: 'bg-green-50 text-green-700', icon: CheckCircle2 },
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[--color-ink]">Service Centre Queue</h1>
        <p className="text-sm text-[--color-ink-muted] mt-0.5">Live queue status across all active service centres</p>
      </div>

      {/* KPI chips */}
      <div className="flex flex-wrap gap-3">
        {(['all','waiting','processing','done'] as QueueStage[]).map(s => {
          const cfg = stageConfig[s]
          const Icon = cfg.icon
          const count = s === 'all' ? enriched.length : counts[s as keyof typeof counts]
          return (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2
                ${stage === s ? 'border-[--color-primary] ring-2 ring-[--color-primary]/20 ' + cfg.color : 'border-transparent ' + cfg.color}`}
            >
              <Icon size={12} />
              {cfg.label}
              <span className="font-bold">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-ink-faint]" />
        <input
          className="w-full pl-8 pr-3 py-2 text-sm border border-[--color-border] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary]"
          placeholder="Search by service centre, job #, queue number…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Queue list */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Building2 size={32} className="mx-auto mb-3 text-[--color-ink-faint]" />
          <div className="text-sm font-medium text-[--color-ink-muted]">No queue entries found</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => {
            const isWaiting = q.stage === 'waiting'
            const isProcessing = q.stage === 'processing'
            const isDone = q.stage === 'done'
            return (
              <Card key={q.id}>
                <div className="flex items-start gap-4">
                  {/* Stage indicator */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isDone ? 'bg-green-50' : isProcessing ? 'bg-blue-50' : 'bg-amber-50'}`}>
                    {isDone ? <CheckCircle2 size={16} className="text-green-600" />
                      : isProcessing ? <Loader2 size={16} className="text-blue-600 animate-spin" />
                      : <Clock size={16} className="text-amber-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[--color-ink]">{q.service_centre?.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                          ${isDone ? 'bg-green-50 text-green-700' : isProcessing ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                          {isDone ? 'Completed' : isProcessing ? 'Processing' : 'Waiting'}
                        </span>
                      </div>
                      <Link to={`/jobs/${q.job_id}`} className="text-xs text-[--color-primary] hover:underline flex-shrink-0">
                        {q.job?.job_number}
                      </Link>
                    </div>

                    {/* Details grid */}
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                      {[['Service', SERVICE_TYPE_LABELS[q.service_type]],
                        ['Queue #', q.queue_number ?? 'N/A'],
                        ['Check-in', formatDateTime(q.checkin_time)],
                        ['Est. time', q.estimated_processing_minutes ? `${q.estimated_processing_minutes} min` : '—'],
                        q.processing_started_at ? ['Started', formatDateTime(q.processing_started_at)] : null,
                        q.processing_completed_at ? ['Completed', formatDateTime(q.processing_completed_at)] : null,
                      ].filter(Boolean).map(([l, v]) => (
                        <div key={l as string}>
                          <div className="text-[10px] text-[--color-ink-faint]">{l}</div>
                          <div className="text-xs font-medium text-[--color-ink-muted]">{v}</div>
                        </div>
                      ))}
                    </div>

                    {q.notes && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-[--color-ink-faint] italic">
                        <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
                        {q.notes}
                      </div>
                    )}

                    {/* Agent */}
                    <div className="mt-1.5 text-[10px] text-[--color-ink-faint]">
                      Agent: {q.job?.assigned_agent?.full_name ?? q.logged_by}
                    </div>
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
