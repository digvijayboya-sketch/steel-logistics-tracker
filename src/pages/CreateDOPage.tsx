import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { useDataStore } from '@/store/dataStore'
import { ArrowLeft, Plus, Trash2, FileText, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import type { DeliveryOrderItem } from '@/types'

const uid = () => Math.random().toString(36).slice(2, 10)
const COIL_GRADES = [
  'CRCA IS513 D','CRCA IS513 DD','HRPO SAE1006','HRPO SAE1008',
  'GP Zero Spangle','GP Regular Spangle','HR IS2062 E250','HR IS2062 E350',
]

const inp: React.CSSProperties = {
  width:'100%', padding:'0.55rem 0.75rem', borderRadius:'0.55rem',
  border:'1px solid var(--input-border)', background:'var(--input-bg)',
  color:'var(--tx1)', fontSize:'0.875rem', outline:'none',
  boxSizing:'border-box' as const,
}
const lbl: React.CSSProperties = {
  display:'block', fontSize:'0.70rem', fontWeight:700,
  color:'var(--tx4)', textTransform:'uppercase' as const,
  letterSpacing:'0.07em', marginBottom:4,
}

export const CreateDOPage = () => {
  const navigate  = useNavigate()
  const { user }  = useAuthStore()
  const { suppliers, serviceCentres, fetchLookups, createDO } = useDataStore()

  useEffect(() => { fetchLookups() }, [])

  const [form, setForm] = useState({
    do_number: `DO-2026-${String(Math.floor(Math.random()*900)+100)}`,
    supplier_id: '',
    source_service_centre_id: '',
    expected_collection_date: '',
  })
  const [items, setItems] = useState<Omit<DeliveryOrderItem,'id'>[]>([
    { coil_grade:'', thickness_mm:0, width_mm:0, quantity:1, weight_mt:0 },
  ])
  const [submitting, setSubmitting] = useState(false)

  const setField = (k:string,v:string) => setForm(f=>({...f,[k]:v}))
  const setItem  = (i:number,k:string,v:string|number) =>
    setItems(p=>p.map((it,idx)=>idx===i?{...it,[k]:v}:it))
  const addItem    = () => setItems(p=>[...p,{coil_grade:'',thickness_mm:0,width_mm:0,quantity:1,weight_mt:0}])
  const removeItem = (i:number) => setItems(p=>p.filter((_,idx)=>idx!==i))

  const canCreate = user?.role==='admin'||user?.role==='purchase'||user?.role==='planner'||(user?.role as string)==='manager'
  if (!canCreate) return (
    <div style={{padding:'3rem',textAlign:'center',color:'var(--tx3)'}}>
      Only Purchase / Planner / Admin can create Delivery Orders.
    </div>
  )

  const validate = () => {
    if (!form.do_number.trim()) return 'DO Number is required'
    if (!form.supplier_id) return 'Select a supplier'
    if (!form.source_service_centre_id) return 'Select a source service centre'
    if (!form.expected_collection_date) return 'Expected collection date is required'
    if (items.length===0) return 'Add at least one item'
    for (const it of items) {
      if (!it.coil_grade) return 'Coil grade required for all items'
      if (it.thickness_mm<=0) return 'Thickness must be > 0'
      if (it.width_mm<=0) return 'Width must be > 0'
      if (it.weight_mt<=0) return 'Weight must be > 0'
    }
    return null
  }

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { toast.error(err); return }
    setSubmitting(true)
    try {
      await createDO({
        do_number: form.do_number.trim(),
        supplier_id: form.supplier_id,
        source_service_centre_id: form.source_service_centre_id,
        expected_collection_date: form.expected_collection_date,
        status: 'draft',
        items: items.map(it=>({...it,id:uid()})),
        created_by: user?.id??'',
      } as any)
      toast.success(`DO ${form.do_number} created`)
      navigate('/dos')
    } catch(e:any) {
      toast.error(e.message??'Failed to create DO')
    } finally { setSubmitting(false) }
  }

  const card: React.CSSProperties = {
    background:'var(--card-bg)', border:'1px solid var(--card-border)',
    borderRadius:'0.85rem', padding:'1.25rem', boxShadow:'var(--sh-card)', marginBottom:'1rem',
  }

  return (
    <div style={{minHeight:'100%',padding:'1.5rem 1.75rem',maxWidth:720,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1.5rem'}}>
        <button onClick={()=>navigate('/dos')} style={{width:34,height:34,borderRadius:'0.5rem',border:'1px solid var(--gb)',background:'var(--g2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'var(--tx3)'}}>
          <ArrowLeft size={15}/>
        </button>
        <div>
          <h1 style={{color:'var(--tx1)',fontSize:'1.2rem',fontWeight:800,letterSpacing:'-0.02em',margin:0}}>New Delivery Order</h1>
          <p style={{color:'var(--tx4)',fontSize:'0.78rem',margin:0}}>Create a supplier DO and add coil items</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={card}>
          <div style={{display:'flex',alignItems:'center',gap:'0.4rem',marginBottom:'1rem'}}>
            <FileText size={14} style={{color:'var(--accent)'}}/>
            <span style={{fontWeight:700,fontSize:'0.88rem',color:'var(--tx1)'}}>DO Header</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            <div style={{gridColumn:'1/-1'}}>
              <label style={lbl}>DO Number *</label>
              <input style={inp} value={form.do_number} onChange={e=>setField('do_number',e.target.value)} placeholder="DO-2026-XXX"/>
            </div>
            <div>
              <label style={lbl}>Supplier *</label>
              <select style={inp} value={form.supplier_id} onChange={e=>setField('supplier_id',e.target.value)}>
                <option value="">Select supplier…</option>
                {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Source Service Centre *</label>
              <select style={inp} value={form.source_service_centre_id} onChange={e=>setField('source_service_centre_id',e.target.value)}>
                <option value="">Select SC…</option>
                {serviceCentres.map(sc=><option key={sc.id} value={sc.id}>{sc.name} – {sc.city}</option>)}
              </select>
            </div>
            <div style={{gridColumn:'1/-1'}}>
              <label style={lbl}>Expected Collection Date *</label>
              <input style={inp} type="date" value={form.expected_collection_date} onChange={e=>setField('expected_collection_date',e.target.value)}/>
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
            <span style={{fontWeight:700,fontSize:'0.88rem',color:'var(--tx1)'}}>Coil Items ({items.length})</span>
            <button type="button" onClick={addItem} style={{display:'flex',alignItems:'center',gap:'0.3rem',padding:'0.35rem 0.75rem',borderRadius:'0.45rem',border:'none',background:'var(--accent-dim)',color:'var(--accent)',fontWeight:700,fontSize:'0.78rem',cursor:'pointer'}}>
              <Plus size={12}/> Add Item
            </button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            {items.map((it,i)=>(
              <div key={i} style={{padding:'0.85rem',borderRadius:'0.65rem',border:'1px solid var(--gb)',background:'var(--g1)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.65rem'}}>
                  <span style={{fontSize:'0.75rem',fontWeight:700,color:'var(--tx3)'}}>Item {i+1}</span>
                  {items.length>1&&(
                    <button type="button" onClick={()=>removeItem(i)} style={{width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'0.35rem',border:'1px solid rgba(248,113,113,0.3)',background:'rgba(248,113,113,0.1)',color:'#f87171',cursor:'pointer'}}>
                      <Trash2 size={11}/>
                    </button>
                  )}
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.5rem'}}>
                  <div style={{gridColumn:'1/-1'}}>
                    <label style={lbl}>Coil Grade *</label>
                    <select style={inp} value={it.coil_grade} onChange={e=>setItem(i,'coil_grade',e.target.value)}>
                      <option value="">Select grade…</option>
                      {COIL_GRADES.map(g=><option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  {([['Thickness (mm)','thickness_mm','0.1'],['Width (mm)','width_mm','1'],['Quantity','quantity','1'],['Weight (MT)','weight_mt','0.1']] as [string,string,string][]).map(([label,key,step])=>(
                    <div key={key}>
                      <label style={lbl}>{label} *</label>
                      <input style={inp} type="number" step={step} min="0"
                        value={(it as any)[key]}
                        onChange={e=>setItem(i,key,parseFloat(e.target.value)||0)}/>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'flex',gap:'0.75rem',paddingBottom:'2rem'}}>
          <button type="button" onClick={()=>navigate('/dos')} style={{flex:1,padding:'0.7rem',borderRadius:'0.6rem',border:'1px solid var(--gb)',background:'var(--g2)',color:'var(--tx2)',fontWeight:600,fontSize:'0.88rem',cursor:'pointer'}}>Cancel</button>
          <button type="submit" disabled={submitting} style={{flex:1,padding:'0.7rem',borderRadius:'0.6rem',border:'none',background:'linear-gradient(135deg,#2dd4bf,#0d9488)',color:'#07211e',fontWeight:700,fontSize:'0.88rem',cursor:'pointer',opacity:submitting?0.65:1}}>
            {submitting?'Creating…':'Create DO'}
          </button>
        </div>
      </form>
    </div>
  )
}
