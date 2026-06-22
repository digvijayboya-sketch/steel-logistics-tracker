import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { useDataStore } from '@/store/dataStore'
import { ArrowLeft, Camera, MapPin, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { getCoords } from '@/lib/utils'
import type { ExpenseCategory, SettlementMethod } from '@/types'
import { EXPENSE_CATEGORY_LABELS, SETTLEMENT_LABELS } from '@/types'

const inp: React.CSSProperties = {
  width:'100%', padding:'0.55rem 0.75rem', borderRadius:'0.55rem',
  border:'1px solid var(--input-border)', background:'var(--input-bg)',
  color:'var(--tx1)', fontSize:'0.875rem', outline:'none', boxSizing:'border-box' as const,
}
const lbl: React.CSSProperties = {
  display:'block', fontSize:'0.70rem', fontWeight:700,
  color:'var(--tx4)', textTransform:'uppercase' as const, letterSpacing:'0.07em', marginBottom:4,
}

export const LogExpensePage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { jobs, profiles, fetchJobs, fetchLookups, addExpense } = useDataStore()

  useEffect(()=>{ fetchJobs(); fetchLookups() },[])

  const isAdmin = user?.role==='admin'||(user?.role as string)==='manager'

  // Admin sees all active jobs; agents see only their own
  const activeJobs = jobs.filter(j=>!['delivered','cancelled'].includes(j.status))
  const myJobs     = isAdmin ? activeJobs : activeJobs.filter(j=>j.assigned_agent_id===user?.id)

  const [form, setForm] = useState({
    job_id: '',
    logged_as: user?.id??'',   // admin can log on behalf of any agent
    category: '' as ExpenseCategory|'',
    amount_inr: '',
    payee_description: '',
    settlement_method: 'agent_reimbursable' as SettlementMethod,
  })
  const [gpsStatus, setGpsStatus] = useState<'idle'|'fetching'|'got'|'error'>('idle')
  const [coords, setCoords]       = useState<{lat?:number;lng?:number}>({})
  const [photoLabel, setPhotoLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const setField = (k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const fetchGPS = async () => {
    setGpsStatus('fetching')
    const c = await getCoords()
    if (c.lat) { setCoords(c); setGpsStatus('got') } else setGpsStatus('error')
  }

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    if (!form.job_id) { toast.error('Select a job'); return }
    if (!form.category) { toast.error('Select a category'); return }
    const amt = parseFloat(form.amount_inr)
    if (isNaN(amt)||amt<=0) { toast.error('Enter a valid amount'); return }
    if (!form.payee_description.trim()) { toast.error('Payee description required'); return }
    setSubmitting(true)
    try {
      const loggedById = isAdmin&&form.logged_as ? form.logged_as : user?.id??''
      const agent = profiles.find(p=>p.id===loggedById)
      await addExpense({
        job_id: form.job_id,
        category: form.category as ExpenseCategory,
        amount_inr: amt,
        payee_description: form.payee_description.trim(),
        settlement_method: form.settlement_method,
        status: 'pending',
        photo_url: photoLabel||undefined,
        gps_lat: coords.lat,
        gps_lng: coords.lng,
        logged_by: loggedById,
        created_at: new Date().toISOString(),
        logged_by_profile: agent,
      } as any)
      toast.success('Expense logged — pending approval')
      navigate('/expenses')
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
        <button onClick={()=>navigate('/expenses')} style={{width:34,height:34,borderRadius:'0.5rem',border:'1px solid var(--gb)',background:'var(--g2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--tx3)'}}>
          <ArrowLeft size={15}/>
        </button>
        <div>
          <h1 style={{color:'var(--tx1)',fontSize:'1.2rem',fontWeight:800,letterSpacing:'-0.02em',margin:0}}>Log Field Expense</h1>
          <p style={{color:'var(--tx4)',fontSize:'0.78rem',margin:0}}>Cash payment made in the field</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'1rem'}}>
            <Receipt size={14} style={{color:'var(--accent)'}}/>
            <span style={{fontWeight:700,fontSize:'0.88rem',color:'var(--tx1)'}}>Expense Details</span>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            <div>
              <label style={lbl}>Job *</label>
              <select style={inp} value={form.job_id} onChange={e=>setField('job_id',e.target.value)}>
                <option value="">Select active job…</option>
                {myJobs.map(j=><option key={j.id} value={j.id}>{j.job_number} — {j.delivery_destination}</option>)}
              </select>
            </div>
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
              <label style={lbl}>Category *</label>
              <select style={inp} value={form.category} onChange={e=>setField('category',e.target.value)}>
                <option value="">Select category…</option>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Amount (₹) *</label>
              <input style={{...inp,fontSize:'1.25rem',fontWeight:700}} type="number" inputMode="numeric" min="0" step="1"
                value={form.amount_inr} onChange={e=>setField('amount_inr',e.target.value)} placeholder="0"/>
            </div>
            <div>
              <label style={lbl}>Payee / Description *</label>
              <input style={inp} value={form.payee_description} onChange={e=>setField('payee_description',e.target.value)} placeholder="e.g. SC worker loading tip"/>
            </div>
            <div>
              <label style={lbl}>Settlement Method</label>
              <div style={{display:'flex',flexDirection:'column',gap:'0.4rem'}}>
                {(Object.entries(SETTLEMENT_LABELS) as [SettlementMethod,string][]).map(([k,v])=>(
                  <label key={k} style={{display:'flex',alignItems:'center',gap:'0.65rem',padding:'0.55rem 0.75rem',borderRadius:'0.55rem',border:`1px solid ${form.settlement_method===k?'var(--accent)':'var(--gb)'}`,background:form.settlement_method===k?'var(--accent-dim)':'var(--g2)',cursor:'pointer'}}>
                    <input type="radio" name="settlement" value={k} checked={form.settlement_method===k} onChange={()=>setField('settlement_method',k)}
                      style={{accentColor:'var(--accent)'}}/>
                    <span style={{fontSize:'0.82rem',color:'var(--tx1)'}}>{v}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={card}>
          <span style={{fontWeight:700,fontSize:'0.88rem',color:'var(--tx1)',display:'block',marginBottom:'0.85rem'}}>Evidence & Location</span>
          <div style={{display:'flex',flexDirection:'column',gap:'0.6rem'}}>
            <button type="button" onClick={()=>{ setPhotoLabel('photo_'+Date.now()+'.jpg'); toast.success('Photo captured (simulated)') }}
              style={{width:'100%',padding:'1.25rem',borderRadius:'0.65rem',border:`2px dashed ${photoLabel?'#34d399':'var(--gb)'}`,background:photoLabel?'rgba(52,211,153,0.08)':'var(--g1)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.4rem'}}>
              <Camera size={20} style={{color:photoLabel?'#34d399':'var(--tx4)'}}/>
              <span style={{fontSize:'0.78rem',color:photoLabel?'#34d399':'var(--tx4)',fontWeight:600}}>
                {photoLabel?`✓ ${photoLabel}`:'Tap to attach photo (receipt / material)'}
              </span>
            </button>
            <button type="button" onClick={fetchGPS} disabled={gpsStatus==='fetching'}
              style={{width:'100%',padding:'0.65rem 0.75rem',borderRadius:'0.55rem',border:`1px solid ${gpsStatus==='got'?'#34d399':gpsStatus==='error'?'#f87171':'var(--gb)'}`,background:gpsStatus==='got'?'rgba(52,211,153,0.1)':gpsStatus==='error'?'rgba(248,113,113,0.1)':'var(--g2)',color:gpsStatus==='got'?'#34d399':gpsStatus==='error'?'#f87171':'var(--tx3)',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.82rem',fontWeight:600}}>
              <MapPin size={14}/>
              {gpsStatus==='idle'&&'Tag GPS location'}
              {gpsStatus==='fetching'&&'Getting location…'}
              {gpsStatus==='got'&&`✓ ${coords.lat?.toFixed(4)}, ${coords.lng?.toFixed(4)}`}
              {gpsStatus==='error'&&'GPS unavailable'}
            </button>
          </div>
        </div>

        <div style={{display:'flex',gap:'0.75rem',paddingBottom:'2rem'}}>
          <button type="button" onClick={()=>navigate(-1)} style={{flex:1,padding:'0.7rem',borderRadius:'0.6rem',border:'1px solid var(--gb)',background:'var(--g2)',color:'var(--tx2)',fontWeight:600,fontSize:'0.88rem',cursor:'pointer'}}>Cancel</button>
          <button type="submit" disabled={submitting} style={{flex:1,padding:'0.7rem',borderRadius:'0.6rem',border:'none',background:'linear-gradient(135deg,#2dd4bf,#0d9488)',color:'#07211e',fontWeight:700,fontSize:'0.88rem',cursor:'pointer',opacity:submitting?0.65:1}}>
            {submitting?'Submitting…':'Submit Expense'}
          </button>
        </div>
      </form>
    </div>
  )
}
