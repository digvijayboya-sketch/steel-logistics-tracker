import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import {
  FileText, Briefcase, Factory,
  Receipt, Truck, BarChart3, LogOut, X, Sun, Moon, LayoutDashboard, Menu, Database,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard, roles: ['admin','planner','purchase','manager','agent'] },
  { to: '/dos',        label: 'Orders',     icon: FileText,         roles: ['admin','planner','purchase','manager'] },
  { to: '/jobs',       label: 'Jobs',       icon: Briefcase,        roles: ['admin','planner','agent','manager'] },
  { to: '/queue',      label: 'SC Queue',   icon: Factory,          roles: ['admin','planner','agent','manager'] },
  { to: '/expenses',   label: 'Expenses',   icon: Receipt,          roles: ['admin','planner','agent','manager'] },
  { to: '/deliveries', label: 'Deliveries', icon: Truck,            roles: ['admin','planner','agent','manager'] },
  { to: '/reports',    label: 'Reports',    icon: BarChart3,        roles: ['admin','planner','purchase','manager'] },
  { to: '/master',     label: 'Master Data',icon: Database,         roles: ['admin'] },
]

const ROLE_PILL: Record<string, { bg: string; color: string; label: string }> = {
  admin:    { bg: 'rgba(167,139,250,0.18)', color: '#c4b5fd', label: 'Admin' },
  planner:  { bg: 'rgba(96,165,250,0.18)',  color: '#93c5fd', label: 'Planner' },
  purchase: { bg: 'rgba(251,191,36,0.18)',  color: '#fcd34d', label: 'Purchase' },
  agent:    { bg: 'rgba(45,212,191,0.18)',  color: '#5eead4', label: 'Delivery Agent' },
  manager:  { bg: 'rgba(52,211,153,0.18)',  color: '#6ee7b7', label: 'Manager' },
}

const LogoIcon = ({ size = 34 }: { size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: Math.round(size * 0.28),
    flexShrink: 0,
    background: 'linear-gradient(140deg, #2dd4bf 0%, #0d9488 100%)',
    boxShadow: '0 0 20px rgba(45,212,191,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <svg viewBox="0 0 24 24" fill="none" width={size * 0.56} height={size * 0.56}>
      <rect x="3"  y="3"  width="8" height="8" rx="1.5" fill="white" opacity="0.95"/>
      <rect x="13" y="3"  width="8" height="8" rx="1.5" fill="white" opacity="0.45"/>
      <rect x="3"  y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.45"/>
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.95"/>
    </svg>
  </div>
)

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

const SideNavItem = ({ item, onClose }: { item: typeof NAV_ITEMS[0]; onClose?: () => void }) => {
  const isMaster = item.to === '/master'
  return (
    <NavLink
      to={item.to}
      onClick={onClose}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '0.52rem 0.7rem',
        borderRadius: '0.6rem',
        fontSize: '0.84rem', fontWeight: isActive ? 600 : 500,
        textDecoration: 'none',
        letterSpacing: '0.005em',
        transition: 'all 0.14s ease',
        color: isActive ? '#07211e' : isMaster ? '#c4b5fd' : 'var(--tx2)',
        background: isActive
          ? (isMaster ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : 'linear-gradient(135deg,#2dd4bf,#0d9488)')
          : (isMaster ? 'rgba(167,139,250,0.07)' : 'transparent'),
        boxShadow: isActive ? '0 3px 14px rgba(124,58,237,0.28)' : 'none',
        border: isMaster && !isActive ? '1px solid rgba(167,139,250,0.18)' : '1px solid transparent',
        marginTop: isMaster ? '0.4rem' : 0,
      })}
    >
      {({ isActive }) => (
        <>
          <span style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isActive ? 'rgba(255,255,255,0.22)' : isMaster ? 'rgba(167,139,250,0.15)' : 'var(--g2)',
          }}>
            <item.icon size={14} />
          </span>
          <span style={{ flex: 1, lineHeight: 1 }}>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

