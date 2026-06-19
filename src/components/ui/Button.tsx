import { cls } from '@/lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const BASE = 'inline-flex items-center gap-2 font-medium rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-primary] disabled:opacity-50 disabled:cursor-not-allowed'
const VARIANTS = {
  primary:   'bg-[--color-primary] text-white hover:bg-[--color-primary-dark] shadow-sm',
  secondary: 'bg-white border border-[--color-surface-border] text-[--color-ink] hover:bg-[--color-surface-bg] shadow-sm',
  ghost:     'text-[--color-ink-muted] hover:text-[--color-ink] hover:bg-[--color-surface-bg]',
  danger:    'bg-[--color-error] text-white hover:opacity-90 shadow-sm',
}
const SIZES = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-sm px-5 py-2.5',
}

export const Button = ({ variant='primary', size='md', className, children, ...rest }: ButtonProps) => (
  <button {...rest} className={cls(BASE, VARIANTS[variant], SIZES[size], className)}>
    {children}
  </button>
)
