import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { useDataStore } from '@/store/dataStore'
import { ArrowLeft, Clock, MapPin, Save, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getCoords } from '@/lib/utils'
import type { ServiceType, JobStatus } from '@/types'
import { SERVICE_TYPE_LABELS } from '@/types'

const inp: React.CSSProperties = {
  width:'100%', padding:'0.55rem 0.75rem', borderRadius:'0.55rem',
  border:'1px solid var(--input-border)', background:'var(--input-bg)',
  color:'var(--tx1)', fontSize:'0.875rem', outline:'none', boxSizing:'border-box' as const,
}
const lbl: React.CSSProperties = {
  display:'block', fontSize:'0.70rem', fontWeight:700,
  color:'var(--tx4)', textTransform:'uppercase' as const, letterSpacing:'0.07em', marginBottom:4,
}

const EVENT_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: 'at_service_centre',      label: 'Arrived / In Queue' },
  { value: 'processing',             label: 'Processing' },
  { value: 'processing_done',        label: 'Ready' },
  { value: 'in_transit_to_customer', label: 'Dispatched' },
]

const LS_PREFIX = 'pending_queue_'

type QueueForm = {
  job_id: string
  logged_as: string
  service_centre_id: string
  service_type: ServiceType | ''
  event: JobStatus
  queue_number: string
  estimated_processing_minutes: string
  notes: string
  gps_lat?: number
  gps_lng?: number
  checkin_time: string
}

type SyncResult = { key: string; jobId: string; ok: boolean; message: string }