const Sidebar = ({ visibleNav, user, handleLogout, onClose }: {
  visibleNav: typeof NAV_ITEMS; user: any; handleLogout: () => void; onClose?: () => void
}) => {
  const { theme, toggle } = useTheme()
  const pill = user ? ROLE_PILL[user.role] : null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--sidebar-bg)', transition: 'background 0.3s ease' }}>
      <div style={{ padding: '1rem 0.9rem', borderBottom: '1px solid var(--gb)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <LogoIcon size={34} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--tx1)', lineHeight: 1.15, whiteSpace: 'nowrap' }}>SteelTrack</div>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.09em', whiteSpace: 'nowrap' }}>Logistics &amp; Dispatch</div>
          </div>
        </div>
        <button onClick={toggle} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: 'var(--g2)', border: '1px solid var(--gb)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--tx2)', transition: 'all 0.15s ease' }}>
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>

      <div style={{ padding: '0.85rem 0.9rem 0.3rem', fontSize: '0.6rem', fontWeight: 700, color: 'var(--tx4)', letterSpacing: '0.11em', textTransform: 'uppercase' }}>Navigation</div>

      <nav style={{ flex: 1, padding: '0.15rem 0.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {visibleNav.map(item => <SideNavItem key={item.to} item={item} onClose={onClose} />)}
      </nav>

      {user && pill && (
        <div style={{ padding: '0.55rem 0.5rem 0.55rem', borderTop: '1px solid var(--gb)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0.55rem 0.7rem', borderRadius: '0.6rem', background: 'var(--g1)', border: '1px solid var(--gb)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(140deg,#2dd4bf,#0d9488)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, color: '#07211e', boxShadow: '0 0 10px rgba(45,212,191,0.35)' }}>
              {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.80rem', fontWeight: 600, color: 'var(--tx1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>{user.name}</div>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, color: pill.color, marginTop: 2 }}>{pill.label}</div>
            </div>
            <button onClick={handleLogout} title="Sign Out"
              style={{ padding: '0.3rem 0.55rem', borderRadius: 6, flexShrink: 0, background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.22)', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.14s ease' }}>
              <LogOut size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const BottomTabBar = ({ visibleNav }: { visibleNav: typeof NAV_ITEMS }) => (
  <nav style={{ display: 'flex', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, background: 'var(--tab-bar-bg)', borderTop: '1px solid var(--gb)', backdropFilter: 'blur(20px)', paddingBottom: 'env(safe-area-inset-bottom)', minHeight: 58 }} className="lg-hide">
    {visibleNav.filter(i => i.to !== '/dashboard' && i.to !== '/master').slice(0, 5).map(item => (
      <NavLink key={item.to} to={item.to}
        style={({ isActive }) => ({ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '0.35rem 0', textDecoration: 'none', color: isActive ? 'var(--brand)' : 'var(--tx3)', fontSize: '0.58rem', fontWeight: 600, transition: 'color 0.14s', letterSpacing: '0.02em' })}
      >
        {({ isActive }) => (
          <>
            <span style={{ width: 38, height: 26, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? 'rgba(45,212,191,0.14)' : 'transparent', transition: 'background 0.14s' }}>
              <item.icon size={18} strokeWidth={isActive ? 2.3 : 1.7} />
            </span>
            <span style={{ textTransform: 'uppercase', fontSize: '0.55rem', letterSpacing: '0.04em' }}>{item.label}</span>
          </>
        )}
      </NavLink>
    ))}
  </nav>
)

export const AppLayout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const visibleNav = NAV_ITEMS.filter(n => user && n.roles.includes(user.role))

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{ width: 228, flexShrink: 0, borderRight: '1px solid var(--gb)', display: 'none' }} className="desktop-sidebar">
        <style>{`
          .desktop-sidebar { display:flex !important; flex-direction:column; }
          @media (max-width:1023px) {
            .desktop-sidebar { display:none !important; }
            .lg-hide { display:flex !important; }
          }
          @media (min-width:1024px) {
            .lg-hide { display:none !important; }
          }
        `}</style>
        {user && <Sidebar visibleNav={visibleNav} user={user} handleLogout={handleLogout} />}
      </aside>

      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.60)' }} onClick={() => setDrawerOpen(false)} />
          <aside style={{ position: 'relative', width: 240, height: '100%', borderRight: '1px solid var(--gb)', boxShadow: '6px 0 48px rgba(0,0,0,0.55)', zIndex: 1 }}>
            <button onClick={() => setDrawerOpen(false)}
              style={{ position: 'absolute', top: 13, right: 13, zIndex: 2, background: 'var(--g2)', border: '1px solid var(--gb)', borderRadius: 7, padding: 6, cursor: 'pointer', color: 'var(--tx2)', display: 'flex', alignItems: 'center' }}>
              <X size={15} />
            </button>
            {user && <Sidebar visibleNav={visibleNav} user={user} handleLogout={handleLogout} onClose={() => setDrawerOpen(false)} />}
          </aside>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ display: 'none', alignItems: 'center', gap: 10, padding: '0.6rem 1rem', borderBottom: '1px solid var(--gb)', background: 'var(--topbar-bg)', backdropFilter: 'blur(18px)', flexShrink: 0 }} className="mobile-topbar">
          <style>{`.mobile-topbar { display:none !important; } @media (max-width:1023px) { .mobile-topbar { display:flex !important; } }`}</style>
          <button onClick={() => setDrawerOpen(true)} style={{ background: 'var(--g2)', border: '1px solid var(--gb)', borderRadius: 8, padding: '6px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--tx1)' }}>
            <Menu size={18} />
          </button>
          <LogoIcon size={26} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--tx1)', whiteSpace: 'nowrap' }}>SteelTrack</div>
            <div style={{ fontSize: '0.57rem', color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>Logistics</div>
          </div>
          {user && (
            <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: '0.60rem', fontWeight: 700, padding: '0.22rem 0.55rem', borderRadius: 999, background: ROLE_PILL[user.role]?.bg ?? 'var(--g2)', color: ROLE_PILL[user.role]?.color ?? 'var(--tx1)', border: `1px solid ${ROLE_PILL[user.role]?.color ?? 'var(--gb)'}33` }}>
              {ROLE_PILL[user.role]?.label ?? user.role}
            </span>
          )}
        </header>
        <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 64 }}>
          <Outlet />
        </main>
      </div>

      <BottomTabBar visibleNav={visibleNav} />
    </div>
  )
}
