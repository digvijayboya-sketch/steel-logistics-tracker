/**
 * DOListPage.tsx — live Supabase, shows cancelled DOs with a visual distinction.
 * Cancelled DOs are dimmed and tagged. Agents do NOT see cancelled DOs.
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { supabase } from '@/lib/supabase'
import { DO_STATUS_LABELS } from '@/types'
import type { DOStatus } from '@/types'

type StatusFilter = DOStatus | 'all'
const STATUS_FILTERS: StatusFilter[] = ['all', 'active', 'draft', 'partially_dispatched', 'fully_dispatched', 'closed']
import { formatDate } from '@/lib/utils'
import { Plus, ChevronRight, Package, Loader2, XCircle, Search } from 'lucide-react'

const DO_COLORS: Record<string, string> = {
  draft: '#94a3b8', active: '#60a5fa', partially_dispatched: '#fbbf24',
  fully_dispatched: '#34d399', closed: '#6b7280', cancelled: '#f87171',
}

export const DOListPage = () => {
  const { isPlanner, isAdmin, isAgent } = useRole()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [dos, setDOs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCancelled, setShowCancelled] = useState(false)
  const initialStatus = sp.get('status')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    STATUS_FILTERS.includes(initialStatus as StatusFilter) ? (initialStatus as StatusFilter) : 'all'
  )

  const fetchDOs = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('delivery_orders')
      .select(`id, do_number, status, expected_collection_date, created_at,
        supplier:suppliers(id,name),
        source_service_centre:service_centres(id,name,city),
        items:do_items(id),
        jobs:jobs(id)`)
      .order('created_at', { ascending: false })
    setDOs(data ?? [])
    setLoading(false)
  }
  useEffect(() => { fetchDOs() }, [])

  const filtered = dos.filter(d => {
    if (isAgent && d.status === 'cancelled') return false
    if (!showCancelled && d.status === 'cancelled') return false
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    const q = search.toLowerCase()
    if (!q) return true
    return d.do_number.toLowerCase().includes(q) ||
      (d.supplier?.name ?? '').toLowerCase().includes(q) ||
      (d.source_service_centre?.name ?? '').toLowerCase().includes(q)
  })

  const cancelledCount = dos.filter(d => d.status === 'cancelled').length

  return (
    <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Delivery Orders</h1>
          <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>{dos.filter(d => d.status !== 'cancelled').length} active · {cancelledCount} cancelled</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {cancelledCount > 0 && !isAgent && (
            <button onClick={() => setShowCancelled(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.9rem', borderRadius: '0.55rem', border: '1px solid rgba(248,113,113,0.4)', background: showCancelled ? 'rgba(248,113,113,0.15)' : 'transparent', color: '#f87171', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
              <XCircle size={12} /> {showCancelled ? 'Hide' : 'Show'} Cancelled ({cancelledCount})
            </button>
          )}
          {(isPlanner || isAdmin) && (
            <button onClick={() => navigate('/dos/new')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#2dd4bf,#0d9488)', color: '#07211e', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,148,136,0.3)' }}>
              <Plus size={14} /> New DO
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1rem', maxWidth: 360 }}>
        <Search size={13} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--tx4)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search DO number, supplier, SC…"
          style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.1rem', borderRadius: '0.55rem', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--tx1)', fontSize: '0.83rem', outline: 'none' }} />
      </div>

      {/* Status filter chips */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map(f => {
          const isActive = statusFilter === f
          return (
            <button key={f} onClick={() => setStatusFilter(f)}
              style={{ padding: '0.3rem 0.85rem', borderRadius: 999, border: isActive ? '2px solid var(--accent)' : '2px solid transparent', background: isActive ? 'var(--accent-dim)' : 'var(--g1)', color: isActive ? 'var(--accent)' : 'var(--tx3)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
              {f === 'all' ? 'All' : DO_STATUS_LABELS[f]}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--tx3)', fontSize: '0.85rem', padding: '3rem 0', justifyContent: 'center' }}>
          <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading…
        </div>
      ) : (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--tx4)', fontSize: '0.85rem' }}>
              <Package size={28} style={{ color: 'var(--tx4)', margin: '0 auto 0.75rem' }} />
              No delivery orders found.
            </div>
          ) : (
            <table className="st-table">
              <thead>
                <tr>
                  <th>DO Number</th><th>Supplier</th><th>Service Centre</th>
                  <th>Items</th><th>Expected</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const hasJob = (d.jobs?.length ?? 0) > 0
                  const planned = d.status === 'active' && hasJob
                  const col = planned ? '#a78bfa' : (DO_COLORS[d.status] ?? '#94a3b8')
                  const label = planned ? 'Job Assigned' : (DO_STATUS_LABELS[d.status as DOStatus] ?? d.status)
                  const isCancelled = d.status === 'cancelled'
                  return (
                    <tr key={d.id} style={{ opacity: isCancelled ? 0.55 : 1 }}>
                      <td className="cell-primary">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {d.do_number}
                          {isCancelled && <XCircle size={11} style={{ color: '#f87171' }} />}
                        </div>
                      </td>
                      <td>{d.supplier?.name ?? '—'}</td>
                      <td>{d.source_service_centre?.name ?? '—'}</td>
                      <td className="cell-mono">{d.items?.length ?? 0}</td>
                      <td>{formatDate(d.expected_collection_date)}</td>
                      <td>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.18rem 0.55rem', borderRadius: 999, background: `${col}22`, color: col, border: `1px solid ${col}44`, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                          {label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/dos/${d.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}>
                          View <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
