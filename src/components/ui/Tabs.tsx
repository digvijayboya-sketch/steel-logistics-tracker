import { cls } from '@/lib/utils'
interface Tab { id:string; label:string; count?:number }
interface Props { tabs:Tab[]; active:string; onChange:(id:string)=>void }
export const Tabs = ({ tabs, active, onChange }:Props) => (
  <div className="flex gap-1 border-b border-[--color-surface-border] overflow-x-auto scrollbar-hide">
    {tabs.map(t=>(
      <button key={t.id} onClick={()=>onChange(t.id)} className={cls('flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors', active===t.id ? 'border-[--color-primary] text-[--color-primary]' : 'border-transparent text-[--color-ink-muted] hover:text-[--color-ink] hover:border-[--color-surface-border]')}>
        {t.label}
        {t.count !== undefined && <span className={cls('text-xs px-1.5 py-0.5 rounded-full font-semibold', active===t.id ? 'bg-[--color-primary-light] text-[--color-primary]' : 'bg-[--color-surface-divider] text-[--color-ink-muted]')}>{t.count}</span>}
      </button>
    ))}
  </div>
)
