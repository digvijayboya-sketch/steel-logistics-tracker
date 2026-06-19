import { useState } from 'react'
import { useAuthStore } from '@/store/appStore'
import { DEMO_EXPENSES, DEMO_JOBS } from '@/lib/demoData'
import { Card } from '@/components/ui/Card'
import { ExpenseStatusBadge } from '@/components/ui/StatusBadge'
import { formatINR, formatDateTime } from '@/lib/utils'
import { Receipt, Search, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import type { ExpenseStatus } from '@/types'
import { EXPENSE_CATEGORY_LABELS, SETTLEMENT_LABELS } from '@/types'
import { toast } from 'sonner'

type Filter = ExpenseStatus | 'all'

export const ExpensesPage = () => {
  const { user } = useAuthStore()
  const isAgent = user?.role === 'agent'
  const canApprove = user?.role === 'admin' || user?.role === 'planner'

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expenseStates, setExpenseStates] = useState<Record<string, { status: ExpenseStatus; notes: string }>>({})
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})

  const getEffectiveStatus = (id: string, orig: ExpenseStatus): ExpenseStatus =>
    expenseStates[id]?.status ?? orig

  const base = isAgent
    ? DEMO_EXPENSES.filter(e => {
        const job = DEMO_JOBS.find(j => j.id === e.job_id)
        return job?.assigned_agent_id === user?.id
      })
    : DEMO_EXPENSES

  const filtered = base.filter(e => {
    const eff = getEffectiveStatus(e.id, e.status)
    const matchSearch = !search ||
      e.payee_description.toLowerCase().includes(search.toLowerCase()) ||
      EXPENSE_CATEGORY_LABELS[e.category].toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || eff === filter
    return matchSearch && matchFilter
  })

  const pendingCount = base.filter(e => getEffectiveStatus(e.id, e.status) === 'pending').length
  const totalAmount = base.reduce((a, e) => a + e.amount_inr, 0)
  const approvedAmount = base
    .filter(e => getEffectiveStatus(e.id, e.status) === 'approved')
    .reduce((a, e) => a + e.amount_inr, 0)
  const pendingAmount = base
    .filter(e => getEffectiveStatus(e.id, e.status) === 'pending')
    .reduce((a, e) => a + e.amount_inr, 0)

  const handleApprove = (id: string) => {
    setExpenseStates(prev => ({ ...prev, [id]: { status: 'approved', notes: reviewNotes[id] ?? '' } }))
    setExpandedId(null)
    toast.success('Expense approved')
  }

  const handleReject = (id: string) => {
    if (!reviewNotes[id]?.trim()) {
      toast.error('Please add a rejection reason')
      return
    }
    setExpenseStates(prev => ({ ...prev, [id]: { status: 'rejected', notes: reviewNotes[id] } }))
    setExpandedId(null)
    toast.error('Expense rejected')
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[--color-ink]">Field Expenses</h1>
        <p className="text-sm text-[--color-ink-muted] mt-0.5">
          {canApprove ? 'Review and approve agent expense claims' : 'Your submitted expense claims'}
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[['Total Logged', formatINR(totalAmount), 'bg-gray-50 text-gray-700'],
          ['Approved', formatINR(approvedAmount), 'bg-green-50 text-green-700'],
          ['Pending', formatINR(pendingAmount), 'bg-amber-50 text-amber-700'],
        ].map(([l, v, cls]) => (
          <Card key={l} className={`!p-3 ${cls}`}>
            <div className="text-[10px] font-medium uppercase tracking-wide opacity-70">{l}</div>
            <div className="text-lg font-bold mt-0.5 tabular">{v}</div>
          </Card>
        ))}
      </div>

      {/* Pending alert */}
      {canApprove && pendingCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">{pendingCount} expense{pendingCount > 1 ? 's' : ''}</span> pending your approval
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[--color-ink-faint]" />
          <input
            className="w-full pl-8 pr-3 py-2 text-sm border border-[--color-border] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary]"
            placeholder="Search by category or payee…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {(['all','pending','approved','rejected'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors
                ${filter === f
                  ? 'bg-[--color-primary] text-white'
                  : 'bg-[--color-surface-bg] text-[--color-ink-muted] hover:bg-[--color-surface-divider]'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Receipt size={32} className="mx-auto mb-3 text-[--color-ink-faint]" />
          <div className="text-sm font-medium text-[--color-ink-muted]">No expenses found</div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(expense => {
            const effectiveStatus = getEffectiveStatus(expense.id, expense.status)
            const effectiveNotes = expenseStates[expense.id]?.notes ?? expense.review_notes
            const job = DEMO_JOBS.find(j => j.id === expense.job_id)
            const isExpanded = expandedId === expense.id

            return (
              <Card key={expense.id} padding={false}>
                <button
                  className="w-full text-left p-4 hover:bg-[--color-surface-bg] transition-colors rounded-xl"
                  onClick={() => setExpandedId(isExpanded ? null : expense.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                      ${effectiveStatus === 'approved' ? 'bg-green-50'
                        : effectiveStatus === 'rejected' ? 'bg-red-50'
                        : 'bg-amber-50'}`}>
                      {effectiveStatus === 'approved' ? <CheckCircle2 size={16} className="text-green-600" />
                        : effectiveStatus === 'rejected' ? <XCircle size={16} className="text-red-500" />
                        : <Clock size={16} className="text-amber-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-[--color-ink]">{EXPENSE_CATEGORY_LABELS[expense.category]}</span>
                        <ExpenseStatusBadge status={effectiveStatus} />
                      </div>
                      <div className="text-xs text-[--color-ink-muted] mt-0.5 truncate">{expense.payee_description}</div>
                      <div className="text-[10px] text-[--color-ink-faint] mt-0.5">
                        {SETTLEMENT_LABELS[expense.settlement_method]} · {job?.job_number} · {formatDateTime(expense.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold text-[--color-ink] tabular">{formatINR(expense.amount_inr)}</span>
                      {isExpanded ? <ChevronUp size={14} className="text-[--color-ink-faint]" /> : <ChevronDown size={14} className="text-[--color-ink-faint]" />}
                    </div>
                  </div>
                </button>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-[--color-border] mt-0">
                    <div className="pt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[['Logged by', expense.logged_by_profile?.full_name ?? expense.logged_by],
                          ['Date & time', formatDateTime(expense.created_at)],
                          ['Job', job?.job_number ?? expense.job_id],
                          ['Settlement', SETTLEMENT_LABELS[expense.settlement_method]],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <div className="text-[10px] text-[--color-ink-faint]">{l}</div>
                            <div className="text-xs font-medium text-[--color-ink-muted]">{v}</div>
                          </div>
                        ))}
                      </div>

                      {effectiveNotes && (
                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 text-xs text-red-700">
                          <span className="font-semibold">Review note: </span>{effectiveNotes}
                        </div>
                      )}

                      {/* Approval actions */}
                      {canApprove && effectiveStatus === 'pending' && (
                        <div className="space-y-2 pt-1">
                          <textarea
                            className="w-full text-xs border border-[--color-border] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 resize-none"
                            rows={2}
                            placeholder="Review note (required for rejection)…"
                            value={reviewNotes[expense.id] ?? ''}
                            onChange={e => setReviewNotes(prev => ({ ...prev, [expense.id]: e.target.value }))}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(expense.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle2 size={13} /> Approve
                            </button>
                            <button
                              onClick={() => handleReject(expense.id)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
