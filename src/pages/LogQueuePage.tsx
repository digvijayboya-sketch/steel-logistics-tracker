import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { useDataStore } from '@/store/dataStore'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Clock, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { getCoords } from '@/lib/utils'
import type { ServiceType } from '@/types'
import { SERVICE_TYPE_LABELS } from '@/types'

const uid = () => Math.random().toString(36).slice(2, 10)

export const LogQueuePage = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { jobs, serviceCentres, addQueueUpdate } = useDataStore()

  const myJobs = jobs.filter(j =>
    j.assigned_agent_id === user?.id &&
    !['delivered', 'cancelled'].includes(j.status)
  )

  const [form, setForm] = useState({
    job_id: myJobs[0]?.id ?? '',
    service_centre_id: '',
    service_type: '' as ServiceType | '',
    queue_number: '',
    estimated_processing_minutes: '',
    notes: '',
  })

  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'got' | 'error'>('idle')
  const [submitting, setSubmitting] = useState(false)

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const fetchGPS = async () => {
    setGpsStatus('fetching')
    const c = await getCoords()
    setGpsStatus(c.lat ? 'got' : 'error')
  }

  const validate = () => {
    if (!form.job_id) return 'Select a job'
    if (!form.service_centre_id) return 'Select a service centre'
    if (!form.service_type) return 'Select service type'
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { toast.error(err); return }
    setSubmitting(true)

    const sc = serviceCentres.find(s => s.id === form.service_centre_id)
    addQueueUpdate({
      id: uid(),
      job_id: form.job_id,
      service_centre_id: form.service_centre_id,
      service_type: form.service_type as ServiceType,
      queue_number: form.queue_number || undefined,
      checkin_time: new Date().toISOString(),
      estimated_processing_minutes: form.estimated_processing_minutes
        ? parseInt(form.estimated_processing_minutes)
        : undefined,
      notes: form.notes || undefined,
      logged_by: user?.id ?? '',
      created_at: new Date().toISOString(),
      service_centre: sc,
    })

    toast.success('Checked in at service centre')
    setTimeout(() => navigate('/queue'), 400)
  }

  if (user?.role !== 'agent') {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-[--color-ink-muted]">Only delivery agents can log queue check-ins.</p>
      </div>
    )
  }

  const selectedJob = jobs.find(j => j.id === form.job_id)

  return (
    <div className="p-4 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate('/queue')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[--color-surface-bg] transition-colors">
          <ArrowLeft size={16} className="text-[--color-ink-muted]" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-[--color-ink]">Check In at Service Centre</h1>
          <p className="text-xs text-[--color-ink-muted]">Log your queue position and service type</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-[--color-primary]" />
            <span className="text-sm font-semibold text-[--color-ink]">Check-In Details</span>
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
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-800">
                <span className="font-semibold">Planned SC:</span> {selectedJob.do?.source_service_centre?.name ?? '—'}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Service Centre *</label>
              <select
                value={form.service_centre_id}
                onChange={e => setField('service_centre_id', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-[--color-border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
              >
                <option value="">Select SC…</option>
                {serviceCentres.map(sc => <option key={sc.id} value={sc.id}>{sc.name} – {sc.city}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Service Type *</label>
              <select
                value={form.service_type}
                onChange={e => setField('service_type', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-[--color-border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
              >
                <option value="">Select type…</option>
                {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Queue Number</label>
                <input
                  type="text"
                  value={form.queue_number}
                  onChange={e => setField('queue_number', e.target.value)}
                  placeholder="e.g. Q-14"
                  className="w-full px-3 py-2.5 text-sm border border-[--color-border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Est. Time (min)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.estimated_processing_minutes}
                  onChange={e => setField('estimated_processing_minutes', e.target.value)}
                  placeholder="e.g. 120"
                  className="w-full px-3 py-2.5 text-sm border border-[--color-border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[--color-ink-muted] mb-1">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={e => setField('notes', e.target.value)}
                placeholder="Any remarks (delays, issues, conditions)…"
                className="w-full px-3 py-2 text-sm border border-[--color-border] rounded-xl focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 bg-white resize-none"
              />
            </div>
          </div>
        </Card>

        {/* GPS tag */}
        <Card>
          <span className="text-sm font-semibold text-[--color-ink] block mb-3">Location Tag</span>
          <button
            type="button"
            onClick={fetchGPS}
            disabled={gpsStatus === 'fetching'}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors
              ${gpsStatus === 'got'
                ? 'border-green-400 bg-green-50 text-green-700'
                : gpsStatus === 'error'
                ? 'border-red-300 bg-red-50 text-red-600'
                : 'border-[--color-border] hover:bg-[--color-surface-bg] text-[--color-ink-muted]'}`}
          >
            <MapPin size={16} />
            <span className="text-sm font-medium">
              {gpsStatus === 'idle' && 'Tag my current location'}
              {gpsStatus === 'fetching' && 'Getting GPS…'}
              {gpsStatus === 'got' && '✓ Location tagged'}
              {gpsStatus === 'error' && 'GPS unavailable'}
            </span>
          </button>
        </Card>

        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 py-3.5 text-sm font-semibold rounded-xl border border-[--color-border] text-[--color-ink-muted] hover:bg-[--color-surface-bg] transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 py-3.5 text-sm font-semibold rounded-xl bg-[--color-primary] text-white hover:bg-[--color-primary-hover] transition-colors disabled:opacity-50">
            {submitting ? 'Checking in…' : 'Check In'}
          </button>
        </div>
      </form>
    </div>
  )
}
