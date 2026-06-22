import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { DEMO_DELIVERIES, DEMO_JOBS } from '@/lib/demoData'
import { formatDate } from '@/lib/utils'
import { Plus, AlertTriangle, ChevronDown, ChevronUp, Truck, CheckCircle2, MapPin } from 'lucide-react'

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
    {children}
  </div>
)

export const DeliveriesPage = () => {
  const navigate = useNavigate()
  const { isAgent, isPlanner, isAdmin, user } = useRole()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [tab, setTab] = useState<'pending' | 'completed'>('pending')

  // Jobs ready for delivery (processing_done) — not yet delivered
  const readyJobs = DEMO_JOBS.filter(j => j.status === 'processing_done')

  // Already logged deliveries
  const allDeliveries = isAgent
    ? DEMO_DELIVERIES.filter(d => { const j = DEMO_JOBS.find(x => x.id === d.job_id); return j?.assigned_agent_id === user?.id })
    : DEMO_DELIVERIES

  const deviations = allDeliveries.filter(d => d.destination_changed && !d.authorised_by_office)

  const statusColor = (s: string) => ({
    delivered: '#22c55e', partial: '#fbbf24', redirected: '#fb923c', planned: '#60a5fa',
  }[s] ?? '#94a3b8')

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.45rem 1.1rem', borderRadius: '0.5rem 0.5rem 0 0', border: 'none',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    background: 'transparent', color: active ? 'var(--accent)' : 'var(--tx3)',
    fontWeight: active ? 700 : 500, fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.15s',
  })

  return (
    <PageShell>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div className="breadcrumb" style={{ marginBottom: '0.4rem' }}>
            <span>SteelTrack</span><span className="sep">›</span><span className="active">Delivery Tracker</span>
          </div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Delivery Tracker</h1>
        </div>
        <button onClick={() => navigate('/deliveries/log')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(45,212,191,0.25)' }}>
          <Plus size={14} /> Log Delivery
        </button>
      </div>

      {/* Deviation alert */}
      {deviations.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '0.7rem', marginBottom: '1.1rem', background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.28)' }}>
          <AlertTriangle size={15} style={{ color: '#fb923c', flexShrink: 0 }} />
          <span style={{ fontSize: '0.84rem', color: 'var(--tx1)' }}>
            <span style={{ fontWeight: 700 }}>{deviations.length} unauthorised reroute{deviations.length > 1 ? 's' : ''}</span>
            <span style={{ color: 'var(--tx2)' }}> require office authorisation.</span>
          </span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--gb)', marginBottom: '1.1rem' }}>
        <button style={tabStyle(tab === 'pending')} onClick={() => setTab('pending')}>
          <Truck size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
          Ready to Deliver
          {readyJobs.length > 0 && (
            <span style={{ marginLeft: 6, fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: 999, background: 'rgba(45,212,191,0.2)', color: 'var(--accent)', border: '1px solid rgba(45,212,191,0.3)' }}>
              {readyJobs.length}
            </span>
          )}
        </button>
        <button style={tabStyle(tab === 'completed')} onClick={() => setTab('completed')}>
          <CheckCircle2 size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
          Completed Deliveries
        </button>
      </div>

      {/* Ready to Deliver tab — jobs with processing_done */}
      {tab === 'pending' && (
        <div>
          {readyJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', color: 'var(--tx3)', fontSize: '0.88rem' }}>
              No jobs ready for delivery yet
            </div>
          ) : (
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
              <table className="st-table">
                <thead><tr><th>Job #</th><th>Customer</th><th>Destination</th><th>Agent</th><th>Service Type</th><th /></tr></thead>
                <tbody>
                  {readyJobs.map(j => (
                    <tr key={j.id}>
                      <td><span className="cell-primary">{j.job_number}</span></td>
                      <td>{j.customer?.name ?? '—'}</td>
                      <td>{j.delivery_destination}</td>
                      <td style={{ color: 'var(--tx3)' }}>{j.assigned_agent?.full_name ?? '—'}</td>
                      <td style={{ color: 'var(--tx3)', fontSize: '0.8rem' }}>{j.service_type}</td>
                      <td>
                        <button
                          onClick={() => navigate(`/deliveries/log?job=${j.id}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.32rem 0.8rem', borderRadius: '0.45rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          <Truck size={12} /> Log Delivery
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Completed deliveries tab */}
      {tab === 'completed' && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
          {allDeliveries.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--tx3)', fontSize: '0.88rem' }}>No deliveries logged yet</div>
          ) : (
            <div>
              {allDeliveries.map(d => {
                const job = DEMO_JOBS.find(j => j.id === d.job_id)
                const isOpen = expanded === d.id
                const sc = statusColor(d.delivery_status)
                const hasDeviation = d.destination_changed && !d.authorised_by_office
                return (
                  <div key={d.id} style={{ borderBottom: '1px solid var(--gb)' }}>
                    <div
                      onClick={() => setExpanded(isOpen ? null : d.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', cursor: 'pointer', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--g2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${sc}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Truck size={14} style={{ color: sc }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx1)' }}>{job?.job_number ?? d.job_id.slice(0, 8)}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--tx3)', marginTop: 1 }}>{d.customer_name} · {d.delivery_address}</div>
                        </div>
                        {hasDeviation && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 999, background: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)' }}>REROUTED</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: `${sc}22`, color: sc, border: `1px solid ${sc}44`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.delivery_status}</span>
                        <span style={{ color: 'var(--tx4)' }}>{isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                      </div>
                    </div>
                    {isOpen && (
                      <div style={{ padding: '0.75rem 1.25rem 1rem', background: 'var(--g1)', borderTop: '1px solid var(--gb)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem' }}>
                        {[['Vehicle', d.vehicle_number], ['Delivered At', formatDate(d.delivered_at)], ['Address', d.delivery_address]].map(([l, v]) => (
                          <div key={l}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</div>
                            <div style={{ fontSize: '0.84rem', color: 'var(--tx1)', marginTop: 2 }}>{v}</div>
                          </div>
                        ))}
                        {d.destination_changed && (
                          <div style={{ gridColumn: '1/-1', marginTop: '0.5rem', padding: '0.65rem 0.9rem', borderRadius: '0.55rem', background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.25)' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fb923c', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> Destination Changed</div>
                            <div style={{ fontSize: '0.80rem', color: 'var(--tx2)' }}><span style={{ color: 'var(--tx4)' }}>From:</span> {d.old_destination}</div>
                            <div style={{ fontSize: '0.80rem', color: 'var(--tx2)' }}><span style={{ color: 'var(--tx4)' }}>To:</span> {d.new_destination}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--tx3)', marginTop: 2 }}>Reason: {d.change_reason}</div>
                            {!d.authorised_by_office && (
                              <div style={{ marginTop: '0.5rem' }}>
                                <button style={{ padding: '0.3rem 0.85rem', borderRadius: '0.4rem', border: 'none', background: 'rgba(251,146,60,0.2)', color: '#fb923c', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>Authorise</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </PageShell>
  )
}