export const LogQueuePage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { jobs, serviceCentres, profiles, fetchJobs, fetchLookups, addQueueUpdate, updateJobStatus } = useDataStore()

  useEffect(()=>{ fetchJobs(); fetchLookups() },[])

  const isAdmin = user?.role==='admin'||(user?.role as string)==='manager'
  const activeJobs = jobs.filter(j=>!['delivered','cancelled'].includes(j.status))
  const myJobs     = isAdmin ? activeJobs : activeJobs.filter(j=>j.assigned_agent_id===user?.id)

  const [form, setForm] = useState({
    job_id: '',
    logged_as: user?.id??'',
    service_centre_id: '',
    service_type: '' as ServiceType|'',
    event: 'at_service_centre' as JobStatus,
    queue_number: '',
    estimated_processing_minutes: '',
    notes: '',
  })
  const [coords, setCoords] = useState<{lat?:number;lng?:number}>({})
  const [gpsStatus, setGpsStatus] = useState<'idle'|'fetching'|'got'|'error'>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [savingLocal, setSavingLocal] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null)
  const setField = (k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const refreshPendingCount = () => {
    setPendingCount(Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX)).length)
  }
  useEffect(() => { refreshPendingCount() }, [])

  const fetchGPS = async () => {
    setGpsStatus('fetching')
    const c = await getCoords()
    if (c.lat) {
      setCoords({ lat: c.lat, lng: c.lng })
      setGpsStatus('got')
    } else {
      setGpsStatus('error')
    }
  }

  const validate = () => {
    if (!form.job_id) return 'Select a job'
    if (!form.service_centre_id) return 'Select a service centre'
    if (!form.service_type) return 'Select service type'
    return null
  }

  const buildPayload = (): QueueForm => ({
    job_id: form.job_id,
    logged_as: isAdmin && form.logged_as ? form.logged_as : (user?.id ?? ''),
    service_centre_id: form.service_centre_id,
    service_type: form.service_type,
    event: form.event,
    queue_number: form.queue_number,
    estimated_processing_minutes: form.estimated_processing_minutes,
    notes: form.notes,
    gps_lat: coords.lat,
    gps_lng: coords.lng,
    checkin_time: new Date().toISOString(),
  })

  const submitQueueEntry = async (p: QueueForm) => {
    await addQueueUpdate({
      job_id: p.job_id,
      service_centre_id: p.service_centre_id,
      service_type: p.service_type as ServiceType,
      queue_number: p.queue_number || undefined,
      checkin_time: p.checkin_time,
      estimated_processing_minutes: p.estimated_processing_minutes ? parseInt(p.estimated_processing_minutes) : undefined,
      notes: p.notes || undefined,
      gps_lat: p.gps_lat,
      gps_lng: p.gps_lng,
      logged_by: p.logged_as,
    })
    // addQueueUpdate already flips the job to 'at_service_centre' — override if a further-along event was selected
    if (p.event !== 'at_service_centre') {
      await updateJobStatus(p.job_id, p.event, p.logged_as)
    }
  }

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { toast.error(err); return }
    setSubmitting(true)
    try {
      await submitQueueEntry(buildPayload())
      toast.success('Checked in at service centre')
      navigate('/queue')
    } catch(e:unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally { setSubmitting(false) }
  }

  const handleSaveLocally = () => {
    const err = validate()
    if (err) { toast.error(err); return }
    setSavingLocal(true)
    try {
      const key = `${LS_PREFIX}${Date.now()}`
      localStorage.setItem(key, JSON.stringify(buildPayload()))
      toast.success('Saved locally — sync when back online')
      refreshPendingCount()
      navigate('/queue')
    } finally { setSavingLocal(false) }
  }

  const handleSyncNow = async () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(LS_PREFIX))
    if (keys.length === 0) { toast.info('Nothing pending to sync'); return }
    setSyncing(true)
    const results: SyncResult[] = []
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      try {
        const payload = JSON.parse(raw) as QueueForm
        await submitQueueEntry(payload)
        localStorage.removeItem(key)
        results.push({ key, jobId: payload.job_id, ok: true, message: 'Synced' })
      } catch (e: unknown) {
        results.push({ key, jobId: 'unknown', ok: false, message: e instanceof Error ? e.message : 'Failed' })
      }
    }
    setSyncResults(results)
    refreshPendingCount()
    setSyncing(false)
    const failed = results.filter(r => !r.ok).length
    if (failed === 0) toast.success(`Synced ${results.length} pending check-in${results.length > 1 ? 's' : ''}`)
    else toast.error(`${failed} of ${results.length} failed to sync`)
  }

  const card: React.CSSProperties = {
    background:'var(--card-bg)', border:'1px solid var(--card-border)',
    borderRadius:'0.85rem', padding:'1.25rem', boxShadow:'var(--sh-card)', marginBottom:'1rem',
  }
  const selectedJob = jobs.find(j=>j.id===form.job_id)
  const agents = profiles.filter(p=>p.role==='agent'||(p.role as string)==='manager')

  const etaMinutes = form.estimated_processing_minutes ? parseInt(form.estimated_processing_minutes) : null
  const computedETA = etaMinutes && !isNaN(etaMinutes)
    ? new Date(Date.now() + etaMinutes * 60000).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
    : null

  return (
    <div style={{minHeight:'100%',padding:'1.5rem 1.75rem',maxWidth:640,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1.5rem'}}>
        <button onClick={()=>navigate('/queue')} style={{width:34,height:34,borderRadius:'0.5rem',border:'1px solid var(--gb)',background:'var(--g2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--tx3)'}}>
          <ArrowLeft size={15}/>
        </button>
        <div>
          <h1 style={{color:'var(--tx1)',fontSize:'1.2rem',fontWeight:800,letterSpacing:'-0.02em',margin:0}}>Check In at SC</h1>
          <p style={{color:'var(--tx4)',fontSize:'0.78rem',margin:0}}>Log queue position and service type</p>
        </div>
      </div>

      {/* Sync bar */}
      {pendingCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '0.7rem', marginBottom: '1rem', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)' }}>
          <div style={{ fontSize: '0.84rem', color: 'var(--tx1)', flex: 1 }}>
            <span style={{ fontWeight: 700 }}>{pendingCount} check-in{pendingCount > 1 ? 's' : ''}</span>
            <span style={{ color: 'var(--tx2)' }}> saved locally, not yet synced</span>
          </div>
          <button type="button" onClick={handleSyncNow} disabled={syncing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.85rem', borderRadius: '0.5rem', border: 'none', background: '#fbbf24', color: '#1c1400', fontWeight: 700, fontSize: '0.78rem', cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.65 : 1 }}>
            <RefreshCw size={13} style={syncing ? { animation: 'spin 0.8s linear infinite' } : undefined} /> {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      )}
      {syncResults && (
        <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {syncResults.map(r => (
            <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.78rem', background: r.ok ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)', border: `1px solid ${r.ok ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`, color: r.ok ? '#34d399' : '#f87171' }}>
              {r.ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />} {r.message}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'1rem'}}>
            <Clock size={14} style={{color:'var(--accent)'}}/>
            <span style={{fontWeight:700,fontSize:'0.88rem',color:'var(--tx1)'}}>Check-In Details</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            <div>
              <label style={lbl}>Job *</label>
              <select style={inp} value={form.job_id} onChange={e=>setField('job_id',e.target.value)}>
                <option value="">Select job…</option>
                {myJobs.map(j=><option key={j.id} value={j.id}>{j.job_number} — {j.delivery_destination}</option>)}
              </select>
            </div>
            {selectedJob&&(
              <div style={{padding:'0.6rem 0.75rem',borderRadius:'0.5rem',background:'var(--accent-dim)',border:'1px solid rgba(45,212,191,0.2)',fontSize:'0.78rem',color:'var(--tx2)'}}>
                <span style={{fontWeight:700,color:'var(--accent)'}}>Planned SC:</span> {selectedJob.do?.source_service_centre?.name??'—'}
              </div>
            )}
            {isAdmin&&(
              <div>
                <label style={lbl}>Logging On Behalf Of</label>
                <select style={inp} value={form.logged_as} onChange={e=>setField('logged_as',e.target.value)}>
                  <option value={user?.id??''}>{user?.name} (you)</option>
                  {agents.filter(a=>a.id!==user?.id).map(a=><option key={a.id} value={a.id}>{a.full_name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={lbl}>Event *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {EVENT_OPTIONS.map(o => (
                  <button key={o.value} type="button" onClick={()=>setField('event', o.value)}
                    style={{ padding: '0.5rem 0.6rem', borderRadius: '0.5rem', border: `1px solid ${form.event===o.value?'var(--accent)':'var(--gb)'}`, background: form.event===o.value?'var(--accent-dim)':'var(--g2)', color: form.event===o.value?'var(--accent)':'var(--tx2)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>Service Centre *</label>
              <select style={inp} value={form.service_centre_id} onChange={e=>setField('service_centre_id',e.target.value)}>
                <option value="">Select SC…</option>
                {serviceCentres.map(sc=><option key={sc.id} value={sc.id}>{sc.name} – {sc.city}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Service Type *</label>
              <select style={inp} value={form.service_type} onChange={e=>setField('service_type',e.target.value)}>
                <option value="">Select type…</option>
                {Object.entries(SERVICE_TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.65rem'}}>
              <div>
                <label style={lbl}>Queue Position</label>
                <input style={inp} value={form.queue_number} onChange={e=>setField('queue_number',e.target.value)} placeholder="e.g. Q-14"/>
              </div>
              <div>
                <label style={lbl}>Est. Time (min)</label>
                <input style={inp} type="number" inputMode="numeric" value={form.estimated_processing_minutes} onChange={e=>setField('estimated_processing_minutes',e.target.value)} placeholder="120"/>
              </div>
            </div>
            {computedETA && (
              <div style={{ fontSize: '0.78rem', color: 'var(--tx3)' }}>
                Estimated ready by <span style={{ fontWeight: 700, color: 'var(--tx1)' }}>{computedETA}</span>
              </div>
            )}
            <div>
              <label style={lbl}>Notes</label>
              <textarea style={{...inp,resize:'vertical'} as React.CSSProperties} rows={2} value={form.notes} onChange={e=>setField('notes',e.target.value)} placeholder="Any remarks, delays, conditions…"/>
            </div>
          </div>
        </div>

        <div style={card}>
          <span style={{fontWeight:700,fontSize:'0.88rem',color:'var(--tx1)',display:'block',marginBottom:'0.65rem'}}>Location Tag</span>
          <button type="button" onClick={fetchGPS} disabled={gpsStatus==='fetching'}
            style={{width:'100%',padding:'0.65rem 0.75rem',borderRadius:'0.55rem',border:`1px solid ${gpsStatus==='got'?'#34d399':gpsStatus==='error'?'#f87171':'var(--gb)'}`,background:gpsStatus==='got'?'rgba(52,211,153,0.1)':'var(--g2)',color:gpsStatus==='got'?'#34d399':gpsStatus==='error'?'#f87171':'var(--tx3)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.82rem',fontWeight:600}}>
            <MapPin size={14}/>
            {gpsStatus==='idle'&&'Tag my current location'}
            {gpsStatus==='fetching'&&'Getting GPS…'}
            {gpsStatus==='got'&&`✓ ${coords.lat?.toFixed(4)}, ${coords.lng?.toFixed(4)}`}
            {gpsStatus==='error'&&'GPS unavailable'}
          </button>
        </div>

        <div style={{display:'flex',gap:'0.6rem',paddingBottom:'2rem',flexWrap:'wrap'}}>
          <button type="button" onClick={()=>navigate(-1)} style={{flex:'1 1 100px',padding:'0.7rem',borderRadius:'0.6rem',border:'1px solid var(--gb)',background:'var(--g2)',color:'var(--tx2)',fontWeight:600,fontSize:'0.85rem',cursor:'pointer'}}>Cancel</button>
          <button type="button" onClick={handleSaveLocally} disabled={savingLocal}
            style={{flex:'1 1 130px',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.4rem',padding:'0.7rem',borderRadius:'0.6rem',border:'1px solid var(--accent)',background:'var(--accent-dim)',color:'var(--accent)',fontWeight:700,fontSize:'0.85rem',cursor:savingLocal?'not-allowed':'pointer',opacity:savingLocal?0.65:1}}>
            <Save size={14}/> Save Locally
          </button>
          <button type="submit" disabled={submitting} style={{flex:'1 1 130px',padding:'0.7rem',borderRadius:'0.6rem',border:'none',background:'linear-gradient(135deg,#2dd4bf,#0d9488)',color:'#07211e',fontWeight:700,fontSize:'0.85rem',cursor:'pointer',opacity:submitting?0.65:1}}>
            {submitting?'Checking in…':'Check In'}
          </button>
        </div>
      </form>
    </div>
  )
}
