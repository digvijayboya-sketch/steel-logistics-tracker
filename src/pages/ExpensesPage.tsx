import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRole } from '@/hooks/useRole'
import { useAuthStore } from '@/store/appStore'
import { useDataStore } from '@/store/dataStore'
import { formatINR, formatDateTime, downloadCSV } from '@/lib/utils'
import { Receipt, Search, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, AlertCircle, PlusCircle, Download, Loader2, ImageOff } from 'lucide-react'
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
  const { isAgent, canApprove } = useRole()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { expenses, jobs, loading, error, fetchExpenses, fetchJobs, reviewExpense } = useDataStore()

  useEffect(() => { fetchExpenses(); fetchJobs() }, [])

  const [search,       setSearch]       = useState('')
  const [filter,       setFilter]       = useState<Filter>('all')
  const [expandedId,   setExpandedId]   = useState<string | null>(null)
  const [reviewNotes,  setReviewNotes]  = useState<Record<string, string>>({})
  const [reviewing,    setReviewing]    = useState<string | null>(null)

  const isLoading = loading['expenses'] || loading['jobs']

  const base = isAgent
    ? expenses.filter(e => {
        const job = jobs.find(j => j.id === e.job_id)
        return job?.assigned_agent_id === user?.id
      })
    : expenses

  const filtered = base.filter(e => {
    const ms  = !search ||
      e.payee_description.toLowerCase().includes(search.toLowerCase()) ||
      EXPENSE_CATEGORY_LABELS[e.category as keyof typeof EXPENSE_CATEGORY_LABELS]?.toLowerCase().includes(search.toLowerCase())
    return ms && (filter === 'all' || e.status === filter)
  })

  const pendingCount   = base.filter(e => e.status === 'pending').length
  const totalAmt       = base.reduce((a, e) => a + e.amount_inr, 0)
  const approvedAmt    = base.filter(e => e.status === 'approved').reduce((a, e) => a + e.amount_inr, 0)
  const pendingAmt     = base.filter(e => e.status === 'pending').reduce((a, e) => a + e.amount_inr, 0)

  const handleApprove = async (id: string) => {
    setReviewing(id)
    try {
      await reviewExpense(id, 'approved', reviewNotes[id] ?? '', user?.id ?? '')
      setExpandedId(null)
      toast.success('Expense approved')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve expense')
    } finally { setReviewing(null) }
  }
  const handleReject = async (id: string) => {
    if (!reviewNotes[id]?.trim()) { toast.error('Add a rejection reason first'); return }
    setReviewing(id)
    try {
      await reviewExpense(id, 'rejected', reviewNotes[id], user?.id ?? '')
      setExpandedId(null)
      toast.error('Expense rejected')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject expense')
    } finally { setReviewing(null) }
  }

  const handleExportCSV = () => {
    downloadCSV(
      `expenses_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Category', 'Payee', 'Amount (INR)', 'Settlement', 'Status', 'Job', 'Logged By', 'Date', 'Review Notes'],
      filtered.map(e => {
        const job = jobs.find(j => j.id === e.job_id)
        return [
          EXPENSE_CATEGORY_LABELS[e.category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? e.category,
          e.payee_description,
          e.amount_inr,
          SETTLEMENT_LABELS[e.settlement_method as keyof typeof SETTLEMENT_LABELS] ?? e.settlement_method,
          e.status,
          job?.job_number ?? e.job_id,
          e.logged_by_profile?.full_name ?? e.logged_by,
          formatDateTime(e.created_at),
          e.review_notes ?? '',
        ]
      })
    )
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExportCSV} disabled={filtered.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.6rem', background: 'var(--g2)', color: 'var(--tx2)', border: '1px solid var(--gb)', fontWeight: 700, fontSize: '0.82rem', cursor: filtered.length === 0 ? 'not-allowed' : 'pointer', opacity: filtered.length === 0 ? 0.5 : 1 }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => navigate('/expenses/log')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', borderRadius: '0.6rem',
              background: isAgent ? 'linear-gradient(135deg,#2dd4bf,#0d9488)' : 'var(--g2)',
              color: isAgent ? '#07211e' : 'var(--tx2)',
              border: isAgent ? 'none' : '1px solid var(--gb)',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
            } as React.CSSProperties}>
            <PlusCircle size={14} /> Log Expense
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', borderRadius: '0.7rem', marginBottom: '1.25rem', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.28)' }}>
          <AlertCircle size={15} style={{ color: '#f87171', flexShrink: 0 }} />
          <div style={{ fontSize: '0.84rem', color: 'var(--tx1)' }}>Couldn't load expenses. <span style={{ color: 'var(--tx2)' }}>{error}</span></div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--tx3)', fontSize: '0.82rem', marginBottom: '1rem' }}>
          <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading live data…
        </div>
      )}

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
      {!isLoading && filtered.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem' }}>
          <Receipt size={32} style={{ color: 'var(--tx4)', margin: '0 auto 0.75rem' }} />
          <div style={{ color: 'var(--tx2)', fontWeight: 600 }}>No expenses found</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(expense => {
            const job  = jobs.find(j => j.id === expense.job_id)
            const isExpanded = expandedId === expense.id
            const statusCfg = expense.status === 'approved'
              ? { color: '#34d399', bg: 'rgba(52,211,153,0.12)', Icon: CheckCircle2 }
              : expense.status === 'rejected'
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
                      <span style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--tx1)' }}>{EXPENSE_CATEGORY_LABELS[expense.category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? expense.category}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.16rem 0.5rem', borderRadius: 999, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}44`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{expense.status}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--tx2)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{expense.payee_description}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--tx4)', marginTop: 2 }}>
                      {SETTLEMENT_LABELS[expense.settlement_method as keyof typeof SETTLEMENT_LABELS] ?? expense.settlement_method} · {job?.job_number} · {formatDateTime(expense.created_at)}
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
                        ['Settlement', SETTLEMENT_LABELS[expense.settlement_method as keyof typeof SETTLEMENT_LABELS] ?? expense.settlement_method],
                      ].map(([l, v]) => (
                        <div key={l}>
                          <div style={{ fontSize: '0.65rem', color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</div>
                          <div style={{ fontSize: '0.80rem', fontWeight: 600, color: 'var(--tx2)', marginTop: 2 }}>{v}</div>
                        </div>
                      ))}
                    </div>

                    {/* Receipt preview */}
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Receipt</div>
                      {expense.photo_url ? (
                        <a href={expense.photo_url} target="_blank" rel="noreferrer">
                          <img src={expense.photo_url} alt="Receipt"
                            style={{ maxWidth: '100%', maxHeight: 220, borderRadius: '0.6rem', border: '1px solid var(--gb)', display: 'block' }} />
                        </a>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', background: 'var(--g1)', border: '1px dashed var(--gb)', color: 'var(--tx4)', fontSize: '0.78rem' }}>
                          <ImageOff size={14} /> No receipt attached
                        </div>
                      )}
                    </div>

                    {expense.review_notes && (
                      <div style={{ marginTop: '0.65rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.22)', fontSize: '0.78rem', color: '#fca5a5' }}>
                        <span style={{ fontWeight: 700 }}>Review note: </span>{expense.review_notes}
                      </div>
                    )}

                    {canApprove && expense.status === 'pending' && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <textarea rows={2} placeholder="Review note (required for rejection)…"
                          value={reviewNotes[expense.id] ?? ''}
                          onChange={e => setReviewNotes(p => ({ ...p, [expense.id]: e.target.value }))}
                          style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--input-border)', background: 'var(--input-bg)', color: 'var(--tx1)', fontSize: '0.78rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleApprove(expense.id)} disabled={reviewing === expense.id}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399', fontWeight: 700, fontSize: '0.82rem', cursor: reviewing === expense.id ? 'not-allowed' : 'pointer', opacity: reviewing === expense.id ? 0.6 : 1 }}>
                            <CheckCircle2 size={13} /> Approve
                          </button>
                          <button onClick={() => handleReject(expense.id)} disabled={reviewing === expense.id}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(248,113,113,0.18)', border: '1px solid rgba(248,113,113,0.35)', color: '#f87171', fontWeight: 700, fontSize: '0.82rem', cursor: reviewing === expense.id ? 'not-allowed' : 'pointer', opacity: reviewing === expense.id ? 0.6 : 1 }}>
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
