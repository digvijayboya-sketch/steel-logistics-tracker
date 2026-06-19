import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { cls } from '@/lib/utils'
import {
  LayoutDashboard, FileText, Briefcase, Factory,
  Receipt, Truck, BarChart3, LogOut, Menu, X, ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { to:'/dashboard', label:'Dashboard',      icon:LayoutDashboard, roles:['admin','planner','purchase','agent'] },
  { to:'/dos',       label:'Delivery Orders', icon:FileText,         roles:['admin','planner','purchase'] },
  { to:'/jobs',      label:'Jobs',            icon:Briefcase,        roles:['admin','planner','agent'] },
  { to:'/queue',     label:'SC Queue',        icon:Factory,          roles:['admin','planner','agent'] },
  { to:'/expenses',  label:'Expenses',        icon:Receipt,          roles:['admin','planner','agent'] },
  { to:'/deliveries',label:'Deliveries',      icon:Truck,            roles:['admin','planner','agent'] },
  { to:'/reports',   label:'Reports',         icon:BarChart3,        roles:['admin','planner','purchase'] },
]

const ROLE_COLOR: Record<string, string> = {
  admin:'bg-violet-100 text-violet-700',
  planner:'bg-blue-100 text-blue-700',
  purchase:'bg-amber-100 text-amber-700',
  agent:'bg-teal-100 text-teal-700',
}

export const AppLayout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const visibleNav = NAV_ITEMS.filter(n => user && n.roles.includes(user.role))

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[--color-surface-border]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[--color-primary] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <rect x="3" y="3" width="8" height="8" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="13" y="3" width="8" height="8" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="3" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-[--color-ink] leading-tight">SteelTrack</div>
            <div className="text-[10px] text-[--color-ink-faint] uppercase tracking-wide">Logistics</div>
          </div>
        </div>
      </div>
      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(item => (
          <NavLink key={item.to} to={item.to} onClick={()=>setSidebarOpen(false)}
            className={({isActive}) => cls(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group',
              isActive
                ? 'bg-[--color-primary] text-white shadow-sm'
                : 'text-[--color-ink-muted] hover:text-[--color-ink] hover:bg-[--color-surface-bg]'
            )}>
            {({isActive}) => (
              <>
                <item.icon size={17} className={isActive ? 'text-white' : 'text-[--color-ink-faint] group-hover:text-[--color-ink]'} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="text-white/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      {/* User */}
      {user && (
        <div className="px-3 py-4 border-t border-[--color-surface-border]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[--color-surface-bg]">
            <div className="w-8 h-8 rounded-full bg-[--color-primary-light] flex items-center justify-center text-xs font-bold text-[--color-primary]">
              {user.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[--color-ink] truncate">{user.name}</div>
              <span className={cls('text-[10px] px-1.5 py-0.5 rounded-full font-medium', ROLE_COLOR[user.role])}>{user.role}</span>
            </div>
            <button onClick={handleLogout} title="Logout" className="p-1 rounded-lg text-[--color-ink-faint] hover:text-[--color-error] transition">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[--color-bg]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-[--color-surface-border] flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setSidebarOpen(false)} />
          <aside className="relative w-64 h-full bg-white shadow-xl">
            <button onClick={()=>setSidebarOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-[--color-ink-muted] hover:bg-[--color-surface-bg]">
              <X size={18}/>
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-[--color-surface-border]">
          <button onClick={()=>setSidebarOpen(true)} className="p-1.5 rounded-lg text-[--color-ink-muted] hover:bg-[--color-surface-bg]">
            <Menu size={20}/>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[--color-primary] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                <rect x="3" y="3" width="8" height="8" rx="1.5" fill="white"/>
                <rect x="13" y="3" width="8" height="8" rx="1.5" fill="white" opacity="0.6"/>
                <rect x="3" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.6"/>
                <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-[--color-ink]">SteelTrack</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
