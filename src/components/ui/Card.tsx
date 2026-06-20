import { cls } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: boolean
  onClick?: () => void
  lift?: boolean
}

export const Card = ({ children, className, padding = true, onClick, lift = false }: CardProps) => (
  <div
    onClick={onClick}
    className={cls(
      'glass',
      lift && 'glass-lift',
      padding && 'p-5',
      onClick && 'cursor-pointer',
      className
    )}
  >
    {children}
  </div>
)
