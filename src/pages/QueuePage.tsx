import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { DEMO_QUEUE, DEMO_JOBS } from '@/lib/demoData'
import { formatDateTime } from '@/lib/utils'
import { Building2, Clock, Search, CheckCircle2, AlertCircle, Loader2, PlusCircle } from 'lucide-react'
import { SERVICE_TYPE_LABELS } from '@/types'

type QueueStage = 'all' | 'waiting' | 'processing' | 'done'

const getStage = (q: typeof DEMO_QUEUE[0]): Exclude<QueueStage, 'all'> => {
  if (q.processing_completed_at) return 'done'
  if (q.processing_started_at)   return 'processing'
  return 'waiting'
}

const STAGE_CFG = {
  waiting:    { label: 'Waiting',    color: '#fbbf24', bg: 'rgba(251,191,36,0.14)'  },
  processing: { label: 'Processing', color: '#60a5fa', bg: 'rgba(96,165,250,0.14)'  },
  done:       { label: 'Done',       color: '#34d399', bg: 'rgba(52,211,153,0.14)'  },
}

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 960, margin: '0 auto' }}>
    {children}
  </div>
)

export const QueuePage = () => {
  const { isAgent, canManage } = useRole()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [stage,  setStage]  = useState<QueueStage>('all')

  const enriched = DEMO_QUEUE.map(q => ({ ...q, job: DEMO_JOBS.find(j => j.id === q.job_id), stage: getStage(q) }))
  const filtered = enriched.filter(q => {
    const ms = !search ||
      (q.service_centre?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (q.job?.job_number ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (q.queue_number ?? '').toLowerCase().includes(search.toLowerCase())
    return ms && (stage === 'all' || q.stage === stage)
  })

  const counts = {
    waiting:    enriched.filter(q => q.stage === 'waiting').length,
    processing: enriched.filter(q => q.stage === 'processing').length,
    done:       enriched.filter(q => q.stage === 'done').length,
  }

  return (
    <PageShell>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <div className="breadcrumb" style={{ marginBottom: '0.4rem' }}>
            <span>SteelTrack</span><span className="sep">›</span><span className="active">SC Queue</span>
          </div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Service Centre Queue</h1>
          <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            {isAgent ? 'Your jobs at service centres — log check-in and status updates' : 'Live queue across all active service centres'}
          </p>
        </div>
        {/* Agent can log a new SC entry */}
        <button onClick={() => navigate('/queue/log')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none',
            background: 'linear-gradient(135deg,#2dd4bf,#0d9488)',
            color: '#07211e', fontWeight: 700, fontSize: '0.82rem',
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(45,212,191,0.25)',
          }}>
          <PlusCircle size={14} /> Log Queue Entry
        </button>
      </div>

      {/* Stage filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {(['all', 'waiting', 'processing', 'done'] as QueueStage[]).map(s => {
          const cfg = s !== 'all' ? STAGE_CFG[s] : { label: 'All', color: 'var(--tx2)', bg: 'var(--g2)' }
          const count = s === 'all' ? enriched.length : counts[s as keyof typeof counts]
          const isActive = stage === s
          return (
            <button key={s} onClick={() => setStage(s)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.35rem 0.85rem', borderRadius: 999,
                border: isActive ? `2px solid ${cfg.color}` : '2px solid transparent',
                background: isActive ? cfg.bg : 'var(--g1)',
                color: isActive ? cfg.color : 'var(--tx3)',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}>
              {s === 'waiting' && <Clock size={12} />}
              {s === 'processing' && <Loader2 size={12} />}
              {s === 'done' && <CheckCircle2 size={12} />}
              {s === 'all' && <Building2 size={12} />}
              {cfg.label} <span style={{ fontWeight: 800 }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx3)', pointerEvents: 'none' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by SC, job #, queue number…"
          style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 36, borderRadius: '0.55rem', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--tx1)', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem' }}>
          <Building2 size={32} style={{ color: 'var(--tx4)', margin: '0 auto 0.75rem' }} />
          <div style={{ color: 'var(--tx2)', fontWeight: 600 }}>No queue entries found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filtered.map(q => {
            const cfg = STAGE_CFG[q.stage]
            return (
              <div key={q.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  {/* Stage icon */}
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {q.stage === 'done'       && <CheckCircle2 size={16} style={{ color: cfg.color }} />}
                    {q.stage === 'processing' && <Loader2     size={16} style={{ color: cfg.color, animation: 'spin 1.5s linear infinite' }} />}
                    {q.stage === 'waiting'    && <Clock       size={16} style={{ color: cfg.color }} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx1)' }}>{q.service_centre?.name}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.55rem', borderRadius: 999, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {cfg.label}
                        </span>
                      </div>
                      <Link to={`/jobs/${q.job_id}`}
                        style={{ fontSize: '0.78rem', color: '#2dd4bf', fontWeight: 600, textDecoration: 'none' }}>
                        {q.job?.job_number} →
                      </Link>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: '0.5rem 1rem', marginTop: '0.75rem' }}>
                      {[
                        ['Service',  SERVICE_TYPE_LABELS[q.service_type]],
                        ['Queue #',  q.queue_number ?? 'N/A'],
                        ['Check-in', formatDateTime(q.checkin_time)],
                        ['Est.',     q.estimated_processing_minutes ? `${q.estimated_processing_minutes} min` : '—'],
                        ...(q.processing_started_at   ? [['Started',   formatDateTime(q.processing_started_at)]]   : []),
                        ...(q.processing_completed_at ? [['Completed', formatDateTime(q.processing_completed_at)]] : []),
                      ].map(([l, v]) => (
                        <div key={l}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</div>
                          <div style={{ fontSize: '0.80rem', fontWeight: 600, color: 'var(--tx2)', marginTop: 2 }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {q.notes && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: '0.65rem', fontSize: '0.78rem', color: 'var(--tx3)', fontStyle: 'italic' }}>
                        <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                        {q.notes}
                      </div>
                    )}

                    <div style={{ marginTop: '0.5rem', fontSize: '0.68rem', color: 'var(--tx4)' }}>
                      Agent: {q.job?.assigned_agent?.full_name ?? q.logged_by}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
