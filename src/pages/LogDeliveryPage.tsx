import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { useDataStore } from '@/store/dataStore'
import { ArrowLeft, Camera, MapPin, Truck, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { getCoords } from '@/lib/utils'
import type { DeliveryStatus } from '@/types'

const inp: React.CSSProperties = {
  width:'100%', padding:'0.55rem 0.75rem', borderRadius:'0.55rem',
  border:'1px solid var(--input-border)', background:'var(--input-bg)',
  color:'var(--tx1)', fontSize:'0.875rem', outline:'none', boxSizing:'border-box' as const,
}
const lbl: React.CSSProperties = {
  display:'block', fontSize:'0.70rem', fontWeight:700,
  color:'var(--tx4)', textTransform:'uppercase' as const, letterSpacing:'0.07em', marginBottom:4,
}

export const LogDeliveryPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { jobs, profiles, fetchJobs, fetchLookups, addDelivery } = useDataStore()

  useEffect(()=>{ fetchJobs(); fetchLookups() },[])

  const isAdmin    = user?.role==='admin'||(user?.role as string)==='manager'
  const activeJobs = jobs.filter(j=>!['delivered','cancelled'].includes(j.status))
  const myJobs     = isAdmin ? activeJobs : activeJobs.filter(j=>j.assigned_agent_id===user?.id)

  const [form, setForm] = useState({
    job_id: '',
    logged_as: user?.id??'',
    vehicle_number: '',
    delivery_address: '',
    delivery_status: 'delivered' as DeliveryStatus,
    destination_changed: false,
    change_reason: '',
    authorised_by_office: false,
  })
  const [gpsStatus, setGpsStatus]   = useState<'idle'|'fetching'|'got'|'error'>('idle')
  const [coords, setCoords]         = useState<{lat?:number;lng?:number}>({})
  const [photoLabel, setPhotoLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const setField = (k:string,v:string|boolean)=>setForm(f=>({...f,[k]:v}))
  const selectedJob = jobs.find(j=>j.id===form.job_id)

  const fetchGPS = async () => {
    setGpsStatus('fetching')
    const c = await getCoords()
    if (c.lat) { setCoords(c); setGpsStatus('got') } else setGpsStatus('error')
  }

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    if (!form.job_id) { toast.error('Select a job'); return }
    if (!form.vehicle_number.trim()) { toast.error('Vehicle number required'); return }
    if (!form.delivery_address.trim()) { toast.error('Delivery address required'); return }
    if (form.destination_changed&&!form.change_reason.trim()) { toast.error('Enter reason for destination change'); return }
    setSubmitting(true)
    try {
      const loggedById = isAdmin&&form.logged_as ? form.logged_as : user?.id??''
      await addDelivery({
        job_id: form.job_id,
        customer_name: selectedJob?.customer?.name??selectedJob?.delivery_destination??'',
        delivery_address: form.delivery_address.trim(),
        vehicle_number: form.vehicle_number.trim().toUpperCase(),
        delivered_at: new Date().toISOString(),
        delivery_status: form.delivery_status,
        unloaded_photo_url: photoLabel||undefined,
        final_lat: coords.lat,
        final_lng: coords.lng,
        destination_changed: form.destination_changed,
        old_destination: form.destination_changed ? selectedJob?.delivery_destination : undefined,
        new_destination: form.destination_changed ? form.delivery_address.trim() : undefined,
        change_reason: form.destination_changed ? form.change_reason.trim() : undefined,
        authorised_by_office: form.destination_changed ? form.authorised_by_office : undefined,
        created_by: loggedById,
        created_at: new Date().toISOString(),
      } as any)
      toast.success('Delivery logged successfully')
      navigate('/deliveries')
    } catch(e:any) {
      toast.error(e.message??'Failed')
    } finally { setSubmitting(false) }
  }

  const card: React.CSSProperties = {
    background:'var(--card-bg)', border:'1px solid var(--card-border)',
    borderRadius:'0.85rem', padding:'1.25rem', boxShadow:'var(--sh-card)', marginBottom:'1rem',
  }
  const agents = profiles.filter(p=>p.role==='agent')

  return (
    <div style={{minHeight:'100%',padding:'1.5rem 1.75rem',maxWidth:640,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1.5rem'}}>
        <button onClick={()=>navigate('/deliveries')} style={{width:34,height:34,borderRadius:'0.5rem',border:'1px solid var(--gb)',background:'var(--g2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--tx3)'}}>
          <ArrowLeft size={15}/>
        </button>
        <div>
          <h1 style={{color:'var(--tx1)',fontSize:'1.2rem',fontWeight:800,letterSpacing:'-0.02em',margin:0}}>Log Delivery</h1>
          <p style={{color:'var(--tx4)',fontSize:'0.78rem',margin:0}}>Record completed delivery to customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'1rem'}}>
            <Truck size={14} style={{color:'var(--accent)'}}/>
            <span style={{fontWeight:700,fontSize:'0.88rem',color:'var(--tx1)'}}>Delivery Details</span>
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
              <div style={{padding:'0.6rem 0.75rem',borderRadius:'0.5rem',background:'var(--accent-dim)',border:'1px solid rgba(45,212,191,0.2)',fontSize:'0.78rem'}}>
                <div style={{color:'var(--tx2)'}}><span style={{fontWeight:700,color:'var(--accent)'}}>Planned dest:</span> {selectedJob.delivery_destination}</div>
                <div style={{color:'var(--tx3)',marginTop:2}}><span style={{fontWeight:600}}>Customer:</span> {selectedJob.customer?.name??'—'}</div>
              </div>
            )}
            {isAdmin&&(
              <div>
                <label style={lbl}>Logging On Behalf Of</label>
                <select style={inp} value={form.logged_as} onChange={e=>setField('logged_as',e.target.value)}>
                  <option value={user?.id??''}>{user?.name} (you)</option>
                  {agents.map(a=><option key={a.id} value={a.id}>{a.full_name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={lbl}>Vehicle Number *</label>
              <input style={{...inp,fontFamily:'monospace',textTransform:'uppercase'}} value={form.vehicle_number}
                onChange={e=>setField('vehicle_number',e.target.value)} placeholder="e.g. MH12AB1234"/>
            </div>
            <div>
              <label style={lbl}>Actual Delivery Address *</label>
              <textarea style={{...inp,resize:'vertical'} as React.CSSProperties} rows={2} value={form.delivery_address}
                onChange={e=>setField('delivery_address',e.target.value)} placeholder="Full address where material was unloaded"/>
            </div>
            <div>
              <label style={lbl}>Delivery Status</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}>
                {(['delivered','partial'] as DeliveryStatus[]).map(s=>(
                  <label key={s} style={{display:'flex',alignItems:'center',gap:'0.55rem',padding:'0.55rem 0.75rem',borderRadius:'0.5rem',border:`1px solid ${form.delivery_status===s?'var(--accent)':'var(--gb)'}`,background:form.delivery_status===s?'var(--accent-dim)':'var(--g2)',cursor:'pointer'}}>
                    <input type="radio" name="delivery_status" value={s} checked={form.delivery_status===s} onChange={()=>setField('delivery_status',s)} style={{accentColor:'var(--accent)'}}/>
                    <span style={{fontSize:'0.82rem',color:'var(--tx1)',textTransform:'capitalize'}}>{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'0.85rem'}}>
            <AlertTriangle size={14} style={{color:'#fbbf24'}}/>
            <span style={{fontWeight:700,fontSize:'0.88rem',color:'var(--tx1)'}}>Destination Change?</span>
          </div>
          <label style={{display:'flex',alignItems:'center',gap:'0.65rem',cursor:'pointer'}}>
            <input type="checkbox" checked={form.destination_changed} onChange={e=>setField('destination_changed',e.target.checked)} style={{width:16,height:16,accentColor:'var(--accent)'}}/>
            <span style={{fontSize:'0.84rem',color:'var(--tx1)'}}>Delivery destination was changed from plan</span>
          </label>
          {form.destination_changed&&(
            <div style={{marginTop:'0.85rem',display:'flex',flexDirection:'column',gap:'0.65rem'}}>
              <div>
                <label style={lbl}>Reason for Change *</label>
                <textarea style={{...inp,resize:'vertical',border:'1px solid #fbbf24',background:'rgba(251,191,36,0.07)'} as React.CSSProperties}
                  rows={2} value={form.change_reason} onChange={e=>setField('change_reason',e.target.value)}
                  placeholder="Explain why destination changed…"/>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:'0.65rem',cursor:'pointer'}}>
                <input type="checkbox" checked={form.authorised_by_office} onChange={e=>setField('authorised_by_office',e.target.checked)} style={{width:16,height:16,accentColor:'var(--accent)'}}/>
                <span style={{fontSize:'0.84rem',color:'var(--tx1)'}}>Authorised by office (phone/WhatsApp)</span>
              </label>
              {!form.authorised_by_office&&(
                <div style={{padding:'0.6rem 0.75rem',borderRadius:'0.5rem',background:'rgba(251,191,36,0.1)',border:'1px solid rgba(251,191,36,0.3)',fontSize:'0.78rem',color:'#fbbf24'}}>
                  ⚠️ Will be flagged as self-authorised — office will be notified.
                </div>
              )}
            </div>
          )}
        </div>

        <div style={card}>
          <span style={{fontWeight:700,fontSize:'0.88rem',color:'var(--tx1)',display:'block',marginBottom:'0.85rem'}}>Evidence</span>
          <div style={{display:'flex',flexDirection:'column',gap:'0.6rem'}}>
            <button type="button" onClick={()=>{ setPhotoLabel('unload_'+Date.now()+'.jpg'); toast.success('Photo captured') }}
              style={{width:'100%',padding:'1.25rem',borderRadius:'0.65rem',border:`2px dashed ${photoLabel?'#34d399':'var(--gb)'}`,background:photoLabel?'rgba(52,211,153,0.08)':'var(--g1)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.4rem'}}>
              <Camera size={20} style={{color:photoLabel?'#34d399':'var(--tx4)'}}/>
              <span style={{fontSize:'0.78rem',color:photoLabel?'#34d399':'var(--tx4)',fontWeight:600}}>
                {photoLabel?`✓ ${photoLabel}`:'Photo of unloaded material at customer site'}
              </span>
            </button>
            <button type="button" onClick={fetchGPS} disabled={gpsStatus==='fetching'}
              style={{width:'100%',padding:'0.65rem 0.75rem',borderRadius:'0.55rem',border:`1px solid ${gpsStatus==='got'?'#34d399':'var(--gb)'}`,background:gpsStatus==='got'?'rgba(52,211,153,0.1)':'var(--g2)',color:gpsStatus==='got'?'#34d399':'var(--tx3)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.82rem',fontWeight:600}}>
              <MapPin size={14}/>
              {gpsStatus==='idle'&&'Tag delivery GPS location'}
              {gpsStatus==='fetching'&&'Getting GPS…'}
              {gpsStatus==='got'&&`✓ ${coords.lat?.toFixed(4)}, ${coords.lng?.toFixed(4)}`}
              {gpsStatus==='error'&&'GPS unavailable'}
            </button>
          </div>
        </div>

        <div style={{display:'flex',gap:'0.75rem',paddingBottom:'2rem'}}>
          <button type="button" onClick={()=>navigate(-1)} style={{flex:1,padding:'0.7rem',borderRadius:'0.6rem',border:'1px solid var(--gb)',background:'var(--g2)',color:'var(--tx2)',fontWeight:600,fontSize:'0.88rem',cursor:'pointer'}}>Cancel</button>
          <button type="submit" disabled={submitting} style={{flex:1,padding:'0.7rem',borderRadius:'0.6rem',border:'none',background:'linear-gradient(135deg,#2dd4bf,#0d9488)',color:'#07211e',fontWeight:700,fontSize:'0.88rem',cursor:'pointer',opacity:submitting?0.65:1}}>
            {submitting?'Logging…':'Log Delivery'}
          </button>
        </div>
      </form>
    </div>
  )
}
