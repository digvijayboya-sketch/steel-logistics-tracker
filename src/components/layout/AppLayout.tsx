import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import {
  FileText, Briefcase, Factory,
  Receipt, Truck, BarChart3, LogOut, X, Sun, Moon, LayoutDashboard
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { DEMO_DOS, DEMO_JOBS, DEMO_EXPENSES, DEMO_DELIVERIES } from '@/lib/demoData'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard, roles: ['admin','planner','purchase','manager','agent'] },
  { to: '/dos',        label: 'Orders',    icon: FileText,         roles: ['admin','planner','purchase','manager'] },
  { to: '/jobs',       label: 'Jobs',      icon: Briefcase,        roles: ['admin','planner','agent','manager'] },
  { to: '/queue',      label: 'SC Queue',  icon: Factory,          roles: ['admin','planner','agent','manager'] },
  { to: '/expenses',   label: 'Expenses',  icon: Receipt,          roles: ['admin','planner','agent','manager'] },
  { to: '/deliveries', label: 'Deliveries',icon: Truck,            roles: ['admin','planner','agent','manager'] },
  { to: '/reports',    label: 'Reports',   icon: BarChart3,        roles: ['admin','planner','purchase','manager'] },
]

const NAV_COUNTS: Record<string, number> = {
  '/dos':        2,
  '/jobs':       3,
  '/queue':      3,
  '/expenses':   4,
  '/deliveries': 9,
}

const ROLE_PILL: Record<string, { bg: string; text: string; label: string }> = {
  admin:    { bg: 'rgba(139,92,246,0.25)',  text: '#c4b5fd', label: 'Admin' },
  planner:  { bg: 'rgba(59,130,246,0.25)', text: '#93c5fd', label: 'Planner' },
  purchase: { bg: 'rgba(251,191,36,0.22)', text: '#fcd34d', label: 'Purchase' },
  agent:    { bg: 'rgba(45,212,191,0.22)', text: '#5eead4', label: 'Delivery Agent' },
  manager:  { bg: 'rgba(16,185,129,0.22)', text: '#6ee7b7', label: 'Manager' },
}

/* ── Logo ──────────────────────────────────────────────────────── */
const Logo = ({ size = 34 }: { size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
    background: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)',
    boxShadow: '0 0 18px rgba(45,212,191,0.50)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <svg viewBox="0 0 24 24" fill="none" width={size * 0.56} height={size * 0.56}>
      <rect x="3"  y="3"  width="8" height="8" rx="1.5" fill="white" opacity="0.95"/>
      <rect x="13" y="3"  width="8" height="8" rx="1.5" fill="white" opacity="0.50"/>
      <rect x="3"  y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.50"/>
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.95"/>
    </svg>
  </div>
)

/* ── Theme ──────────────────────────────────────────────────────── */
const useTheme = () => {
  const [theme, setTheme] = useState<'dark'|'light'>(() => {
    try { return (localStorage.getItem('st-theme') as 'dark'|'light') || 'dark' } catch { return 'dark' }
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('st-theme', theme) } catch {}
  }, [theme])
  return { theme, toggle: () => setTheme(t => t === 'dark' ? 'light' : 'dark') }
}

/* ── Sidebar nav item ───────────────────────────────────────────── */
const SideNavItem = ({ item, onClose }: { item: typeof NAV_ITEMS[0]; onClose?: () => void }) => {
  const count = NAV_COUNTS[item.to]
  return (
    <NavLink
      to={item.to}
      onClick={onClose}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0.55rem 0.75rem',
        borderRadius: '0.65rem',
        fontSize: '0.82rem', fontWeight: 500,
        textDecoration: 'none',
        transition: 'all 0.15s',
        color: isActive ? '#0d2137' : 'rgba(255,255,255,0.60)',
        background: isActive
          ? 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)'
          : 'transparent',
        boxShadow: isActive ? '0 4px 16px rgba(45,212,191,0.30)' : 'none',
      })}
    >
      {({ isActive }) => (
        <>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: isActive ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.06)',
          }}>
            <item.icon size={14} />
          </span>
          <span style={{ flex: 1 }}>{item.label}</span>
          {count !== undefined && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700,
              minWidth: 20, height: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '999px',
              background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(45,212,191,0.20)',
              color: isActive ? '#0d2137' : '#2dd4bf',
              padding: '0 5px',
            }}>
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

