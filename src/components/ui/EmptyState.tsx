import type { LucideIcon } from 'lucide-react'
interface Props { icon:LucideIcon; title:string; description?:string; action?:React.ReactNode }
export const EmptyState = ({ icon:Icon, title, description, action }:Props) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-12 h-12 rounded-2xl bg-[--color-surface-bg] flex items-center justify-center mb-4">
      <Icon size={22} className="text-[--color-ink-faint]" />
    </div>
    <h3 className="font-semibold text-[--color-ink] mb-1">{title}</h3>
    {description && <p className="text-sm text-[--color-ink-muted] max-w-xs mb-4">{description}</p>}
    {action}
  </div>
)
