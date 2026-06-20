import { cls } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
  onClick?: () => void
  /** Use 'light' for content on light-bg areas (e.g. modal interiors) */
  variant?: 'glass' | 'light'
}

export const Card = ({ children, className, padding = true, onClick, variant = 'glass' }: CardProps) => (
  <div
    onClick={onClick}
    className={cls(
      variant === 'light' ? 'card-light' : 'card',
      padding && 'p-5',
      onClick && 'cursor-pointer',
      className
    )}
  >
    {children}
  </div>
)
