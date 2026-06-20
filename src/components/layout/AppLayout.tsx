import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { cls } from '@/lib/utils'
import {
  LayoutDashboard, FileText, Briefcase, Factory,
  Receipt, Truck, BarChart3, LogOut, X
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard, emoji: '📊', roles: ['admin','planner','purchase','agent'] },
  { to: '/dos',        label: 'Orders',     icon: FileText,        emoji: '📋', roles: ['admin','planner','purchase'] },
  { to: '/jobs',       label: 'Jobs',       icon: Briefcase,       emoji: '💼', roles: ['admin','planner','agent'] },
  { to: '/queue',      label: 'SC Queue',   icon: Factory,         emoji: '🏭', roles: ['admin','planner','agent'] },
  { to: '/expenses',   label: 'Expenses',   icon: Receipt,         emoji: '💰', roles: ['admin','planner','agent'] },
  { to: '/deliveries', label: 'Deliveries', icon: Truck,           emoji: '🚚', roles: ['admin','planner','agent'] },
  { to: '/reports',    label: 'Reports',    icon: BarChart3,       emoji: '📈', roles: ['admin','planner','purchase'] },
]

const ROLE_PILL: Record<string, { bg: string; text: string; label: string }> = {
  admin:    { bg: 'rgba(139,92,246,0.25)',  text: '#c4b5fd', label: 'Admin' },
  planner:  { bg: 'rgba(59,130,246,0.25)', text: '#93c5fd', label: 'Planner' },
  purchase: { bg: 'rgba(251,191,36,0.22)', text: '#fcd34d', label: 'Purchase' },
  agent:    { bg: 'rgba(45,212,191,0.22)', text: '#5eead4', label: 'Agent' },
}

/* ── Logo mark ─────────────────────────────────────────────────────────────── */
const Logo = ({ size = 32 }: { size?: number }) => (
  <div
    style={{ width: size, height: size, borderRadius: size * 0.3, flexShrink: 0 }}
    className="flex items-center justify-center"
    style={{
      width: size, height: size,
      borderRadius: size * 0.3,
      background: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)',
      boxShadow: '0 0 16px rgba(45,212,191,0.45)',
      flexShrink: 0,
    }}
  >
    <svg viewBox="0 0 24 24" fill="none" width={size * 0.58} height={size * 0.58}>
      <rect x="3" y="3"  width="8" height="8" rx="1.5" fill="white" opacity="0.95"/>
      <rect x="13" y="3" width="8" height="8" rx="1.5" fill="white" opacity="0.55"/>
      <rect x="3" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.55"/>
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.95"/>
    </svg>
  </div>
)

/* ── Sidebar nav item ───────────────────────────────────────────────────────── */
const SideNavItem = ({ item, onClose }: { item: typeof NAV_ITEMS[0]; onClose?: () => void }) => (
  <NavLink
    to={item.to}
    onClick={onClose}
    className={({ isActive }) => cls(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden',
      isActive
        ? 'text-[#0d2137]'
        : 'text-white/60 hover:text-white/90'
    )}
    style={({ isActive }) => isActive ? {
      background: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)',
      boxShadow: '0 4px 16px rgba(45,212,191,0.35)',
    } : {}}
  >
    {({ isActive }) => (
      <>
        {/* Hover glow layer */}
        {!isActive && (
          <span
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          />
        )}
        <span
          className={cls(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
            isActive ? 'bg-white/20' : 'bg-white/08 group-hover:bg-white/12'
          )}
          style={isActive ? {} : { background: 'rgba(255,255,255,0.08)' }}
        >
          <item.icon size={16} />
        </span>
        <span className="flex-1 leading-tight">{item.label}</span>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
        )}
      </>
    )}
  </NavLink>
)

