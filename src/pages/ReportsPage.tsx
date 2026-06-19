import { useState } from 'react'
import { DEMO_DOS, DEMO_JOBS, DEMO_EXPENSES, DEMO_DELIVERIES, DEMO_SERVICE_CENTRES } from '@/lib/demoData'
import { Card } from '@/components/ui/Card'
import { formatINR, formatDate, formatDateTime } from '@/lib/utils'
import { DOStatusBadge, JobStatusBadge, ExpenseStatusBadge } from '@/components/ui/StatusBadge'
import {
  BarChart2, FileText, Users, Receipt, Truck, Download,
  TrendingUp, Building2, AlertTriangle, CheckCircle2
} from 'lucide-react'
import { EXPENSE_CATEGORY_LABELS, SETTLEMENT_LABELS } from '@/types'

type ReportTab = 'do_lifecycle' | 'agent_activity' | 'expense_register' | 'delivery_perf' | 'reconciliation'

const TABS: { id: ReportTab; label: string; icon: React.ElementType }[] = [
  { id: 'do_lifecycle',    label: 'DO Lifecycle',       icon: FileText },
  { id: 'agent_activity',  label: 'Agent Activity',     icon: Users },
  { id: 'expense_register',label: 'Expense Register',   icon: Receipt },
  { id: 'delivery_perf',   label: 'Delivery Performance', icon: Truck },
  { id: 'reconciliation',  label: 'Reconciliation',     icon: BarChart2 },
]

const TableHeader = ({ cols }: { cols: string[] }) => (
  <thead>
    <tr className="border-b border-[--color-border]">
      {cols.map(c => <th key={c} className="text-left text-[10px] font-semibold uppercase tracking-wide text-[--color-ink-faint] py-2.5 pr-4 whitespace-nowrap">{c}</th>)}
    </tr>
  </thead>
)

