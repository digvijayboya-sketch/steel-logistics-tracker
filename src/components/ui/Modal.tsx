import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
interface ModalProps { open: boolean; onClose: ()=>void; title: string; children: ReactNode; size?:'sm'|'md'|'lg' }
export const Modal = ({ open, onClose, title, children, size='md' }: ModalProps) => {
  useEffect(() => {
    const handler = (e:KeyboardEvent) => { if (e.key==='Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])
  if (!open) return null
  const widths = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 fade-in" />
      <div onClick={e=>e.stopPropagation()} className={`relative w-full ${widths[size]} bg-white rounded-2xl shadow-[--shadow-lg] slide-up sm:fade-in`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[--color-surface-border]">
          <h2 className="font-semibold text-[--color-ink]">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-[--color-ink-muted] hover:bg-[--color-surface-bg] transition"><X size={18}/></button>
        </div>
        <div className="overflow-y-auto max-h-[80vh] p-5">{children}</div>
      </div>
    </div>
  )
}
