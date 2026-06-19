import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DEMO_DOS, DEMO_SUPPLIERS, DEMO_SERVICE_CENTRES } from '@/lib/demoData'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { DOStatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuthStore } from '@/store/appStore'
import { formatDate, formatINR } from '@/lib/utils'
import { DO_STATUS_LABELS } from '@/types'
import type { DOStatus } from '@/types'
import { FileText, PlusCircle, Search, Weight } from 'lucide-react'
import { toast } from 'sonner'

export const DOListPage = () => {
  const { user } = useAuthStore()
  const canCreate = user?.role === 'admin' || user?.role === 'purchase'
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<DOStatus | ''>('')
  const [form, setForm] = useState({ do_number:'', supplier_id:'', source_service_centre_id:'', expected_collection_date:'' })

  const filtered = DEMO_DOS.filter(d => {
    const matchSearch = !search || d.do_number.toLowerCase().includes(search.toLowerCase()) || d.supplier?.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || d.status === filterStatus
    return matchSearch && matchStatus
  })

  const handleCreate = () => {
    if (!form.do_number || !form.supplier_id) { toast.error('DO Number and Supplier are required'); return }
    toast.success(`DO ${form.do_number} created (demo mode)`)
    setShowModal(false)
    setForm({ do_number:'', supplier_id:'', source_service_centre_id:'', expected_collection_date:'' })
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[--color-ink]">Delivery Orders</h1>
          <p className="text-sm text-[--color-ink-muted] mt-0.5">{DEMO_DOS.length} total orders from suppliers</p>
        </div>
        {canCreate && (
          <Button onClick={()=>setShowModal(true)}><PlusCircle size={15}/>New Delivery Order</Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-ink-faint]" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search DO or supplier…"
            className="pl-9 pr-3 h-9 text-sm rounded-xl border border-[--color-surface-border] bg-white focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary] transition w-60" />
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value as DOStatus | '')}
          className="h-9 px-3 rounded-xl border border-[--color-surface-border] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary] transition">
          <option value="">All Statuses</option>
          {(Object.keys(DO_STATUS_LABELS) as DOStatus[]).map(s=><option key={s} value={s}>{DO_STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {/* Table */}
      <Card padding={false}>
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No delivery orders found" description="Try adjusting filters or create a new DO." />
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr className="bg-[--color-surface-bg] border-b border-[--color-surface-border]">
                  {['DO Number','Supplier','Source SC','Collection Date','Items / Weight','Status',''].map(h=>(
                    <th key={h} className="text-left text-xs font-semibold text-[--color-ink-muted] px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[--color-surface-divider]">
                {filtered.map(do_=>(
                  <tr key={do_.id} className="text-sm hover:bg-[--color-surface-bg] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[--color-ink]">{do_.do_number}</div>
                      <div className="text-xs text-[--color-ink-faint]">{formatDate(do_.created_at)}</div>
                    </td>
                    <td className="px-4 py-3 text-[--color-ink-muted]">{do_.supplier?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-[--color-ink-muted]">{do_.source_service_centre?.name ?? '—'}</td>
                    <td className="px-4 py-3 tabular text-[--color-ink-muted]">{formatDate(do_.expected_collection_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[--color-ink-muted]">
                        <Weight size={13}/>
                        <span>{do_.items.length} item{do_.items.length!==1?'s':''}</span>
                        <span className="text-[--color-ink-faint]">·</span>
                        <span className="tabular">{do_.items.reduce((a,i)=>a+i.weight_mt,0).toFixed(1)} MT</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><DOStatusBadge status={do_.status} /></td>
                    <td className="px-4 py-3">
                      <Link to={`/dos/${do_.id}`} className="text-xs font-medium text-[--color-primary] hover:underline">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal open={showModal} onClose={()=>setShowModal(false)} title="New Delivery Order" size="md">
        <div className="space-y-4">
          <Input label="DO Number *" placeholder="e.g. DO-2026-003" value={form.do_number} onChange={e=>setForm(f=>({...f,do_number:e.target.value}))} />
          <Select label="Supplier *" value={form.supplier_id} onChange={e=>setForm(f=>({...f,supplier_id:e.target.value}))}>
            <option value="">Select supplier…</option>
            {DEMO_SUPPLIERS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Select label="Source Service Centre" value={form.source_service_centre_id} onChange={e=>setForm(f=>({...f,source_service_centre_id:e.target.value}))}>
            <option value="">Select service centre…</option>
            {DEMO_SERVICE_CENTRES.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Input label="Expected Collection Date" type="date" value={form.expected_collection_date} onChange={e=>setForm(f=>({...f,expected_collection_date:e.target.value}))} />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={()=>setShowModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreate}>Create DO</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
