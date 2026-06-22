import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { DEMO_DELIVERIES, DEMO_JOBS } from '@/lib/demoData'
import { formatDateTime } from '@/lib/utils'
import { Truck, Search, MapPin, AlertTriangle, CheckCircle2, Clock, RotateCcw, PlusCircle } from 'lucide-react'
import type { DeliveryStatus } from '@/types'

type Filter = DeliveryStatus | 'all'

const STATUS_CFG: Record<DeliveryStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  planned:    { label: 'Planned',    icon: Clock,          color: '#94a3b8', bg: 'rgba(148,163,184,0.14)' },
  partial:    { label: 'Partial',    icon: RotateCcw,      color: '#fbbf24', bg: 'rgba(251,191,36,0.14)'  },
  delivered:  { label: 'Delivered',  icon: CheckCircle2,   color: '#34d399', bg: 'rgba(52,211,153,0.14)'  },
  redirected: { label: 'Redirected', icon: AlertTriangle,  color: '#fb923c', bg: 'rgba(251,146,60,0.14)'  },
}

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 960, margin: '0 auto' }}>
    {children}
  </div>
)

export const DeliveriesPage = () => {
  const { isAgent, user } = useRole()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const enriched = DEMO_DELIVERIES.map(d => ({ ...d, job: DEMO_JOBS.find(j => j.id === d.job_id) }))
  const base = isAgent ? enriched.filter(d => d.job?.assigned_agent_id === user?.id) : enriched

  const filtered = base.filter(d => {
    const ms = !search ||
      d.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      d.delivery_address.toLowerCase().includes(search.toLowerCase()) ||
      d.vehicle_number.toLowerCase().includes(search.toLowerCase())
    return ms && (filter === 'all' || d.delivery_status === filter)
  })

  const counts = {
    all: base.length,
    delivered: base.filter(d => d.delivery_status === 'delivered').length,
    partial:   base.filter(d => d.delivery_status === 'partial').length,
    redirected:base.filter(d => d.delivery_status === 'redirected').length,
    planned:   base.filter(d => d.delivery_status === 'planned').length,
  }
  const deviations = base.filter(d => d.destination_changed).length

  return (
    <PageShell>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <div className="breadcrumb" style={{ marginBottom: '0.4rem' }}>
            <span>SteelTrack</span><span className="sep">›</span><span className="active">Deliveries</span>
          </div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Deliveries</h1>
          <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            {isAgent ? 'Your delivery records — log completion and weight slips' : 'All deliveries, confirmations, and destination changes'}
          </p>
        </div>
        <button onClick={() => navigate('/deliveries/log')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none',
            background: 'linear-gradient(135deg,#2dd4bf,#0d9488)',
            color: '#07211e', fontWeight: 700, fontSize: '0.82rem',
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(45,212,191,0.25)',
          }}>
          <PlusCircle size={14} /> Log Delivery
        </button>
      </div>

      {/* Deviation alert */}
      {deviations > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.7rem 1rem', borderRadius: '0.7rem', marginBottom: '1rem',
          background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.28)',
        }}>
          <AlertTriangle size={15} style={{ color: '#fb923c', flexShrink: 0 }} />
          <div style={{ fontSize: '0.84rem', color: 'var(--tx1)' }}>
            <span style={{ fontWeight: 700 }}>{deviations} delivery{deviations > 1 ? 'ies' : ''}</span>
            <span style={{ color: 'var(--tx2)' }}> had destination changes — review for authorisation</span>
          </div>
        </div>
      )}

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {(['all', 'delivered', 'partial', 'planned', 'redirected'] as Filter[]).map(f => {
          const cfg = f !== 'all' ? STATUS_CFG[f as DeliveryStatus] : { label: 'All', color: 'var(--tx2)', bg: 'var(--g2)', icon: Truck }
          const isActive = filter === f
          const Icon = (cfg as any).icon ?? Truck
          return (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.35rem 0.85rem', borderRadius: 999,
                border: isActive ? `2px solid ${cfg.color}` : '2px solid transparent',
                background: isActive ? (cfg as any).bg : 'var(--g1)',
                color: isActive ? cfg.color : 'var(--tx3)',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s ease', textTransform: 'capitalize',
              }}>
              <Icon size={11} /> {f} <span style={{ fontWeight: 800 }}>{counts[f as keyof typeof counts]}</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx3)', pointerEvents: 'none' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search customer, address, vehicle…"
          style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 36, borderRadius: '0.55rem', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--tx1)', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem' }}>
          <Truck size={32} style={{ color: 'var(--tx4)', margin: '0 auto 0.75rem' }} />
          <div style={{ color: 'var(--tx2)', fontWeight: 600 }}>No deliveries found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filtered.map(d => {
            const cfg = STATUS_CFG[d.delivery_status]
            const Icon = cfg.icon
            return (
              <div key={d.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--tx1)' }}>{d.customer_name}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {cfg.label}
                        </span>
                        {d.destination_changed && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: 'rgba(251,146,60,0.14)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.30)', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <AlertTriangle size={9} /> Rerouted
                          </span>
                        )}
                      </div>
                      {d.job && (
                        <Link to={`/jobs/${d.job_id}`} style={{ fontSize: '0.78rem', color: '#2dd4bf', fontWeight: 600, textDecoration: 'none' }}>
                          {d.job.job_number} →
                        </Link>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginTop: '0.5rem' }}>
                      <MapPin size={11} style={{ color: 'var(--tx4)', marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.80rem', color: 'var(--tx2)' }}>{d.delivery_address}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: '0.5rem 1rem', marginTop: '0.65rem' }}>
                      {[['Vehicle', d.vehicle_number], ['Delivered', formatDateTime(d.delivered_at)], ['By', d.job?.assigned_agent?.full_name ?? d.created_by]]
                        .map(([l, v]) => (
                          <div key={l}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</div>
                            <div style={{ fontSize: '0.80rem', fontWeight: 600, color: 'var(--tx2)', marginTop: 2 }}>{v}</div>
                          </div>
                        ))}
                    </div>
                    {d.destination_changed && (
                      <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: '0.6rem', background: 'rgba(251,146,60,0.10)', border: '1px solid rgba(251,146,60,0.22)' }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Destination Change</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--tx2)' }}><span style={{ color: 'var(--tx3)' }}>Original:</span> {d.old_destination}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--tx2)', marginTop: 2 }}><span style={{ color: 'var(--tx3)' }}>New:</span> {d.new_destination}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--tx3)', fontStyle: 'italic', marginTop: 2 }}>Reason: {d.change_reason}</div>
                        <div style={{ fontSize: '0.72rem', marginTop: '0.4rem', fontWeight: 700 }}>
                          {d.authorised_by_office
                            ? <span style={{ color: '#34d399' }}>✓ Office authorised</span>
                            : <span style={{ color: '#f87171' }}>⚠ Self-authorised — review required</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
