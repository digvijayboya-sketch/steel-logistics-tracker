import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDataStore } from '@/store/dataStore'
import { formatINR, formatDate, formatDateTime, downloadCSV } from '@/lib/utils'
import { FileText, Scale, Receipt, CheckCircle2, Clock, Download, Loader2, ChevronRight } from 'lucide-react'
import { JOB_STATUS_LABELS, EXPENSE_CATEGORY_LABELS } from '@/types'
import type { JobStatus, ExpenseCategory } from '@/types'

const inp: React.CSSProperties = {
  width: '100%', padding: '0.55rem 0.75rem', borderRadius: '0.55rem',
  border: '1px solid var(--input-border)', background: 'var(--input-bg)',
  color: 'var(--tx1)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' as const,
}

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: '100%', padding: '1.5rem 1.75rem', maxWidth: 1100, margin: '0 auto' }}>
    {children}
  </div>
)

export const ReconciliationPage = () => {
  const { dos, jobs, expenses, loading, fetchDOs, fetchJobs, fetchExpenses } = useDataStore()

  useEffect(() => { fetchDOs(); fetchJobs(); fetchExpenses() }, [])

  const [selectedDoId, setSelectedDoId] = useState('')

  const isLoading = loading['dos'] || loading['jobs'] || loading['expenses']

  const selectedDO = dos.find(d => d.id === selectedDoId)
  const doJobs = useMemo(
    () => jobs.filter(j => j.do?.id === selectedDoId),
    [jobs, selectedDoId]
  )
  const doJobIds = useMemo(() => new Set(doJobs.map(j => j.id)), [doJobs])
  const doExpenses = useMemo(
    () => expenses.filter(e => doJobIds.has(e.job_id)),
    [expenses, doJobIds]
  )

  const totalWeightMT = (selectedDO?.items ?? []).reduce((s: number, i: any) => s + (i.weight_mt || 0), 0)
  const totalExpenses = doExpenses.reduce((s, e) => s + e.amount_inr, 0)
  const approvedExpenses = doExpenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount_inr, 0)
  const pendingExpenses = doExpenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount_inr, 0)

  const handleExportCSV = () => {
    if (!selectedDO) return
    const rows: (string | number)[][] = [
      ...doJobs.map(j => ['Job', j.job_number, j.customer?.name ?? '', JOB_STATUS_LABELS[j.status as JobStatus] ?? j.status, '', formatDateTime(j.created_at)]),
      ...doExpenses.map(e => {
        const job = jobs.find(j => j.id === e.job_id)
        return ['Expense', job?.job_number ?? e.job_id, EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory] ?? e.category, e.status, e.amount_inr, formatDateTime(e.created_at)]
      }),
    ]
    downloadCSV(
      `reconciliation_${selectedDO.do_number}.csv`,
      ['Type', 'Job / Ref', 'Detail', 'Status', 'Amount (INR)', 'Date'],
      rows
    )
  }

  const JOB_COLORS: Record<string, string> = {
    assigned: '#94a3b8', acknowledged: '#60a5fa', at_service_centre: '#a78bfa',
    processing: '#fbbf24', processing_done: '#34d399',
    in_transit_to_customer: '#2dd4bf', delivered: '#22c55e', cancelled: '#f87171',
  }
  const EXP_COLORS: Record<string, string> = {
    pending: '#fbbf24', approved: '#34d399', rejected: '#f87171',
  }

  return (
    <PageShell>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: 'var(--tx1)', fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Reconciliation</h1>
        <p style={{ color: 'var(--tx3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Match expenses and job activity against a delivery order</p>
      </div>

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--tx3)', fontSize: '0.82rem', marginBottom: '1rem' }}>
          <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading live data…
        </div>
      )}

      {/* DO selector */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px', minWidth: 260 }}>
          <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 700, color: 'var(--tx4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Delivery Order</label>
          <select style={inp} value={selectedDoId} onChange={e => setSelectedDoId(e.target.value)}>
            <option value="">Select a DO…</option>
            {dos.map(d => <option key={d.id} value={d.id}>{d.do_number} — {d.supplier?.name ?? '—'}</option>)}
          </select>
        </div>
        <button onClick={handleExportCSV} disabled={!selectedDO}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.58rem 1rem', borderRadius: '0.6rem', background: 'var(--g2)', color: 'var(--tx2)', border: '1px solid var(--gb)', fontWeight: 700, fontSize: '0.82rem', cursor: selectedDO ? 'pointer' : 'not-allowed', opacity: selectedDO ? 1 : 0.5 }}>
          <Download size={14} /> Export CSV
        </button>
      </div>

      {!selectedDO ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem' }}>
          <Scale size={32} style={{ color: 'var(--tx4)', margin: '0 auto 0.75rem' }} />
          <div style={{ color: 'var(--tx2)', fontWeight: 600 }}>Select a delivery order to reconcile</div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total DO Weight', value: `${totalWeightMT.toFixed(2)} MT`, icon: FileText, color: '#a78bfa' },
              { label: 'Total Expenses Logged', value: formatINR(totalExpenses), icon: Receipt, color: '#60a5fa' },
              { label: 'Approved Expenses', value: formatINR(approvedExpenses), icon: CheckCircle2, color: '#34d399' },
              { label: 'Pending Expenses', value: formatINR(pendingExpenses), icon: Clock, color: '#fbbf24' },
            ].map(k => {
              const Icon = k.icon
              return (
                <div key={k.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderTop: `3px solid ${k.color}`, borderRadius: '0.85rem', padding: '1rem 1.1rem' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${k.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.6rem' }}>
                    <Icon size={14} style={{ color: k.color }} />
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: k.color, fontVariantNumeric: 'tabular-nums' }}>{k.value}</div>
                  <div style={{ fontSize: '0.70rem', fontWeight: 700, color: 'var(--tx3)', marginTop: 2 }}>{k.label}</div>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--tx4)', marginTop: '-1rem', marginBottom: '1.5rem' }}>
            Note: the schema has no pricing/invoice data on delivery orders or jobs, so total billed value and variance-against-billing aren't shown — only what's actually recorded (weight and logged expenses).
          </p>

          {/* Jobs ledger */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)', marginBottom: '1.25rem' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--gb)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx1)' }}>Jobs ({doJobs.length})</div>
            {doJobs.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--tx4)', fontSize: '0.84rem' }}>No jobs linked to this DO yet</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="st-table">
                  <thead><tr><th>Job #</th><th>Customer</th><th>Agent</th><th>Status</th><th /></tr></thead>
                  <tbody>
                    {doJobs.map(j => {
                      const c = JOB_COLORS[j.status] ?? '#94a3b8'
                      return (
                        <tr key={j.id}>
                          <td className="cell-primary">{j.job_number}</td>
                          <td>{j.customer?.name ?? '—'}</td>
                          <td style={{ color: 'var(--tx3)' }}>{j.assigned_agent?.full_name ?? '—'}</td>
                          <td>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: `${c}22`, color: c, border: `1px solid ${c}44`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {JOB_STATUS_LABELS[j.status as JobStatus] ?? j.status}
                            </span>
                          </td>
                          <td>
                            <Link to={`/jobs/${j.id}`} style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                              View <ChevronRight size={12} />
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

          {/* Expenses ledger */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '0.85rem', overflow: 'hidden', boxShadow: 'var(--sh-card)' }}>
            <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--gb)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--tx1)' }}>Expenses ({doExpenses.length})</div>
            {doExpenses.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--tx4)', fontSize: '0.84rem' }}>No expenses logged against this DO's jobs</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="st-table">
                  <thead><tr><th>Job</th><th>Category</th><th>Payee</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {doExpenses.map(e => {
                      const job = jobs.find(j => j.id === e.job_id)
                      const c = EXP_COLORS[e.status] ?? '#94a3b8'
                      return (
                        <tr key={e.id}>
                          <td className="cell-primary">{job?.job_number ?? e.job_id}</td>
                          <td>{EXPENSE_CATEGORY_LABELS[e.category as ExpenseCategory] ?? e.category}</td>
                          <td style={{ color: 'var(--tx3)' }}>{e.payee_description}</td>
                          <td className="cell-mono">{formatINR(e.amount_inr)}</td>
                          <td>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.18rem 0.5rem', borderRadius: 999, background: `${c}22`, color: c, border: `1px solid ${c}44`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {e.status}
                            </span>
                          </td>
                          <td style={{ color: 'var(--tx3)', fontSize: '0.78rem' }}>{formatDate(e.created_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </PageShell>
  )
}
