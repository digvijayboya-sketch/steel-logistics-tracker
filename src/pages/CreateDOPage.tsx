import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { useDataStore } from '@/store/dataStore'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Plus, Trash2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import type { DeliveryOrderItem } from '@/types'

const uid = () => Math.random().toString(36).slice(2, 10)

const COIL_GRADES = [
  'CRCA IS513 D', 'CRCA IS513 DD', 'HRPO SAE1006', 'HRPO SAE1008',
  'GP Zero Spangle', 'GP Regular Spangle', 'HR IS2062 E250', 'HR IS2062 E350',
]

export const CreateDOPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { suppliers, serviceCentres, addDO } = useDataStore()

  const [form, setForm] = useState({
    do_number: `DO-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
    supplier_id: '',
    source_service_centre_id: '',
    expected_collection_date: '',
  })

  const [items, setItems] = useState<Omit<DeliveryOrderItem, 'id'>[]>([
    { coil_grade: '', thickness_mm: 0, width_mm: 0, quantity: 1, weight_mt: 0 },
  ])

  const [submitting, setSubmitting] = useState(false)

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const setItem = (i: number, k: string, v: string | number) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item))

  const addItem = () => setItems(prev => [
    ...prev,
    { coil_grade: '', thickness_mm: 0, width_mm: 0, quantity: 1, weight_mt: 0 },
  ])

  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const validate = () => {
    if (!form.do_number.trim()) return 'DO Number is required'
    if (!form.supplier_id) return 'Select a supplier'
    if (!form.source_service_centre_id) return 'Select a source service centre'
    if (!form.expected_collection_date) return 'Expected collection date is required'
    if (items.length === 0) return 'Add at least one item'
    for (const item of items) {
      if (!item.coil_grade) return 'Coil grade is required for all items'
      if (item.thickness_mm <= 0) return 'Thickness must be > 0'
      if (item.width_mm <= 0) return 'Width must be > 0'
      if (item.weight_mt <= 0) return 'Weight must be > 0'
    }
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { toast.error(err); return }
    setSubmitting(true)

    const supplier = suppliers.find(s => s.id === form.supplier_id)
    const sc = serviceCentres.find(s => s.id === form.source_service_centre_id)

    addDO({
      id: uid(),
      do_number: form.do_number.trim(),
      supplier_id: form.supplier_id,
      source_service_centre_id: form.source_service_centre_id,
      expected_collection_date: form.expected_collection_date,
      status: 'draft',
      items: items.map(item => ({ ...item, id: uid() })),
      created_at: new Date().toISOString(),
      supplier,
      source_service_centre: sc,
    })

    toast.success(`DO ${form.do_number} created successfully`)
    setTimeout(() => navigate('/dos'), 300)
  }

  if (user?.role !== 'purchase' && user?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[--color-ink-muted]">Only the Purchase team can create Delivery Orders.</p>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dos')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[--color-surface-bg] transition-colors">
          <ArrowLeft size={16} className="text-[--color-ink-muted]" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[--color-ink]">New Delivery Order</h1>
          <p className="text-xs text-[--color-ink-muted]">Create a new DO from supplier</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* DO Header */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={15} className="text-[--color-primary]" />
            <span className="text-sm font-semibold text-[--color-ink]">DO Details</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">DO Number *</label>
              <input
                type="text"
                value={form.do_number}
                onChange={e => setField('do_number', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary] bg-white"
                placeholder="e.g. DO-2026-045"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Supplier *</label>
              <select
                value={form.supplier_id}
                onChange={e => setField('supplier_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary] bg-white"
              >
                <option value="">Select supplier…</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Source Service Centre *</label>
              <select
                value={form.source_service_centre_id}
                onChange={e => setField('source_service_centre_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary] bg-white"
              >
                <option value="">Select service centre…</option>
                {serviceCentres.map(sc => <option key={sc.id} value={sc.id}>{sc.name} – {sc.city}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Expected Collection Date *</label>
              <input
                type="date"
                value={form.expected_collection_date}
                onChange={e => setField('expected_collection_date', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary] bg-white"
              />
            </div>
          </div>
        </Card>

        {/* Items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-[--color-ink]">Coil Items</span>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[--color-primary]/10 text-[--color-primary] hover:bg-[--color-primary]/20 transition-colors"
            >
              <Plus size={12} /> Add Item
            </button>
          </div>
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={i} className="p-3 rounded-xl border border-[--color-border] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[--color-ink-muted]">Item {i + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-red-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-[--color-ink-faint] mb-1">Coil Grade *</label>
                  <select
                    value={item.coil_grade}
                    onChange={e => setItem(i, 'coil_grade', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
                  >
                    <option value="">Select grade…</option>
                    {COIL_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Thickness (mm)', key: 'thickness_mm', step: '0.1' },
                    { label: 'Width (mm)', key: 'width_mm', step: '1' },
                    { label: 'Quantity', key: 'quantity', step: '1' },
                    { label: 'Weight (MT)', key: 'weight_mt', step: '0.1' },
                  ].map(({ label, key, step }) => (
                    <div key={key}>
                      <label className="block text-xs text-[--color-ink-faint] mb-1">{label} *</label>
                      <input
                        type="number"
                        step={step}
                        min="0"
                        value={(item as Record<string, number | string>)[key]}
                        onChange={e => setItem(i, key, parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => navigate('/dos')}
            className="flex-1 py-3 text-sm font-semibold rounded-xl border border-[--color-border] text-[--color-ink-muted] hover:bg-[--color-surface-bg] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 text-sm font-semibold rounded-xl bg-[--color-primary] text-white hover:bg-[--color-primary-hover] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Creating…' : 'Create DO'}
          </button>
        </div>
      </form>
    </div>
  )
}