/* ── Sidebar ────────────────────────────────────────────────────────────────── */
const SidebarContent = ({
  visibleNav, user, onClose, handleLogout
}: {
  visibleNav: typeof NAV_ITEMS;
  user: ReturnType<typeof useAuthStore>["user"] & {};
  onClose?: () => void;
  handleLogout: () => void;
}) => {
  const pill = user ? ROLE_PILL[user.role] : null

  return (
    <div className="flex flex-col h-full">
      {/* Logo strip */}
      <div className="px-4 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
        <div className="flex items-center gap-3">
          <Logo size={38} />
          <div>
            <div className="text-base font-bold text-white leading-tight tracking-tight">SteelTrack</div>
            <div className="text-[10px] font-medium uppercase tracking-widest" style={{ color: 'rgba(45,212,191,0.8)' }}>Logistics</div>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div className="px-4 pt-5 pb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>Navigation</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {visibleNav.map(item => (
          <SideNavItem key={item.to} item={item} onClose={onClose} />
        ))}
      </nav>

      {/* User footer */}
      {user && pill && (
        <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: '0.75rem' }}>
          <div
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2dd4bf, #0d9488)', color: '#0d2137', boxShadow: '0 0 10px rgba(45,212,191,0.35)' }}
            >
              {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate leading-tight">{user.name}</div>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block"
                style={{ background: pill.bg, color: pill.text }}
              >
                {pill.label}
              </span>
            </div>
            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.40)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.40)')}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Bottom tab bar (mobile) ────────────────────────────────────────────────── */
const BottomTabBar = ({ visibleNav }: { visibleNav: typeof NAV_ITEMS }) => {
  // Show max 5 items; rest accessible via a menu if needed
  const tabs = visibleNav.slice(0, 5)
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch"
      style={{
        background: 'rgba(13,33,55,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.12)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        minHeight: 60,
      }}
    >
      {tabs.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all"
          style={({ isActive }) => ({
            color: isActive ? '#2dd4bf' : 'rgba(255,255,255,0.45)',
          })}
        >
          {({ isActive }) => (
            <>
              <span
                className="flex items-center justify-center w-9 h-7 rounded-xl transition-all"
                style={isActive ? {
                  background: 'rgba(45,212,191,0.18)',
                  boxShadow: '0 0 12px rgba(45,212,191,0.3)',
                } : {}}
              >
                <item.icon size={19} strokeWidth={isActive ? 2.2 : 1.7} />
              </span>
              <span
                className="text-[10px] font-semibold leading-none"
                style={{ letterSpacing: '0.02em' }}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

/* ── AppLayout ──────────────────────────────────────────────────────────────── */
export const AppLayout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const visibleNav = NAV_ITEMS.filter(n => user && n.roles.includes(user.role))

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0"
        style={{
          background: 'rgba(13,33,55,0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        {user && (
          <SidebarContent
            visibleNav={visibleNav}
            user={user}
            handleLogout={handleLogout}
          />
        )}
      </aside>

      {/* ── Mobile drawer overlay ─────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer */}
          <aside
            className="relative w-72 h-full"
            style={{
              background: 'rgba(13,33,55,0.88)',
              backdropFilter: 'blur(28px)',
              WebkitBackdropFilter: 'blur(28px)',
              borderRight: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '4px 0 40px rgba(0,0,0,0.4)',
            }}
          >
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,255,255,0.50)' }}
            >
              <X size={18} />
            </button>
            {user && (
              <SidebarContent
                visibleNav={visibleNav}
                user={user}
                onClose={() => setDrawerOpen(false)}
                handleLogout={handleLogout}
              />
            )}
          </aside>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile top bar */}
        <header
          className="lg:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{
            background: 'rgba(13,33,55,0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl flex flex-col gap-1.5 transition"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            aria-label="Open menu"
          >
            <span style={{ display:'block', width:18, height:2, borderRadius:2, background:'rgba(255,255,255,0.8)' }} />
            <span style={{ display:'block', width:14, height:2, borderRadius:2, background:'rgba(255,255,255,0.8)' }} />
            <span style={{ display:'block', width:18, height:2, borderRadius:2, background:'rgba(255,255,255,0.8)' }} />
          </button>
          <Logo size={30} />
          <div>
            <div className="text-sm font-bold text-white leading-tight">SteelTrack</div>
            <div className="text-[9px] uppercase tracking-widest" style={{ color: 'rgba(45,212,191,0.8)' }}>Logistics</div>
          </div>
          {/* Spacer + role badge */}
          <div className="ml-auto">
            {user && (
              <span
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: ROLE_PILL[user.role]?.bg ?? 'rgba(255,255,255,0.12)',
                  color: ROLE_PILL[user.role]?.text ?? 'white',
                }}
              >
                {ROLE_PILL[user.role]?.label ?? user.role}
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom tab bar ──────────────────────────────────────────── */}
      <BottomTabBar visibleNav={visibleNav} />
    </div>
  )
}
