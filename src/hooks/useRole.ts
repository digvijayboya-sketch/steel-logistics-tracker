import { useAuthStore } from '@/store/appStore'
import type { UserRole } from '@/types'

/**
 * Role groups
 *  admin + manager  → full authority (view/create/edit/approve everything)
 *  planner + purchase → operational (create DOs & Jobs, view all, approve expenses)
 *  agent             → field only (own jobs, SC queue, deliveries, expenses)
 */
export const useRole = () => {
  const { user } = useAuthStore()
  const role = user?.role as UserRole | undefined

  const is = (r: UserRole | UserRole[]) =>
    Array.isArray(r) ? r.includes(role as UserRole) : role === r

  const isAdmin    = is(['admin', 'manager'] as any)  // treat manager === admin
  const isOps      = is(['planner', 'purchase'])       // operational
  const isAgent    = is('agent')
  const canManage  = isAdmin || isOps                  // can see full lists
  const canApprove = isAdmin                           // approve/reject expenses & DOs
  const canCreate  = isAdmin || isOps                  // create DOs & jobs

  return { role, is, isAdmin, isOps, isAgent, canManage, canApprove, canCreate, user }
}

export const ROLE_META: Record<string, { label: string; color: string; bg: string; accent: string }> = {
  admin:    { label: 'Admin',          color: '#c4b5fd', bg: 'rgba(167,139,250,0.16)', accent: '#a78bfa' },
  manager:  { label: 'Manager',        color: '#6ee7b7', bg: 'rgba(52,211,153,0.16)',  accent: '#34d399' },
  planner:  { label: 'Planner',        color: '#93c5fd', bg: 'rgba(96,165,250,0.16)',  accent: '#60a5fa' },
  purchase: { label: 'Purchase',       color: '#fcd34d', bg: 'rgba(251,191,36,0.16)',  accent: '#fbbf24' },
  agent:    { label: 'Delivery Agent', color: '#5eead4', bg: 'rgba(45,212,191,0.16)',  accent: '#2dd4bf' },
}
