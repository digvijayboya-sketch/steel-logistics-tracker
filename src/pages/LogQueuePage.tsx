import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { useDataStore } from '@/store/dataStore'
import { ArrowLeft, Clock, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { getCoords } from '@/lib/utils'
import type { ServiceType } from '@/types'
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

export const LogQueuePage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { jobs, serviceCentres, profiles, fetchJobs, fetchLookups, addQueueUpdate } = useDataStore()

  useEffect(()=>{ fetchJobs(); fetchLookups() },[])

  const isAdmin = user?.role==='admin'||(user?.role as string)==='manager'
  const activeJobs = jobs.filter(j=>!['delivered','cancelled'].includes(j.status))
  const myJobs     = isAdmin ? activeJobs : activeJobs.filter(j=>j.assigned_agent_id===user?.id)

  const [form, setForm] = useState({
    job_id: '',
    logged_as: user?.id??'',
    service_centre_id: '',
    service_type: '' as ServiceType|'',
    queue_number: '',
    estimated_processing_minutes: '',
    notes: '',
  })
  const [coords, setCoords] = useState<{lat?:number;lng?:number}>({})
  const [gpsStatus, setGpsStatus] = useState<'idle'|'fetching'|'got'|'error'>('idle')
  const [submitting, setSubmitting] = useState(false)
  const setField = (k:string,v:string)=>setForm(f=>({...f,[k]:v}))

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

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    if (!form.job_id) { toast.error('Select a job'); return }
    if (!form.service_centre_id) { toast.error('Select a service centre'); return }
    if (!form.service_type) { toast.error('Select service type'); return }
    setSubmitting(true)
    try {
      const loggedById = isAdmin && form.logged_as ? form.logged_as : (user?.id ?? '')
      await addQueueUpdate({
        job_id: form.job_id,
        service_centre_id: form.service_centre_id,
        service_type: form.service_type as ServiceType,
        queue_number: form.queue_number || undefined,
        checkin_time: new Date().toISOString(),
        estimated_processing_minutes: form.estimated_processing_minutes
          ? parseInt(form.estimated_processing_minutes)
          : undefined,
        notes: form.notes || undefined,
        gps_lat: coords.lat,
        gps_lng: coords.lng,
        logged_by: loggedById,
      })
      toast.success('Checked in at service centre')
      navigate('/queue')
    } catch(e:unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    } finally { setSubmitting(false) }
  }

  const card: React.CSSProperties = {
    background:'var(--card-bg)', border:'1px solid var(--card-border)',
    borderRadius:'0.85rem', padding:'1.25rem', boxShadow:'var(--sh-card)', marginBottom:'1rem',
  }
  const selectedJob = jobs.find(j=>j.id===form.job_id)
  const agents = profiles.filter(p=>p.role==='agent'||(p.role as string)==='manager')

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
                  <option value={user?.id??''}>{user?.full_name} (you)</option>
                  {agents.filter(a=>a.id!==user?.id).map(a=><option key={a.id} value={a.id}>{a.full_name}</option>)}
                </select>
              </div>
            )}
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
                <label style={lbl}>Queue Number</label>
                <input style={inp} value={form.queue_number} onChange={e=>setField('queue_number',e.target.value)} placeholder="e.g. Q-14"/>
              </div>
              <div>
                <label style={lbl}>Est. Time (min)</label>
                <input style={inp} type="number" inputMode="numeric" value={form.estimated_processing_minutes} onChange={e=>setField('estimated_processing_minutes',e.target.value)} placeholder="120"/>
              </div>
            </div>
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
            {gpsStatus==='got'&&'✓ Location tagged'}
            {gpsStatus==='error'&&'GPS unavailable'}
          </button>
        </div>

        <div style={{display:'flex',gap:'0.75rem',paddingBottom:'2rem'}}>
          <button type="button" onClick={()=>navigate(-1)} style={{flex:1,padding:'0.7rem',borderRadius:'0.6rem',border:'1px solid var(--gb)',background:'var(--g2)',color:'var(--tx2)',fontWeight:600,fontSize:'0.88rem',cursor:'pointer'}}>Cancel</button>
          <button type="submit" disabled={submitting} style={{flex:1,padding:'0.7rem',borderRadius:'0.6rem',border:'none',background:'linear-gradient(135deg,#2dd4bf,#0d9488)',color:'#07211e',fontWeight:700,fontSize:'0.88rem',cursor:'pointer',opacity:submitting?0.65:1}}>
            {submitting?'Checking in…':'Check In'}
          </button>
        </div>
      </form>
    </div>
  )
}