const ExportBtn = ({ label }: { label: string }) => (
  <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[--color-border] rounded-lg text-[--color-ink-muted] hover:bg-[--color-surface-bg] transition-colors">
    <Download size={12} /> {label}
  </button>
)

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('do_lifecycle')

  // ── Derived data ──────────────────────────────────────────────────────────
  const doRows = DEMO_DOS.map(d => {
    const jobs = DEMO_JOBS.filter(j => j.do_id === d.id)
    const expenses = DEMO_EXPENSES.filter(e => jobs.some(j => j.id === e.job_id))
    const totalExpense = expenses.reduce((a, e) => a + e.amount_inr, 0)
    const pendingExp = expenses.filter(e => e.status === 'pending').reduce((a, e) => a + e.amount_inr, 0)
    return { ...d, jobs, totalExpense, pendingExp }
  })

  const agentMap: Record<string, { name: string; jobs: number; delivered: number; expenses: number; expenseAmt: number }> = {}
  DEMO_JOBS.forEach(j => {
    if (!j.assigned_agent_id) return
    const key = j.assigned_agent_id
    if (!agentMap[key]) agentMap[key] = { name: j.assigned_agent?.full_name ?? key, jobs: 0, delivered: 0, expenses: 0, expenseAmt: 0 }
    agentMap[key].jobs++
    if (j.status === 'delivered') agentMap[key].delivered++
    const jobExp = DEMO_EXPENSES.filter(e => e.job_id === j.id)
    agentMap[key].expenses += jobExp.length
    agentMap[key].expenseAmt += jobExp.reduce((a, e) => a + e.amount_inr, 0)
  })

  const scExpMap: Record<string, number> = {}
  DEMO_EXPENSES.forEach(e => {
    const job = DEMO_JOBS.find(j => j.id === e.job_id)
    const sc = job?.do?.source_service_centre?.name ?? 'Unknown'
    scExpMap[sc] = (scExpMap[sc] ?? 0) + e.amount_inr
  })

  const totalExpenses = DEMO_EXPENSES.reduce((a, e) => a + e.amount_inr, 0)
  const approvedExp = DEMO_EXPENSES.filter(e => e.status === 'approved').reduce((a, e) => a + e.amount_inr, 0)
  const pendingExp = DEMO_EXPENSES.filter(e => e.status === 'pending').reduce((a, e) => a + e.amount_inr, 0)
  const rejectedExp = DEMO_EXPENSES.filter(e => e.status === 'rejected').reduce((a, e) => a + e.amount_inr, 0)

  const deliveredCount = DEMO_DELIVERIES.filter(d => d.delivery_status === 'delivered').length
  const deviationCount = DEMO_DELIVERIES.filter(d => d.destination_changed).length
  const selfAuthCount = DEMO_DELIVERIES.filter(d => d.destination_changed && !d.authorised_by_office).length

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-[--color-ink]">Reports</h1>
          <p className="text-sm text-[--color-ink-muted] mt-0.5">Operational and financial reports across all modules</p>
        </div>
        <div className="flex gap-2">
          <ExportBtn label="Export Excel" />
          <ExportBtn label="Export PDF" />
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total DOs', value: DEMO_DOS.length, icon: FileText, color: 'bg-blue-50 text-blue-700' },
          { label: 'Total Jobs', value: DEMO_JOBS.length, icon: Building2, color: 'bg-violet-50 text-violet-700' },
          { label: 'Field Spend', value: formatINR(totalExpenses), icon: TrendingUp, color: 'bg-amber-50 text-amber-700' },
          { label: 'Deliveries', value: DEMO_DELIVERIES.length, icon: Truck, color: 'bg-green-50 text-green-700' },
        ].map(kpi => (
          <Card key={kpi.label} className="flex items-center gap-3 !p-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${kpi.color}`}>
              <kpi.icon size={14} />
            </div>
            <div>
              <div className="text-sm font-bold text-[--color-ink] tabular">{kpi.value}</div>
              <div className="text-[10px] text-[--color-ink-faint]">{kpi.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-[--color-border]">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap rounded-t-lg transition-colors border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'border-[--color-primary] text-[--color-primary] bg-[--color-primary]/5'
                  : 'border-transparent text-[--color-ink-muted] hover:text-[--color-ink]'}`}
            >
              <Icon size={12} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── DO Lifecycle ─────────────────────────────────────────────────── */}
      {activeTab === 'do_lifecycle' && (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <TableHeader cols={['DO Number','Supplier','Exp. Collection','Status','Jobs','Field Spend','Pending']} />
              <tbody className="divide-y divide-[--color-border]">
                {doRows.map(d => (
                  <tr key={d.id} className="hover:bg-[--color-surface-bg] transition-colors">
                    <td className="py-3 pr-4 font-semibold text-[--color-ink]">{d.do_number}</td>
                    <td className="py-3 pr-4 text-[--color-ink-muted]">{d.supplier?.name}</td>
                    <td className="py-3 pr-4 text-[--color-ink-muted]">{formatDate(d.expected_collection_date)}</td>
                    <td className="py-3 pr-4"><DOStatusBadge status={d.status} /></td>
                    <td className="py-3 pr-4 text-[--color-ink-muted] tabular">{d.jobs.length}</td>
                    <td className="py-3 pr-4 font-medium text-[--color-ink] tabular">{formatINR(d.totalExpense)}</td>
                    <td className="py-3 pr-4">
                      {d.pendingExp > 0
                        ? <span className="text-amber-700 font-medium">{formatINR(d.pendingExp)}</span>
                        : <span className="text-green-600">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Agent Activity ───────────────────────────────────────────────── */}
      {activeTab === 'agent_activity' && (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <TableHeader cols={['Agent','Total Jobs','Delivered','Completion %','Expenses Filed','Total Spend']} />
              <tbody className="divide-y divide-[--color-border]">
                {Object.entries(agentMap).map(([id, a]) => (
                  <tr key={id} className="hover:bg-[--color-surface-bg] transition-colors">
                    <td className="py-3 pr-4 font-semibold text-[--color-ink]">{a.name}</td>
                    <td className="py-3 pr-4 text-[--color-ink-muted] tabular">{a.jobs}</td>
                    <td className="py-3 pr-4 text-[--color-ink-muted] tabular">{a.delivered}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[--color-surface-divider] rounded-full h-1.5 w-16">
                          <div
                            className="bg-[--color-primary] h-1.5 rounded-full"
                            style={{ width: `${Math.round((a.delivered / a.jobs) * 100)}%` }}
                          />
                        </div>
                        <span className="tabular text-[--color-ink-muted]">{Math.round((a.delivered / a.jobs) * 100)}%</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-[--color-ink-muted] tabular">{a.expenses}</td>
                    <td className="py-3 pr-4 font-medium text-[--color-ink] tabular">{formatINR(a.expenseAmt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Expense Register ─────────────────────────────────────────────── */}
      {activeTab === 'expense_register' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Approved', formatINR(approvedExp), 'bg-green-50 text-green-700'],
              ['Pending',  formatINR(pendingExp),  'bg-amber-50 text-amber-700'],
              ['Rejected', formatINR(rejectedExp), 'bg-red-50 text-red-600'],
            ].map(([l, v, cls]) => (
              <Card key={l} className={`!p-3 ${cls}`}>
                <div className="text-[10px] font-medium uppercase tracking-wide opacity-60">{l}</div>
                <div className="text-base font-bold mt-0.5 tabular">{v}</div>
              </Card>
            ))}
          </div>
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <TableHeader cols={['Date','Agent','Category','Payee','Settlement','Amount','Status']} />
                <tbody className="divide-y divide-[--color-border]">
                  {DEMO_EXPENSES.map(e => (
                    <tr key={e.id} className="hover:bg-[--color-surface-bg] transition-colors">
                      <td className="py-3 pr-4 text-[--color-ink-muted] whitespace-nowrap">{formatDate(e.created_at)}</td>
                      <td className="py-3 pr-4 text-[--color-ink-muted]">{e.logged_by_profile?.full_name ?? e.logged_by}</td>
                      <td className="py-3 pr-4 text-[--color-ink-muted]">{EXPENSE_CATEGORY_LABELS[e.category]}</td>
                      <td className="py-3 pr-4 text-[--color-ink] max-w-[180px] truncate">{e.payee_description}</td>
                      <td className="py-3 pr-4 text-[--color-ink-muted]">{SETTLEMENT_LABELS[e.settlement_method]}</td>
                      <td className="py-3 pr-4 font-semibold text-[--color-ink] tabular">{formatINR(e.amount_inr)}</td>
                      <td className="py-3 pr-4"><ExpenseStatusBadge status={e.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Delivery Performance ─────────────────────────────────────────── */}
      {activeTab === 'delivery_perf' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ['Total Deliveries', DEMO_DELIVERIES.length, 'bg-blue-50 text-blue-700'],
              ['Confirmed',        deliveredCount,         'bg-green-50 text-green-700'],
              ['Destination Changes', deviationCount,      'bg-amber-50 text-amber-700'],
              ['Self-Authorised',  selfAuthCount,          'bg-red-50 text-red-600'],
            ].map(([l, v, cls]) => (
              <Card key={l as string} className={`!p-3 ${cls}`}>
                <div className="text-[10px] font-medium uppercase tracking-wide opacity-60">{l}</div>
                <div className="text-xl font-bold mt-0.5 tabular">{v}</div>
              </Card>
            ))}
          </div>
          <Card padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <TableHeader cols={['Job','Customer','Planned Dest.','Final Dest.','Vehicle','Delivered At','Status','Rerouted']} />
                <tbody className="divide-y divide-[--color-border]">
                  {DEMO_DELIVERIES.map(d => {
                    const job = DEMO_JOBS.find(j => j.id === d.job_id)
                    return (
                      <tr key={d.id} className="hover:bg-[--color-surface-bg] transition-colors">
                        <td className="py-3 pr-4 font-semibold text-[--color-ink]">{job?.job_number}</td>
                        <td className="py-3 pr-4 text-[--color-ink-muted]">{d.customer_name}</td>
                        <td className="py-3 pr-4 text-[--color-ink-muted] max-w-[120px] truncate">{d.old_destination ?? job?.delivery_destination}</td>
                        <td className="py-3 pr-4 text-[--color-ink] max-w-[120px] truncate">{d.delivery_address}</td>
                        <td className="py-3 pr-4 text-[--color-ink-muted]">{d.vehicle_number}</td>
                        <td className="py-3 pr-4 text-[--color-ink-muted] whitespace-nowrap">{formatDateTime(d.delivered_at)}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                            ${d.delivery_status === 'delivered' ? 'bg-green-50 text-green-700'
                              : d.delivery_status === 'partial' ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-600'}`}>
                            {d.delivery_status}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {d.destination_changed
                            ? <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                                ${d.authorised_by_office ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                {d.authorised_by_office ? '✓ Auth.' : '⚠ Self'}
                              </span>
                            : <span className="text-[--color-ink-faint]">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Reconciliation ───────────────────────────────────────────────── */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-4">
          {/* Settlement breakdown */}
          <Card>
            <h3 className="text-sm font-semibold text-[--color-ink] mb-3">Settlement Method Breakdown</h3>
            <div className="space-y-3">
              {(['agent_reimbursable','add_to_sc_invoice','add_to_supplier_bill'] as const).map(method => {
                const expenses = DEMO_EXPENSES.filter(e => e.settlement_method === method)
                const total = expenses.reduce((a, e) => a + e.amount_inr, 0)
                const pct = totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0
                return (
                  <div key={method}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-[--color-ink-muted]">{SETTLEMENT_LABELS[method]}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[--color-ink-faint]">{pct}%</span>
                        <span className="text-xs font-semibold text-[--color-ink] tabular">{formatINR(total)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-[--color-surface-divider] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[--color-primary] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* DO-wise reconciliation */}
          <Card padding={false}>
            <div className="px-4 pt-4 pb-2">
              <h3 className="text-sm font-semibold text-[--color-ink]">DO-wise Cost Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <TableHeader cols={['DO','SC Invoice Add-ons','Supplier Bill Add-ons','Agent Reimbursable','Approved','Pending','Total']} />
                <tbody className="divide-y divide-[--color-border]">
                  {doRows.map(d => {
                    const exp = DEMO_EXPENSES.filter(e => d.jobs.some(j => j.id === e.job_id))
                    const scInv = exp.filter(e => e.settlement_method === 'add_to_sc_invoice').reduce((a, e) => a + e.amount_inr, 0)
                    const suppBill = exp.filter(e => e.settlement_method === 'add_to_supplier_bill').reduce((a, e) => a + e.amount_inr, 0)
                    const agentPaid = exp.filter(e => e.settlement_method === 'agent_reimbursable').reduce((a, e) => a + e.amount_inr, 0)
                    const approved = exp.filter(e => e.status === 'approved').reduce((a, e) => a + e.amount_inr, 0)
                    const pending = exp.filter(e => e.status === 'pending').reduce((a, e) => a + e.amount_inr, 0)
                    const total = exp.reduce((a, e) => a + e.amount_inr, 0)
                    return (
                      <tr key={d.id} className="hover:bg-[--color-surface-bg] transition-colors">
                        <td className="py-3 pr-4 font-semibold text-[--color-ink]">{d.do_number}</td>
                        <td className="py-3 pr-4 tabular text-[--color-ink-muted]">{scInv > 0 ? formatINR(scInv) : '—'}</td>
                        <td className="py-3 pr-4 tabular text-[--color-ink-muted]">{suppBill > 0 ? formatINR(suppBill) : '—'}</td>
                        <td className="py-3 pr-4 tabular text-[--color-ink-muted]">{agentPaid > 0 ? formatINR(agentPaid) : '—'}</td>
                        <td className="py-3 pr-4 tabular text-green-700 font-medium">{approved > 0 ? formatINR(approved) : '—'}</td>
                        <td className="py-3 pr-4 tabular text-amber-700 font-medium">{pending > 0 ? formatINR(pending) : '—'}</td>
                        <td className="py-3 pr-4 tabular font-semibold text-[--color-ink]">{total > 0 ? formatINR(total) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* SC expense heatmap */}
          <Card>
            <h3 className="text-sm font-semibold text-[--color-ink] mb-3">Expense by Service Centre</h3>
            <div className="space-y-2.5">
              {Object.entries(scExpMap).map(([sc, amt]) => {
                const max = Math.max(...Object.values(scExpMap))
                const pct = Math.round((amt / max) * 100)
                return (
                  <div key={sc}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-[--color-ink-muted]">{sc}</span>
                      <span className="text-xs font-semibold text-[--color-ink] tabular">{formatINR(amt)}</span>
                    </div>
                    <div className="h-2 bg-[--color-surface-divider] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[--color-primary]/70" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
