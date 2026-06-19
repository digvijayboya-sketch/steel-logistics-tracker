import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { useDataStore } from '@/store/dataStore'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Camera, MapPin, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { getCoords } from '@/lib/utils'
import type { ExpenseCategory, SettlementMethod } from '@/types'
import { EXPENSE_CATEGORY_LABELS, SETTLEMENT_LABELS } from '@/types'

const uid = () => Math.random().toString(36).slice(2, 10)

export const LogExpensePage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { jobs, profiles, addExpense } = useDataStore()

  const myJobs = jobs.filter(j =>
    j.assigned_agent_id === user?.id &&
    !['delivered', 'cancelled'].includes(j.status)
  )

  const [form, setForm] = useState({
    job_id: myJobs[0]?.id ?? '',
    category: '' as ExpenseCategory | '',
    amount_inr: '',
    payee_description: '',
    settlement_method: 'agent_reimbursable' as SettlementMethod,
  })

  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'got' | 'error'>('idle')
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({})
  const [photoLabel, setPhotoLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const fetchGPS = async () => {
    setGpsStatus('fetching')
    const c = await getCoords()
    if (c.lat) { setCoords(c); setGpsStatus('got') }
    else setGpsStatus('error')
  }

  const handlePhotoSimulate = () => {
    setPhotoLabel('photo_' + Date.now() + '.jpg')
    toast.success('Photo captured (simulated)')
  }

  const validate = () => {
    if (!form.job_id) return 'Select a job'
    if (!form.category) return 'Select a category'
    const amt = parseFloat(form.amount_inr)
    if (isNaN(amt) || amt <= 0) return 'Enter a valid amount'
    if (!form.payee_description.trim()) return 'Payee description is required'
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { toast.error(err); return }
    setSubmitting(true)

    const agent = profiles.find(p => p.id === user?.id)
    addExpense({
      id: uid(),
      job_id: form.job_id,
      category: form.category as ExpenseCategory,
      amount_inr: parseFloat(form.amount_inr),
      payee_description: form.payee_description.trim(),
      settlement_method: form.settlement_method,
      status: 'pending',
      photo_url: photoLabel || undefined,
      gps_lat: coords.lat,
      gps_lng: coords.lng,
      logged_by: user?.id ?? '',
      created_at: new Date().toISOString(),
      logged_by_profile: agent,
    })

    toast.success('Expense logged — pending manager approval')
    setTimeout(() => navigate('/expenses'), 400)
  }

  if (user?.role !== 'agent') {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[--color-ink-muted]">Only delivery agents can log field expenses.</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate('/expenses')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[--color-surface-bg] transition-colors">
          <ArrowLeft size={16} className="text-[--color-ink-muted]" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-[--color-ink]">Log Expense</h1>
          <p className="text-xs text-[--color-ink-muted]">Cash payment made in the field</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Job */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Receipt size={14} className="text-[--color-primary]" />
            <span className="text-sm font-semibold text-[--color-ink]">Expense Details</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Job *</label>
              <select
                value={form.job_id}
                onChange={e => setField('job_id', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-[--color-border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
              >
                <option value="">Select active job…</option>
                {myJobs.map(j => <option key={j.id} value={j.id}>{j.job_number} — {j.customer_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Category *</label>
              <select
                value={form.category}
                onChange={e => setField('category', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-[--color-border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
              >
                <option value="">Select category…</option>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Amount (₹) *</label>
              <input
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                value={form.amount_inr}
                onChange={e => setField('amount_inr', e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 text-lg font-bold border border-[--color-border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Payee / Description *</label>
              <input
                type="text"
                value={form.payee_description}
                onChange={e => setField('payee_description', e.target.value)}
                placeholder="e.g. SC worker – loading tip"
                className="w-full px-3 py-2.5 text-sm border border-[--color-border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Settlement Method</label>
              <div className="grid grid-cols-1 gap-1.5">
                {(Object.entries(SETTLEMENT_LABELS) as [SettlementMethod, string][]).map(([k, v]) => (
                  <label key={k} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors
                    ${form.settlement_method === k
                      ? 'border-[--color-primary] bg-[--color-primary]/5'
                      : 'border-[--color-border] hover:bg-[--color-surface-bg]'}`}>
                    <input
                      type="radio"
                      name="settlement"
                      value={k}
                      checked={form.settlement_method === k}
                      onChange={() => setField('settlement_method', k)}
                      className="accent-[--color-primary]"
                    />
                    <span className="text-xs text-[--color-ink]">{v}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Photo & GPS */}
        <Card>
          <span className="text-sm font-semibold text-[--color-ink] block mb-3">Evidence & Location</span>
          <div className="space-y-3">
            {/* Photo */}
            <button
              type="button"
              onClick={handlePhotoSimulate}
              className={`w-full flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed transition-colors
                ${photoLabel
                  ? 'border-green-400 bg-green-50'
                  : 'border-[--color-border] hover:border-[--color-primary] hover:bg-[--color-primary]/5'}`}
            >
              <Camera size={20} className={photoLabel ? 'text-green-600' : 'text-[--color-ink-faint]'} />
              <span className="text-xs font-medium text-[--color-ink-muted]">
                {photoLabel ? `✓ ${photoLabel}` : 'Tap to attach photo (receipt / material)'}
              </span>
            </button>

            {/* GPS */}
            <button
              type="button"
              onClick={fetchGPS}
              disabled={gpsStatus === 'fetching'}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors
                ${gpsStatus === 'got'
                  ? 'border-green-400 bg-green-50 text-green-700'
                  : gpsStatus === 'error'
                  ? 'border-red-300 bg-red-50 text-red-600'
                  : 'border-[--color-border] hover:bg-[--color-surface-bg] text-[--color-ink-muted]'}`}
            >
              <MapPin size={14} />
              <span className="text-xs font-medium">
                {gpsStatus === 'idle' && 'Tag GPS location'}
                {gpsStatus === 'fetching' && 'Getting location…'}
                {gpsStatus === 'got' && `${coords.lat?.toFixed(4)}, ${coords.lng?.toFixed(4)}`}
                {gpsStatus === 'error' && 'GPS unavailable — logged without coordinates'}
              </span>
            </button>
          </div>
        </Card>

        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 py-3.5 text-sm font-semibold rounded-xl border border-[--color-border] text-[--color-ink-muted] hover:bg-[--color-surface-bg] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 py-3.5 text-sm font-semibold rounded-xl bg-[--color-primary] text-white hover:bg-[--color-primary-hover] transition-colors disabled:opacity-50">
            {submitting ? 'Submitting…' : 'Submit Expense'}
          </button>
        </div>
      </form>
    </div>
  )
}