/* ── Sidebar ────────────────────────────────────────────────────── */
const Sidebar = ({ visibleNav, user, handleLogout, onClose }: {
  visibleNav: typeof NAV_ITEMS; user: any; handleLogout: () => void; onClose?: () => void
}) => {
  const { theme, toggle } = useTheme()
  const pill = user ? ROLE_PILL[user.role] : null
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'rgba(13,17,23,0.95)',
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.1rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo size={34} />
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'rgba(255,255,255,0.92)', lineHeight: 1.1 }}>SteelTrack</div>
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Logistics &amp; Dispatch</div>
          </div>
        </div>
        <button onClick={toggle}
          style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'rgba(255,255,255,0.50)',
          }}>
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>

      {/* Modules label */}
      <div style={{ padding: '1rem 1rem 0.4rem', fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
        Modules
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.2rem 0.6rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {visibleNav.map(item => (
          <SideNavItem key={item.to} item={item} onClose={onClose} />
        ))}
      </nav>

      {/* User footer */}
      {user && pill && (
        <div style={{ padding: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0.6rem 0.75rem', borderRadius: '0.65rem',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #2dd4bf, #0d9488)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 800, color: '#0d2137',
              boxShadow: '0 0 10px rgba(45,212,191,0.40)',
            }}>
              {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.88)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, color: pill.text }}>{pill.label}</div>
            </div>
            <button onClick={handleLogout} title="Sign Out"
              style={{
                padding: '0.35rem 0.6rem', borderRadius: 8,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
                color: '#f87171', letterSpacing: '0.02em',
              }}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Bottom tab bar (mobile) ────────────────────────────────────── */
const BottomTabBar = ({ visibleNav }: { visibleNav: typeof NAV_ITEMS }) => (
  <nav style={{
    display: 'flex', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
    background: 'rgba(13,17,23,0.97)', borderTop: '1px solid rgba(255,255,255,0.07)',
    paddingBottom: 'env(safe-area-inset-bottom)', minHeight: 56,
  }} className="lg-hide">
    {visibleNav.filter(i => i.to !== '/dashboard').slice(0, 5).map(item => (
      <NavLink key={item.to} to={item.to}
        style={({ isActive }) => ({
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 2, padding: '0.4rem 0', textDecoration: 'none',
          color: isActive ? '#2dd4bf' : 'rgba(255,255,255,0.35)',
          fontSize: '0.58rem', fontWeight: 600,
        })}
      >
        {({ isActive }) => (
          <>
            <span style={{
              width: 36, height: 26, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isActive ? 'rgba(45,212,191,0.15)' : 'transparent',
            }}>
              <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.6} />
            </span>
            <span>{item.label}</span>
          </>
        )}
      </NavLink>
    ))}
  </nav>
)

/* ── AppLayout ──────────────────────────────────────────────────── */
export const AppLayout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const visibleNav = NAV_ITEMS.filter(n => user && n.roles.includes(user.role))

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0b1015', color: 'rgba(255,255,255,0.88)' }}>

      {/* Desktop sidebar */}
      <aside style={{
        width: 230, flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'none',  // overridden by className below
      }} className="desktop-sidebar">
        <style>{`.desktop-sidebar { display: flex !important; flex-direction: column; } @media (max-width: 1023px) { .desktop-sidebar { display: none !important; } .lg-hide { display: flex !important; } } @media (min-width: 1024px) { .lg-hide { display: none !important; } }`}</style>
        {user && <Sidebar visibleNav={visibleNav} user={user} handleLogout={handleLogout} />}
      </aside>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setDrawerOpen(false)} />
          <aside style={{
            position: 'relative', width: 240, height: '100%',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '4px 0 40px rgba(0,0,0,0.50)',
            zIndex: 1,
          }}>
            <button onClick={() => setDrawerOpen(false)}
              style={{
                position: 'absolute', top: 14, right: 14, zIndex: 2,
                background: 'rgba(255,255,255,0.06)', border: 'none',
                borderRadius: 8, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.60)',
              }}>
              <X size={16} />
            </button>
            {user && <Sidebar visibleNav={visibleNav} user={user} handleLogout={handleLogout} onClose={() => setDrawerOpen(false)} />}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Mobile topbar */}
        <header style={{
          display: 'none',
          alignItems: 'center', gap: 10,
          padding: '0.65rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(13,17,23,0.97)',
          flexShrink: 0,
        }} className="mobile-topbar">
          <style>{`.mobile-topbar { display: none !important; } @media (max-width: 1023px) { .mobile-topbar { display: flex !important; } }`}</style>
          <button onClick={() => setDrawerOpen(true)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ display: 'block', width: 16, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.80)' }} />
            <span style={{ display: 'block', width: 11, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.80)' }} />
            <span style={{ display: 'block', width: 16, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.80)' }} />
          </button>
          <Logo size={26} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'rgba(255,255,255,0.92)' }}>SteelTrack</div>
            <div style={{ fontSize: '0.58rem', color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Logistics</div>
          </div>
          {user && (
            <span style={{
              marginLeft: 'auto', fontSize: '0.62rem', fontWeight: 700,
              padding: '0.25rem 0.6rem', borderRadius: 999,
              background: ROLE_PILL[user.role]?.bg ?? 'rgba(255,255,255,0.1)',
              color: ROLE_PILL[user.role]?.text ?? '#fff',
            }}>
              {ROLE_PILL[user.role]?.label ?? user.role}
            </span>
          )}
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 64 }}>
          <Outlet />
        </main>
      </div>

      <BottomTabBar visibleNav={visibleNav} />
    </div>
  )
}
