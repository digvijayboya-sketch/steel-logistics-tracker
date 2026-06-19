import { cls } from '@/lib/utils'
import type { ReactNode } from 'react'
interface CardProps { children:ReactNode; className?:string; padding?:boolean; onClick?:()=>void }
export const Card = ({ children, className, padding=true, onClick }:CardProps) => (
  <div onClick={onClick} className={cls('card', padding && 'p-5', className)}>{children}</div>
)
