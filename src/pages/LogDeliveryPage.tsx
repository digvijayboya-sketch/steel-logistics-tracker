import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { useDataStore } from '@/store/dataStore'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Camera, MapPin, Truck, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { getCoords } from '@/lib/utils'
import type { DeliveryStatus } from '@/types'

const uid = () => Math.random().toString(36).slice(2, 10)

export const LogDeliveryPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { jobs, addDelivery } = useDataStore()

  const myJobs = jobs.filter(j =>
    j.assigned_agent_id === user?.id &&
    !['delivered', 'cancelled'].includes(j.status)
  )

  const [form, setForm] = useState({
    job_id: myJobs[0]?.id ?? '',
    vehicle_number: '',
    delivery_address: '',
    delivery_status: 'delivered' as DeliveryStatus,
    destination_changed: false,
    change_reason: '',
    authorised_by_office: false,
  })

  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'got' | 'error'>('idle')
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({})
  const [photoLabel, setPhotoLabel] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const setField = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const selectedJob = jobs.find(j => j.id === form.job_id)

  const fetchGPS = async () => {
    setGpsStatus('fetching')
    const c = await getCoords()
    if (c.lat) { setCoords(c); setGpsStatus('got') }
    else setGpsStatus('error')
  }

  const validate = () => {
    if (!form.job_id) return 'Select a job'
    if (!form.vehicle_number.trim()) return 'Vehicle number is required'
    if (!form.delivery_address.trim()) return 'Delivery address is required'
    if (form.destination_changed && !form.change_reason.trim()) return 'Enter reason for destination change'
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { toast.error(err); return }
    setSubmitting(true)

    addDelivery({
      id: uid(),
      job_id: form.job_id,
      customer_name: selectedJob?.customer_name ?? '',
      delivery_address: form.delivery_address.trim(),
      vehicle_number: form.vehicle_number.trim().toUpperCase(),
      delivered_at: new Date().toISOString(),
      delivery_status: form.delivery_status,
      unloaded_photo_url: photoLabel || undefined,
      final_lat: coords.lat,
      final_lng: coords.lng,
      destination_changed: form.destination_changed,
      old_destination: form.destination_changed ? selectedJob?.delivery_destination : undefined,
      new_destination: form.destination_changed ? form.delivery_address.trim() : undefined,
      change_reason: form.destination_changed ? form.change_reason.trim() : undefined,
      authorised_by_office: form.destination_changed ? form.authorised_by_office : undefined,
      created_by: user?.id ?? '',
      created_at: new Date().toISOString(),
    })

    toast.success('Delivery logged successfully')
    setTimeout(() => navigate('/deliveries'), 400)
  }

  if (user?.role !== 'agent') {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[--color-ink-muted]">Only delivery agents can log deliveries.</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate('/deliveries')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[--color-surface-bg] transition-colors">
          <ArrowLeft size={16} className="text-[--color-ink-muted]" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-[--color-ink]">Log Delivery</h1>
          <p className="text-xs text-[--color-ink-muted]">Record completed delivery to customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Truck size={14} className="text-[--color-primary]" />
            <span className="text-sm font-semibold text-[--color-ink]">Delivery Details</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Job *</label>
              <select
                value={form.job_id}
                onChange={e => setField('job_id', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-[--color-border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
              >
                <option value="">Select job…</option>
                {myJobs.map(j => <option key={j.id} value={j.id}>{j.job_number} — {j.customer_name}</option>)}
              </select>
            </div>

            {selectedJob && (
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-800 space-y-0.5">
                <div><span className="font-semibold">Planned destination:</span> {selectedJob.delivery_destination}</div>
                <div><span className="font-semibold">Customer:</span> {selectedJob.customer_name}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Vehicle Number *</label>
              <input
                type="text"
                value={form.vehicle_number}
                onChange={e => setField('vehicle_number', e.target.value)}
                placeholder="e.g. MH12AB1234"
                className="w-full px-3 py-2.5 text-sm font-mono border border-[--color-border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Actual Delivery Address *</label>
              <textarea
                rows={2}
                value={form.delivery_address}
                onChange={e => setField('delivery_address', e.target.value)}
                placeholder="Full address where material was unloaded"
                className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Delivery Status</label>
              <div className="grid grid-cols-2 gap-2">
                {(['delivered', 'partial'] as DeliveryStatus[]).map(s => (
                  <label key={s} className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-colors
                    ${form.delivery_status === s
                      ? 'border-[--color-primary] bg-[--color-primary]/5'
                      : 'border-[--color-border] hover:bg-[--color-surface-bg]'}`}>
                    <input
                      type="radio"
                      name="delivery_status"
                      value={s}
                      checked={form.delivery_status === s}
                      onChange={() => setField('delivery_status', s)}
                      className="accent-[--color-primary]"
                    />
                    <span className="text-xs text-[--color-ink] capitalize">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Destination Change */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-amber-500" />
            <span className="text-sm font-semibold text-[--color-ink]">Destination Change</span>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.destination_changed}
              onChange={e => setField('destination_changed', e.target.checked)}
              className="w-4 h-4 rounded accent-[--color-primary]"
            />
            <span className="text-sm text-[--color-ink]">Delivery destination was changed from plan</span>
          </label>
          {form.destination_changed && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Reason for Change *</label>
                <textarea
                  rows={2}
                  value={form.change_reason}
                  onChange={e => setField('change_reason', e.target.value)}
                  placeholder="Explain why the destination changed…"
                  className="w-full px-3 py-2 text-sm border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/30 bg-amber-50 resize-none"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.authorised_by_office}
                  onChange={e => setField('authorised_by_office', e.target.checked)}
                  className="w-4 h-4 rounded accent-[--color-primary]"
                />
                <span className="text-sm text-[--color-ink]">Authorised by office (phone/WhatsApp)</span>
              </label>
              {!form.authorised_by_office && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  ⚠️ This will be flagged as a self-authorised change — office will be notified.
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Photo & GPS */}
        <Card>
          <span className="text-sm font-semibold text-[--color-ink] block mb-3">Evidence</span>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => { setPhotoLabel('unload_' + Date.now() + '.jpg'); toast.success('Photo captured') }}
              className={`w-full flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed transition-colors
                ${photoLabel
                  ? 'border-green-400 bg-green-50'
                  : 'border-[--color-border] hover:border-[--color-primary] hover:bg-[--color-primary]/5'}`}
            >
              <Camera size={20} className={photoLabel ? 'text-green-600' : 'text-[--color-ink-faint]'} />
              <span className="text-xs font-medium text-[--color-ink-muted]">
                {photoLabel ? `✓ ${photoLabel}` : 'Photo of unloaded material at customer site'}
              </span>
            </button>

            <button
              type="button"
              onClick={fetchGPS}
              disabled={gpsStatus === 'fetching'}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors
                ${gpsStatus === 'got'
                  ? 'border-green-400 bg-green-50 text-green-700'
                  : 'border-[--color-border] hover:bg-[--color-surface-bg] text-[--color-ink-muted]'}`}
            >
              <MapPin size={16} />
              <span className="text-sm font-medium">
                {gpsStatus === 'idle' && 'Tag delivery GPS location'}
                {gpsStatus === 'fetching' && 'Getting GPS…'}
                {gpsStatus === 'got' && `✓ ${coords.lat?.toFixed(4)}, ${coords.lng?.toFixed(4)}`}
                {gpsStatus === 'error' && 'GPS unavailable'}
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
            {submitting ? 'Logging…' : 'Log Delivery'}
          </button>
        </div>
      </form>
    </div>
  )
}
