import { cls } from '@/lib/utils'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; hint?: string }
export const Input = ({ label, error, hint, className, id, ...rest }: InputProps) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g,'_')
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-[--color-ink]">{label}</label>}
      <input id={inputId} {...rest} className={cls('w-full px-3 py-2 text-sm rounded-lg border border-[--color-surface-border] bg-white placeholder:text-[--color-ink-faint] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary] transition', error && 'border-[--color-error]', className)} />
      {hint && !error && <p className="text-xs text-[--color-ink-muted]">{hint}</p>}
      {error && <p className="text-xs text-[--color-error]">{error}</p>}
    </div>
  )
}

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> { label?:string; error?:string; children: React.ReactNode }
export const Select = ({ label, error, children, className, id, ...rest }:SelectProps) => {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g,'_')
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={selectId} className="text-sm font-medium text-[--color-ink]">{label}</label>}
      <select id={selectId} {...(rest as TextareaHTMLAttributes<HTMLSelectElement>)} className={cls('w-full px-3 py-2 text-sm rounded-lg border border-[--color-surface-border] bg-white focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary] transition', error && 'border-[--color-error]', className)}>
        {children}
      </select>
      {error && <p className="text-xs text-[--color-error]">{error}</p>}
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> { label?:string; error?:string }
export const Textarea = ({ label, error, className, id, ...rest }:TextareaProps) => {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g,'_')
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={textareaId} className="text-sm font-medium text-[--color-ink]">{label}</label>}
      <textarea id={textareaId} rows={3} {...rest} className={cls('w-full px-3 py-2 text-sm rounded-lg border border-[--color-surface-border] bg-white placeholder:text-[--color-ink-faint] focus:outline-none focus:ring-2 focus:ring-[--color-primary]/30 focus:border-[--color-primary] transition resize-none', error && 'border-[--color-error]', className)} />
      {error && <p className="text-xs text-[--color-error]">{error}</p>}
    </div>
  )
}
