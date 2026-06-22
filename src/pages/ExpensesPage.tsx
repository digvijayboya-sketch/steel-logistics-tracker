import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { DEMO_EXPENSES, DEMO_JOBS } from '@/lib/demoData'
import { formatINR, formatDateTime } from '@/lib/utils'
import { Receipt, Search, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, AlertCircle, PlusCircle } from 'lucide-react'
import type { ExpenseStatus } from '@/types'
import { EXPENSE_CATEGORY_LABELS, SETTLEMENT_LABELS } from '@/types'
import { toast } from 'sonner'

type Filter = ExpenseStatus | 'all'

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 920, margin: '0 auto' }}>
    {children}
  </div>
)

export const ExpensesPage = () => {
  const { isAgent, canApprove, user } = useRole()
  const navigate = useNavigate()

  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState<Filter>('all')
  const [expandedId,   setExpandedId]   = useState<string | null>(null)
  const [states,       setStates]       = useState<Record<string, { status: ExpenseStatus; notes: string }>>({}
  )
  const [reviewNotes,  setReviewNotes]  = useState<Record<string, string>>({})

  const getEff = (id: string, orig: ExpenseStatus): ExpenseStatus => states[id]?.status ?? orig

  const base = isAgent
    ? DEMO_EXPENSES.filter(e => {
        const job = DEMO_JOBS.find(j => j.id === e.job_id)
        return job?.assigned_agent_id === user?.id
      })
    : DEMO_EXPENSES

  const filtered = base.filter(e => {
    const eff = getEff(e.id, e.status)
    const ms  = !search ||
      e.payee_description.toLowerCase().includes(search.toLowerCase()) ||
      EXPENSE_CATEGORY_LABELS[e.category].toLowerCase().includes(search.toLowerCase())
    return ms && (filter === 'all' || eff === filter)
  })

  const pendingCount   = base.filter(e => getEff(e.id, e.status) === 'pending').length
  const totalAmt       = base.reduce((a, e) => a + e.amount_inr, 0)
  const approvedAmt    = base.filter(e => getEff(e.id, e.status) === 'approved').reduce((a, e) => a + e.amount_inr, 0)
  const pendingAmt     = base.filter(e => getEff(e.id, e.status) === 'pending').reduce((a, e) => a + e.amount_inr, 0)

  const handleApprove = (id: string) => {
    setStates(p => ({ ...p, [id]: { status: 'approved', notes: reviewNotes[id] ?? '' } }))
    setExpandedId(null)
    toast.success('Expense approved')
  }
  const handleReject = (id: string) => {
    if (!reviewNotes[id]?.trim()) { toast.error('Add a rejection reason first'); return }
    setStates(p => ({ ...p, [id]: { status: 'rejected', notes: reviewNotes[id] } }))
    setExpandedId(null)
    toast.error('Expense rejected')
  }

  const FILTERS: Filter[] = ['all', 'pending', 'approved', 'rejected']
  const FILTER_CFG: Record<Filter, { color: string; bg: string }> = {
    all:      { color: 'var(--tx2)',  bg: 'var(--g2)'                 },
    pending:  { color: '#fbbf24',    bg: 'rgba(251,191,36,0.14)'     },
    approved: { color: '#34d399',    bg: 'rgba(52,211,153,0.14)'     },
    rejected: { color: '#f87171',    bg: 'rgba(248,113,113,0.14)'    },
  }

  return (
    <PageShell>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <div className="breadcrumb" style={{ marginBottom: '0.4rem' }}>
            <span>SteelTrack</span><span className="sep">›</span><span className="active">Expenses</span>
          </div>
          <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Field Expenses</h1>
          <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            {canApprove ? 'Review and approve agent expense claims' : 'Your submitted expense claims'}
          </p>
        </div>
        {/* Agent logs expenses; managers/planners review */}
        <button onClick={() => navigate('/expenses/log')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none',
            background: isAgent ? 'linear-gradient(135deg,#2dd4bf,#0d9488)' : 'var(--g2)',
            color: isAgent ? '#07211e' : 'var(--tx2)',
            border: isAgent ? 'none' : '1px solid var(--gb)',
            fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
          } as React.CSSProperties}>
          <PlusCircle size={14} /> Log Expense
        </button>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Logged', value: formatINR(totalAmt),    color: 'var(--tx1)', accent: '#60a5fa' },
          { label: 'Approved',     value: formatINR(approvedAmt), color: '#34d399',    accent: '#34d399' },
          { label: 'Pending',      value: formatINR(pendingAmt),  color: '#fbbf24',    accent: '#fbbf24' },
        ].map(k => (
          <div key={k.label} style={{
            padding: '0.9rem 1rem', borderRadius: '0.75rem',
            background: 'var(--card-bg)', border: '1px solid var(--card-border)',
            borderTop: `3px solid ${k.accent}`,
          }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>{k.label}</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Pending alert for approvers */}
      {canApprove && pendingCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.7rem 1rem', borderRadius: '0.7rem', marginBottom: '1rem',
          background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)',
        }}>
          <AlertCircle size={15} style={{ color: '#fbbf24', flexShrink: 0 }} />
          <div style={{ fontSize: '0.84rem', color: 'var(--tx1)' }}>
            <span style={{ fontWeight: 700 }}>{pendingCount} expense{pendingCount > 1 ? 's' : ''}</span>
            <span style={{ color: 'var(--tx2)' }}> awaiting your approval</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx3)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search category or payee…"
            style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 36, borderRadius: '0.55rem', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--tx1)', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {FILTERS.map(f => {
            const cfg = FILTER_CFG[f]
            const isActive = filter === f
            return (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: '0.3rem 0.85rem', borderRadius: 999,
                  border: isActive ? `2px solid ${cfg.color}` : '2px solid transparent',
                  background: isActive ? cfg.bg : 'var(--g1)',
                  color: isActive ? cfg.color : 'var(--tx3)',
                  fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.14s ease', textTransform: 'capitalize',
                }}>
                {f}
              </button>
            )
          })}
        </div>
      </div>

      {/* Expense list */}
      {filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem' }}>
          <Receipt size={32} style={{ color: 'var(--tx4)', margin: '0 auto 0.75rem' }} />
          <div style={{ color: 'var(--tx2)', fontWeight: 600 }}>No expenses found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(expense => {
            const eff  = getEff(expense.id, expense.status)
            const effN = states[expense.id]?.notes ?? expense.review_notes
            const job  = DEMO_JOBS.find(j => j.id === expense.job_id)
            const isExpanded = expandedId === expense.id
            const statusCfg = eff === 'approved'
              ? { color: '#34d399', bg: 'rgba(52,211,153,0.12)', Icon: CheckCircle2 }
              : eff === 'rejected'
              ? { color: '#f87171', bg: 'rgba(248,113,113,0.12)', Icon: XCircle }
              : { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  Icon: Clock }

            return (
              <div key={expense.id} style={{ background: 'var(--card-bg)', border: `1px solid ${isExpanded ? statusCfg.color + '44' : 'var(--card-border)'}`, borderRadius: '0.85rem', overflow: 'hidden', transition: 'border-color 0.15s ease' }}>
                <button onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                  style={{ width: '100%', textAlign: 'left', padding: '0.9rem 1.1rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: statusCfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <statusCfg.Icon size={16} style={{ color: statusCfg.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--tx1)' }}>{EXPENSE_CATEGORY_LABELS[expense.category]}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.16rem 0.5rem', borderRadius: 999, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}44`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{eff}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--tx2)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{expense.payee_description}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--tx4)', marginTop: 2 }}>
                      {SETTLEMENT_LABELS[expense.settlement_method]} · {job?.job_number} · {formatDateTime(expense.created_at)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--tx1)', fontVariantNumeric: 'tabular-nums' }}>{formatINR(expense.amount_inr)}</span>
                    {isExpanded ? <ChevronUp size={14} style={{ color: 'var(--tx4)' }} /> : <ChevronDown size={14} style={{ color: 'var(--tx4)' }} />}
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ padding: '0 1.1rem 1rem', borderTop: '1px solid var(--gb)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.65rem', marginTop: '0.75rem' }}>
                      {[
                        ['Logged by', expense.logged_by_profile?.full_name ?? expense.logged_by],
                        ['Date & time', formatDateTime(expense.created_at)],
                        ['Job', job?.job_number ?? expense.job_id],
                        ['Settlement', SETTLEMENT_LABELS[expense.settlement_method]],
                      ].map(([l, v]) => (
                        <div key={l}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</div>
                          <div style={{ fontSize: '0.80rem', fontWeight: 600, color: 'var(--tx2)', marginTop: 2 }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {effN && (
                      <div style={{ marginTop: '0.65rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.22)', fontSize: '0.78rem', color: '#fca5a5' }}>
                        <span style={{ fontWeight: 700 }}>Review note: </span>{effN}
                      </div>
                    )}

                    {canApprove && eff === 'pending' && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <textarea rows={2} placeholder="Review note (required for rejection)…"
                          value={reviewNotes[expense.id] ?? ''}
                          onChange={e => setReviewNotes(p => ({ ...p, [expense.id]: e.target.value }))}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--tx1)', fontSize: '0.78rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleApprove(expense.id)}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button onClick={() => handleReject(expense.id)}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </PageShell>
  )
}
