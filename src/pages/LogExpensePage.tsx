import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { useDataStore } from '@/store/dataStore'
import { ArrowLeft, Camera, MapPin, Receipt, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { getCoords } from '@/lib/utils'
import { apiUploadPhoto } from '@/lib/api'
import type { ExpenseCategory, SettlementMethod } from '@/types'
import { SETTLEMENT_LABELS } from '@/types'

const inp: React.CSSProperties = {
  width:'100%', padding:'0.55rem 0.75rem', borderRadius:'0.55rem',
  border:'1px solid var(--input-border)', background:'var(--input-bg)',
  color:'var(--tx1)', fontSize:'0.875rem', outline:'none', boxSizing:'border-box' as const,
}
const lbl: React.CSSProperties = {
  display:'block', fontSize:'0.70rem', fontWeight:700,
  color:'var(--tx4)', textTransform:'uppercase' as const, letterSpacing:'0.07em', marginBottom:4,
}

const CATEGORY_TILES: { value: ExpenseCategory; label: string }[] = [
  { value: 'fuel',    label: 'Fuel' },
  { value: 'toll',    label: 'Toll' },
  { value: 'lodging', label: 'Lodging' },
  { value: 'labour',  label: 'Labour' },
  { value: 'repair',  label: 'Repair' },
]

export const LogExpensePage = () => {
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const { user } = useAuthStore()
  const { jobs, profiles, fetchJobs, fetchLookups, addExpense } = useDataStore()

  useEffect(()=>{ fetchJobs(); fetchLookups() },[])

  const isAdmin = user?.role==='admin'||(user?.role as string)==='manager'

  // Admin sees all active jobs; agents see only their own
  const activeJobs = jobs.filter(j=>!['delivered','cancelled'].includes(j.status))
  const myJobs     = isAdmin ? activeJobs : activeJobs.filter(j=>j.assigned_agent_id===user?.id)

  const [form, setForm] = useState({
    job_id: sp.get('job') ?? '',
    logged_as: user?.id??'',   // admin can log on behalf of any agent
    category: '' as ExpenseCategory|'',
    amount_inr: '',
    date: new Date().toISOString().slice(0, 10),
    payee_description: '',
    settlement_method: 'agent_reimbursable' as SettlementMethod,
  })
  const [gpsStatus, setGpsStatus] = useState<'idle'|'fetching'|'got'|'error'>('idle')
  const [coords, setCoords]       = useState<{lat?:number;lng?:number}>({})
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setField = (k:string,v:string)=>setForm(f=>({...f,[k]:v}))

  const fetchGPS = async () => {
    setGpsStatus('fetching')
    const c = await getCoords()
    if (c.lat) { setCoords(c); setGpsStatus('got') } else setGpsStatus('error')
  }
  useEffect(() => { fetchGPS() }, [])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }
  const clearPhoto = () => {
    setPhotoFile(null)
    setPhotoPreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const selectedJob = jobs.find(j=>j.id===form.job_id)

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    if (!form.job_id) { toast.error('Select a job'); return }
    if (!form.category) { toast.error('Select a category'); return }
    const amt = parseFloat(form.amount_inr)
    if (isNaN(amt)||amt<=0) { toast.error('Enter a valid amount'); return }
    if (!form.payee_description.trim()) { toast.error('Payee description required'); return }
    if (!photoFile) { toast.error('Receipt photo is required'); return }
    setSubmitting(true)
    try {
      const loggedById = isAdmin&&form.logged_as ? form.logged_as : user?.id??''
      const ext = photoFile.name.split('.').pop() || 'jpg'
      const path = `${loggedById}/${form.job_id}/${Date.now()}.${ext}`
      const photoUrl = await apiUploadPhoto('expense-photos', path, photoFile)
      await addExpense({
        job_id: form.job_id,
        category: form.category as ExpenseCategory,
        amount_inr: amt,
        payee_description: form.payee_description.trim(),
        settlement_method: form.settlement_method,
        photo_url: photoUrl,
        gps_lat: coords.lat,
        gps_lng: coords.lng,
        logged_by: loggedById,
        created_at: new Date(form.date).toISOString(),
      })
      toast.success('Expense logged — pending approval')
      navigate('/expenses')
    } catch(e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to log expense')
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
            {selectedJob && (
              <div style={{padding:'0.6rem 0.75rem',borderRadius:'0.5rem',background:'var(--accent-dim)',border:'1px solid rgba(45,212,191,0.2)',fontSize:'0.78rem',color:'var(--tx2)'}}>
                <span style={{fontWeight:700,color:'var(--accent)'}}>DO reference:</span> {selectedJob.do?.do_number ?? '—'}
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
              <label style={lbl}>Category *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '0.5rem' }}>
                {CATEGORY_TILES.map(t => (
                  <button key={t.value} type="button" onClick={()=>setField('category', t.value)}
                    style={{ padding: '0.65rem 0.5rem', borderRadius: '0.55rem', border: `1px solid ${form.category===t.value?'var(--accent)':'var(--gb)'}`, background: form.category===t.value?'var(--accent-dim)':'var(--g2)', color: form.category===t.value?'var(--accent)':'var(--tx2)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.65rem'}}>
              <div>
                <label style={lbl}>Amount (₹) *</label>
                <input style={{...inp,fontSize:'1.15rem',fontWeight:700}} type="number" inputMode="numeric" min="0" step="1"
                  value={form.amount_inr} onChange={e=>setField('amount_inr',e.target.value)} placeholder="0"/>
              </div>
              <div>
                <label style={lbl}>Date *</label>
                <input style={inp} type="date" value={form.date} max={new Date().toISOString().slice(0,10)} onChange={e=>setField('date',e.target.value)}/>
              </div>
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
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} style={{ display: 'none' }} id="expense-photo-input" />
            {photoPreview ? (
              <div style={{ position: 'relative' }}>
                <img src={photoPreview} alt="Receipt preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: '0.65rem', border: '1px solid #34d399' }} />
                <button type="button" onClick={clearPhoto}
                  style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label htmlFor="expense-photo-input"
                style={{width:'100%',padding:'1.25rem',borderRadius:'0.65rem',border:'2px dashed var(--gb)',background:'var(--g1)',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.4rem'}}>
                <Camera size={20} style={{color:'var(--tx4)'}}/>
                <span style={{fontSize:'0.78rem',color:'var(--tx4)',fontWeight:600}}>Tap to attach receipt photo *</span>
              </label>
            )}
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
          <button type="submit" disabled={submitting} style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'0.4rem',padding:'0.7rem',borderRadius:'0.6rem',border:'none',background:'linear-gradient(135deg,#2dd4bf,#0d9488)',color:'#07211e',fontWeight:700,fontSize:'0.88rem',cursor:'pointer',opacity:submitting?0.65:1}}>
            {submitting && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
            {submitting?'Uploading…':'Submit Expense'}
          </button>
        </div>
      </form>
    </div>
  )
}
