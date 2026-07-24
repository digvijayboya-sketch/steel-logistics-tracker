import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { useDataStore } from '@/store/dataStore'
import { formatDate } from '@/lib/utils'
import { Plus, Clock, CheckCircle2, PlayCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1200, margin: '0 auto' }}>
    {children}
  </div>
)

export const QueuePage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { queueUpdates, jobs, loading, error, fetchQueueUpdates, fetchJobs, updateQueueEntry, updateJobStatus } = useDataStore()

  useEffect(() => { fetchQueueUpdates(); fetchJobs() }, [])

  const [busyId, setBusyId] = useState<string | null>(null)

  const isLoading = loading['queue'] || loading['jobs']

  const grouped = queueUpdates.reduce<Record<string, typeof queueUpdates>>((acc, q) => {
    const key = q.service_centre?.name ?? 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(q)
    return acc
  }, {})

  const getJob = (jobId: string) => jobs.find(j => j.id === jobId)

  const stageColor = (q: typeof queueUpdates[0]) => {
    if (q.processing_completed_at) return '#34d399'
    if (q.processing_started_at)   return '#fbbf24'
    return '#60a5fa'
  }
  const stageLabel = (q: typeof queueUpdates[0]) => {
    if (q.processing_completed_at) return 'Complete'
    if (q.processing_started_at)   return 'Partial'
    return 'Queued'
  }

  const handleStart = async (id: string, jobId: string) => {
    setBusyId(id)
    try {
      await updateQueueEntry(id, { processing_started_at: new Date().toISOString() })
      await updateJobStatus(jobId, 'processing', user?.id ?? '')
      toast.success('Marked as partially processed')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update')
    } finally { setBusyId(null) }
  }

  const handleMarkDone = async (id: string, jobId: string) => {
    setBusyId(id)
    try {
      await updateQueueEntry(id, { processing_completed_at: new Date().toISOString() })
      await updateJobStatus(jobId, 'processing_done', user?.id ?? '')
      toast.success('Marked processing complete — ready to dispatch')
      navigate(`/deliveries/log?job=${jobId}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to update')
    } finally { setBusyId(null) }
  }

  return (
    <PageShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div className="breadcrumb" style={{ marginBottom: '0.4rem' }}>
            <span>SteelTrack</span><span className="sep">›</span><span className="active">Queue Tracker</span>
          </div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>SC Queue Board</h1>
          <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Live view of jobs at each service centre</p>
        </div>
        <button onClick={() => navigate('/queue/log')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(45,212,191,0.25)' }}>
          <Plus size={14} /> Log Entry
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '0.7rem', marginBottom: '1.25rem', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.28)' }}>
          <AlertTriangle size={15} style={{ color: '#f87171', flexShrink: 0 }} />
          <div style={{ fontSize: '0.84rem', color: 'var(--tx1)' }}>Couldn't load queue. <span style={{ color: 'var(--tx2)' }}>{error}</span></div>
        </div>
      )}

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--tx3)', fontSize: '0.82rem', marginBottom: '1rem' }}>
          <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading live data…
        </div>
      )}

      {!isLoading && Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', color: 'var(--tx3)' }}>No queue entries yet</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(Math.max(Object.keys(grouped).length, 1), 3)}, 1fr)`, gap: '1rem', alignItems: 'start' }}>
          {Object.entries(grouped).map(([scName, entries]) => (
            <div key={scName} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--g1)', borderBottom: '1px solid var(--gb)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--tx1)' }}>{scName}</span>
                <span style={{ fontSize: '0.70rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 999, background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid rgba(45,212,191,0.25)' }}>
                  {entries.length} job{entries.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.75rem' }}>
                {entries.map(q => {
                  const job = getJob(q.job_id)
                  const color = stageColor(q)
                  const label = stageLabel(q)
                  const isDone = !!q.processing_completed_at
                  const isProcessing = !!q.processing_started_at && !isDone
                  const isBusy = busyId === q.id
                  return (
                    <div key={q.id} style={{ background: 'var(--g2)', border: `1px solid var(--gb)`, borderLeft: `3px solid ${color}`, borderRadius: '0.65rem', padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--tx1)' }}>{job?.job_number ?? q.job_id.slice(0, 8)}</span>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 999, background: `${color}22`, color, border: `1px solid ${color}44`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                      </div>
                      {q.queue_number && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--tx3)', marginBottom: '0.3rem' }}>Queue #{q.queue_number}</div>
                      )}
                      <div style={{ fontSize: '0.72rem', color: 'var(--tx4)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: '0.6rem' }}>
                        <Clock size={11} /> Checked in {formatDate(q.checkin_time)}
                      </div>
                      {!isDone && (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {!isProcessing && (
                            <button disabled={isBusy} onClick={() => handleStart(q.id, q.job_id)}
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.3rem 0', borderRadius: '0.4rem', border: '1px solid rgba(251,191,36,0.35)', background: 'rgba(251,191,36,0.1)', color: '#fbbf24', fontWeight: 700, fontSize: '0.72rem', cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.6 : 1 }}>
                              <PlayCircle size={11} /> Mark Partial
                            </button>
                          )}
                          <button disabled={isBusy} onClick={() => handleMarkDone(q.id, q.job_id)}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.3rem 0', borderRadius: '0.4rem', border: '1px solid rgba(52,211,153,0.35)', background: 'rgba(52,211,153,0.1)', color: '#34d399', fontWeight: 700, fontSize: '0.72rem', cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.6 : 1 }}
                          >
                            <CheckCircle2 size={11} /> Mark Complete
                          </button>
                        </div>
                      )}
                      {isDone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#34d399', fontWeight: 600 }}>
                          <CheckCircle2 size={11} /> Processing complete — ready to dispatch
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  )
}
