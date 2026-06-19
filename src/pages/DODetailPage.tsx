import { useParams, Link } from 'react-router-dom'
import { DEMO_DOS, DEMO_JOBS } from '@/lib/demoData'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DOStatusBadge, JobStatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatINR } from '@/lib/utils'
import { ArrowLeft, FileText, Building2, Calendar, Package, Weight, Briefcase, ChevronRight } from 'lucide-react'

export const DODetailPage = () => {
  const { id } = useParams()
  const doRecord = DEMO_DOS.find(d => d.id === id)
  const jobs = DEMO_JOBS.filter(j => j.do_id === id)

  if (!doRecord) return (
    <div className="p-8 text-center text-[--color-ink-muted]">
      <FileText size={40} className="mx-auto mb-3 text-[--color-ink-faint]" />
      <p>Delivery Order not found.</p>
      <Link to="/dos" className="text-sm text-[--color-primary] hover:underline mt-2 inline-block">← Back to DOs</Link>
    </div>
  )

  const totalWeight = doRecord.items.reduce((a,i)=>a+i.weight_mt,0)
  const dispatchedJobs = jobs.filter(j=>['in_transit_to_customer','delivered'].includes(j.status)).length

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link to="/dos" className="inline-flex items-center gap-1.5 text-sm text-[--color-ink-muted] hover:text-[--color-ink] transition">
        <ArrowLeft size={15}/>Back to Delivery Orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-[--color-ink]">{doRecord.do_number}</h1>
            <DOStatusBadge status={doRecord.status} />
          </div>
          <p className="text-sm text-[--color-ink-muted] mt-1">{doRecord.supplier?.name} · {doRecord.source_service_centre?.name}</p>
        </div>
        <Button variant="secondary" onClick={()=>alert('Edit flow — connect to Supabase')}>Edit DO</Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon:Building2, label:'Supplier', value:doRecord.supplier?.name ?? '—' },
          { icon:FileText, label:'Source SC', value:doRecord.source_service_centre?.name ?? '—' },
          { icon:Calendar, label:'Collection Date', value:formatDate(doRecord.expected_collection_date) },
          { icon:Weight, label:'Total Weight', value:`${totalWeight.toFixed(1)} MT` },
        ].map(info=>(
          <Card key={info.label} className="flex items-start gap-3">
            <info.icon size={16} className="text-[--color-ink-faint] mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wide text-[--color-ink-faint] font-semibold">{info.label}</div>
              <div className="text-sm font-semibold text-[--color-ink] mt-0.5">{info.value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Items Table */}
      <Card padding={false}>
        <div className="px-5 py-3.5 border-b border-[--color-surface-border] flex items-center justify-between">
          <h2 className="font-semibold text-sm text-[--color-ink]">Coil Items ({doRecord.items.length})</h2>
          <span className="text-xs text-[--color-ink-faint]">{totalWeight.toFixed(1)} MT total</span>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr className="bg-[--color-surface-bg] border-b border-[--color-surface-border]">
                {['#','Grade','Thickness (mm)','Width (mm)','Qty','Weight (MT)'].map(h=>(
                  <th key={h} className="text-left text-xs font-semibold text-[--color-ink-muted] px-4 py-2.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-surface-divider]">
              {doRecord.items.map((item,idx)=>(
                <tr key={item.id} className="text-sm">
                  <td className="px-4 py-3 text-[--color-ink-faint]">{idx+1}</td>
                  <td className="px-4 py-3 font-medium text-[--color-ink]">{item.coil_grade}</td>
                  <td className="px-4 py-3 tabular">{item.thickness_mm}</td>
                  <td className="px-4 py-3 tabular">{item.width_mm}</td>
                  <td className="px-4 py-3 tabular">{item.quantity}</td>
                  <td className="px-4 py-3 tabular font-medium">{item.weight_mt.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Linked Jobs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-[--color-ink]">Linked Jobs ({jobs.length})</h2>
          <span className="text-xs text-[--color-ink-muted]">{dispatchedJobs}/{jobs.length} dispatched</span>
        </div>
        {jobs.length === 0 ? (
          <Card><EmptyState icon={Briefcase} title="No jobs yet" description="Planning team will create job assignments from this DO." /></Card>
        ) : (
          <div className="space-y-3">
            {jobs.map(job=>(
              <Link to={`/jobs/${job.id}`} key={job.id}>
                <Card className="flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{job.job_number}</span>
                      <JobStatusBadge status={job.status} />
                    </div>
                    <div className="text-xs text-[--color-ink-muted] mt-1">{job.customer?.name} · {job.delivery_destination}</div>
                    <div className="text-xs text-[--color-ink-faint] mt-0.5">{job.assigned_agent?.full_name} · {job.service_type.toUpperCase()}</div>
                  </div>
                  <ChevronRight size={16} className="text-[--color-ink-faint] flex-shrink-0" />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
