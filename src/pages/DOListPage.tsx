import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DEMO_DOS, DEMO_SUPPLIERS, DEMO_SERVICE_CENTRES } from '@/lib/demoData'
import { useRole } from '@/hooks/useRole'
import { DO_STATUS_LABELS } from '@/types'
import type { DOStatus } from '@/types'
import { formatDate } from '@/lib/utils'
import { FileText, PlusCircle, Search, Weight, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const S_COLORS: Record<DOStatus, { badge: string; dot: string }> = {
  draft:               { badge: 'rgba(148,163,184,0.18)', dot: '#94a3b8' },
  active:              { badge: 'rgba(96,165,250,0.18)',  dot: '#60a5fa' },
  partially_dispatched:{ badge: 'rgba(251,191,36,0.18)',  dot: '#fbbf24' },
  fully_dispatched:    { badge: 'rgba(52,211,153,0.18)',  dot: '#34d399' },
  closed:              { badge: 'rgba(148,163,184,0.12)', dot: '#94a3b8' },
}

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
    {children}
  </div>
)

export const DOListPage = () => {
  const { canCreate, canApprove, isAgent } = useRole()
  const navigate = useNavigate()
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState<DOStatus | ''>('')
  const [showCreate, setShowCreate]   = useState(false)
  const [form, setForm] = useState({ do_number: '', supplier_id: '', source_service_centre_id: '', expected_collection_date: '' })

  // Agents cannot access DOs at all
  if (isAgent) return (
    <PageShell>
      <div style={{
        marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '0.75rem', textAlign: 'center',
      }}>
        <span style={{ fontSize: '2.5rem' }}>🚫</span>
        <div style={{ color: 'var(--tx1)', fontWeight: 700, fontSize: '1rem' }}>Access restricted</div>
        <div style={{ color: 'var(--tx3)', fontSize: '0.85rem', maxWidth: 320 }}>
          Delivery Orders are managed by Planners and Purchase. Use your Job Cards to track work.
        </div>
        <button onClick={() => navigate('/jobs')}
          style={{
            marginTop: '0.5rem', padding: '0.55rem 1.25rem', borderRadius: 8,
            background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', border: 'none',
            color: '#07211e', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
          }}>
          Go to My Jobs →
        </button>
      </div>
    </PageShell>
  )

  const filtered = DEMO_DOS.filter(d => {
    const ms = !search || d.do_number.toLowerCase().includes(search.toLowerCase()) || (d.supplier?.name ?? '').toLowerCase().includes(search.toLowerCase())
    const mf = !filterStatus || d.status === filterStatus
    return ms && mf
  })

  const handleCreate = () => {
    if (!form.do_number || !form.supplier_id) { toast.error('DO Number and Supplier are required'); return }
    toast.success(`DO ${form.do_number} created`)
    setShowCreate(false)
    setForm({ do_number: '', supplier_id: '', source_service_centre_id: '', expected_collection_date: '' })
  }

  return (
    <PageShell>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <div className="breadcrumb" style={{ marginBottom: '0.4rem' }}>
            <span>SteelTrack</span><span className="sep">›</span><span className="active">Delivery Orders</span>
          </div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Delivery Orders</h1>
          <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            {DEMO_DOS.length} total · {DEMO_DOS.filter(d => d.status === 'active').length} active
            {canApprove && ` · ${DEMO_DOS.filter(d => d.status === 'draft').length} drafts awaiting approval`}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.1rem', borderRadius: '0.6rem', border: 'none',
              background: 'linear-gradient(135deg,#2dd4bf,#0d9488)',
              color: '#07211e', fontWeight: 700, fontSize: '0.84rem',
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(45,212,191,0.28)',
              transition: 'all 0.15s ease', flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
          >
            <PlusCircle size={15} /> New DO
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx3)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search DO # or supplier…"
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12,
              height: 36, borderRadius: '0.55rem',
              border: '1px solid var(--input-border)', background: 'var(--input-bg)',
              color: 'var(--tx1)', fontSize: '0.84rem', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <select
          value={filterStatus} onChange={e => setFilterStatus(e.target.value as DOStatus | '')}
          style={{
            height: 36, paddingLeft: 10, paddingRight: 10, borderRadius: '0.55rem',
            border: '1px solid var(--input-border)', background: 'var(--input-bg)',
            color: 'var(--tx2)', fontSize: '0.84rem', outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">All Statuses</option>
          {(Object.keys(DO_STATUS_LABELS) as DOStatus[]).map(s => (
            <option key={s} value={s}>{DO_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table card */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <FileText size={32} style={{ color: 'var(--tx4)', margin: '0 auto 0.75rem' }} />
            <div style={{ color: 'var(--tx2)', fontWeight: 600, fontSize: '0.9rem' }}>No delivery orders found</div>
            <div style={{ color: 'var(--tx3)', fontSize: '0.80rem', marginTop: '0.25rem' }}>Adjust your filters or create a new DO.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="st-table">
              <thead>
                <tr>
                  {['DO Number', 'Supplier', 'Source SC', 'Collection Date', 'Items / Weight', 'Status', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const sc = S_COLORS[d.status]
                  const totalMT = d.items.reduce((a, i) => a + i.weight_mt, 0)
                  return (
                    <tr key={d.id}>
                      <td>
                        <div className="cell-primary">{d.do_number}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--tx4)', marginTop: 2 }}>{formatDate(d.created_at)}</div>
                      </td>
                      <td>{d.supplier?.name ?? '—'}</td>
                      <td>{d.source_service_centre?.name ?? '—'}</td>
                      <td className="cell-mono">{formatDate(d.expected_collection_date)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--tx2)', fontSize: '0.82rem' }}>
                          <Weight size={12} style={{ color: 'var(--tx3)' }} />
                          <span>{d.items.length} item{d.items.length !== 1 ? 's' : ''}</span>
                          <span style={{ color: 'var(--tx4)' }}>·</span>
                          <span className="cell-mono">{totalMT.toFixed(1)} MT</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '0.22rem 0.6rem', borderRadius: 999,
                          background: sc.badge, fontSize: '0.70rem', fontWeight: 700,
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                          color: sc.dot,
                          border: `1px solid ${sc.dot}44`,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                          {DO_STATUS_LABELS[d.status]}
                        </span>
                      </td>
                      <td>
                        <Link to={`/dos/${d.id}`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          color: '#2dd4bf', fontWeight: 600, fontSize: '0.78rem',
                          textDecoration: 'none',
                        }}>
                          View <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create DO Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} onClick={() => setShowCreate(false)} />
          <div style={{
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: 440,
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderRadius: '1rem', backdropFilter: 'blur(24px)',
            padding: '1.75rem', boxShadow: 'var(--sh-lg)',
            animation: 'slideUp 0.25s ease both',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--tx1)' }}>New Delivery Order</div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[{ label: 'DO Number *', key: 'do_number', ph: 'e.g. DO-2026-003', type: 'text' },
                { label: 'Expected Collection Date', key: 'expected_collection_date', ph: '', type: 'date' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--tx2)', marginBottom: '0.3rem' }}>{f.label}</label>
                  <input type={f.type} placeholder={f.ph}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '0.55rem', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--tx1)', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              {[{ label: 'Supplier *', key: 'supplier_id', opts: DEMO_SUPPLIERS, ph: 'Select supplier…' },
                { label: 'Source Service Centre', key: 'source_service_centre_id', opts: DEMO_SERVICE_CENTRES, ph: 'Select SC…' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--tx2)', marginBottom: '0.3rem' }}>{f.label}</label>
                  <select value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ width: '100%', padding: '0.55rem 0.8rem', borderRadius: '0.55rem', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--tx1)', fontSize: '0.84rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                    <option value="">{f.ph}</option>
                    {f.opts.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.25rem' }}>
                <button onClick={() => setShowCreate(false)}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '0.55rem', border: '1px solid var(--gb)', background: 'var(--g2)', color: 'var(--tx2)', fontWeight: 600, fontSize: '0.84rem', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleCreate}
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '0.55rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer' }}>
                  Create DO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
