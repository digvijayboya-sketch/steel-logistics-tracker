import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { cls } from '@/lib/utils'
import {
  FileText, Briefcase, Factory,
  Receipt, Truck, BarChart3, LogOut, X, Sun, Moon,
  TrendingUp, AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { DEMO_DOS, DEMO_JOBS, DEMO_EXPENSES, DEMO_DELIVERIES } from '@/lib/demoData'
import { formatINR } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dos',        label: 'Orders',     icon: FileText,        roles: ['admin','planner','purchase'] },
  { to: '/jobs',       label: 'Jobs',       icon: Briefcase,       roles: ['admin','planner','agent'] },
  { to: '/queue',      label: 'SC Queue',   icon: Factory,         roles: ['admin','planner','agent'] },
  { to: '/expenses',   label: 'Expenses',   icon: Receipt,         roles: ['admin','planner','agent'] },
  { to: '/deliveries', label: 'Deliveries', icon: Truck,           roles: ['admin','planner','agent'] },
  { to: '/reports',    label: 'Reports',    icon: BarChart3,       roles: ['admin','planner','purchase'] },
]

const KPI_MAP: Record<string, string> = {
  '/dos':        'dos',
  '/jobs':       'jobs',
  '/queue':      'scqueue',
  '/expenses':   'expenses',
  '/deliveries': 'deliveries',
  '/reports':    'reports',
}

const ROLE_PILL: Record<string, { bg: string; text: string; label: string }> = {
  admin:    { bg: 'rgba(139,92,246,0.25)',  text: '#c4b5fd', label: 'Admin' },
  planner:  { bg: 'rgba(59,130,246,0.25)', text: '#93c5fd', label: 'Planner' },
  purchase: { bg: 'rgba(251,191,36,0.22)', text: '#fcd34d', label: 'Purchase' },
  agent:    { bg: 'rgba(45,212,191,0.22)', text: '#5eead4', label: 'Agent' },
}

/* ── Logo ─────────────────────────────────────────────────────── */
const Logo = ({ size = 34 }: { size?: number }) => (
  <div
    style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      background: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)',
      boxShadow: '0 0 18px rgba(45,212,191,0.50)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
  >
    <svg viewBox="0 0 24 24" fill="none" width={size * 0.56} height={size * 0.56}>
      <rect x="3"  y="3"  width="8" height="8" rx="1.5" fill="white" opacity="0.95"/>
      <rect x="13" y="3"  width="8" height="8" rx="1.5" fill="white" opacity="0.50"/>
      <rect x="3"  y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.50"/>
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.95"/>
    </svg>
  </div>
)

/* ── Theme toggle ────────────────────────────────────────────── */
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

const ThemeToggle = ({ compact = false }: { compact?: boolean }) => {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      className="flex items-center justify-center rounded-xl transition-all"
      style={{
        width: compact ? 34 : 36, height: compact ? 34 : 36,
        background: 'var(--g2)', border: '1px solid var(--gb)',
        color: 'var(--tx2)',
      }}
    >
      {theme === 'dark' ? <Sun size={compact ? 15 : 16} /> : <Moon size={compact ? 15 : 16} />}
    </button>
  )
}

/* ── Sidebar nav item ────────────────────────────────────────── */
const SideNavItem = ({ item, onClose }: { item: typeof NAV_ITEMS[0]; onClose?: () => void }) => (
  <NavLink
    to={item.to}
    onClick={onClose}
    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden"
    style={({ isActive }) => isActive
      ? { background: 'linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)', boxShadow: '0 4px 16px rgba(45,212,191,0.35)', color: '#0d2137' }
      : { color: 'var(--tx2)' }
    }
  >
    {({ isActive }) => (
      <>
        {!isActive && (
          <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'var(--g2)' }} />
        )}
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 relative z-10"
          style={{ background: isActive ? 'rgba(255,255,255,0.20)' : 'var(--g1)' }}
        >
          <item.icon size={16} />
        </span>
        <span className="flex-1 relative z-10">{item.label}</span>
        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0 relative z-10" />}
      </>
    )}
  </NavLink>
)

/* ── Sidebar content ────────────────────────────────────────── */
const SidebarContent = ({
  visibleNav, user, onClose, handleLogout
}: {
  visibleNav: typeof NAV_ITEMS;
  user: any;
  onClose?: () => void;
  handleLogout: () => void;
}) => {
  const pill = user ? ROLE_PILL[user.role] : null
  return (
    <div className="flex flex-col h-full">
      {/* Logo + theme toggle */}
      <div className="px-4 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--gb)' }}>
        <div className="flex items-center gap-3">
          <Logo size={36} />
          <div>
            <div className="text-base font-bold leading-tight" style={{ color: 'var(--tx1)' }}>SteelTrack</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--brand)' }}>Logistics</div>
          </div>
        </div>
        <ThemeToggle compact />
      </div>

      {/* Nav label */}
      <div className="px-4 pt-5 pb-1.5">
        <span className="section-label">Modules</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {visibleNav.map(item => (
          <SideNavItem key={item.to} item={item} onClose={onClose} />
        ))}
      </nav>

      {/* User footer */}
      {user && pill && (
        <div className="px-3 pb-4" style={{ borderTop: '1px solid var(--gb)', paddingTop: '0.75rem' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--g1)', border: '1px solid var(--gb)' }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2dd4bf, #0d9488)', color: '#0d2137', boxShadow: '0 0 12px rgba(45,212,191,0.40)' }}
            >
              {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--tx1)' }}>{user.name}</div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block"
                style={{ background: pill.bg, color: pill.text }}>{pill.label}</span>
            </div>
            <button onClick={handleLogout} title="Logout"
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--tx3)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--tx3)')}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Always-visible KPI Dashboard Strip ─────────────────────── */
const DashboardStrip = ({ user }: { user: any }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const isAgent = user?.role === 'agent'

  const activeDOs       = DEMO_DOS.filter(d => ['active','partially_dispatched'].includes(d.status))
  const activeJobs      = DEMO_JOBS.filter(j => !['delivered','cancelled'].includes(j.status))
  const pendingExpenses = DEMO_EXPENSES.filter(e => e.status === 'pending')
  const deliveriesToday = DEMO_DELIVERIES.length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  // determine which KPI is active based on current route
  const activeKpi = Object.entries(KPI_MAP).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] ?? null

  const kpis = [
    { id: 'dos',        val: activeDOs.length,       label: 'Active DOs',        change: '↑ 3 since yesterday', up: true,  path: '/dos' },
    { id: 'jobs',       val: activeJobs.length,      label: 'Jobs In Progress',  change: '↑ 1 new today',       up: true,  path: '/jobs' },
    { id: 'expenses',   val: pendingExpenses.length, label: 'Pending Expenses',  change: '↓ 2 approved',        up: false, path: '/expenses' },
    { id: 'deliveries', val: deliveriesToday,        label: 'Deliveries Today',  change: '↑ 5 completed',       up: true,  path: '/deliveries' },
    { id: 'scqueue',    val: 3,                      label: 'SC Queue',          change: '● 2 awaiting check-in', up: null, path: '/queue' },
  ]

  if (isAgent) return null

  return (
    <div
      style={{
        borderBottom: '1px solid var(--gb)',
        background: 'var(--topbar-bg)',
        backdropFilter: 'var(--blur-md)',
        WebkitBackdropFilter: 'var(--blur-md)',
        flexShrink: 0,
      }}
    >
      {/* Greeting row */}
      <div style={{ padding: '1rem 1.5rem 0.5rem' }}>
        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--tx1)', lineHeight: 1.2 }}>
          Good {greeting},{' '}
          <span style={{
            background: 'linear-gradient(135deg, #2dd4bf, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {user?.name?.split(' ')[0]} 👋
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--tx3)', marginTop: 2 }}>
          Live operations overview — click a metric to open that module.
        </div>
      </div>

      {/* KPI cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(150px, 100%), 1fr))',
        gap: '0.6rem',
        padding: '0 1.25rem 1rem',
      }}>
        {kpis.map(k => {
          const isActive = activeKpi === k.id
          return (
            <button
              key={k.id}
              onClick={() => navigate(k.path)}
              style={{
                textAlign: 'left',
                padding: '0.75rem 0.9rem',
                borderRadius: '0.75rem',
                background: isActive ? 'rgba(45,212,191,0.10)' : 'var(--g1)',
                border: isActive ? '1px solid rgba(45,212,191,0.45)' : '1px solid var(--gb)',
                boxShadow: isActive ? '0 4px 20px rgba(45,212,191,0.14)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.18s',
                color: 'inherit',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--g2)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(45,212,191,0.28)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--g1)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--gb)'
                }
              }}
            >
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2dd4bf', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {k.val}
              </div>
              <div style={{ fontSize: '0.63rem', color: 'var(--tx3)', marginTop: 3 }}>{k.label}</div>
              <div style={{
                fontSize: '0.6rem', marginTop: 4, fontWeight: 500,
                color: k.up === true ? '#34d399' : k.up === false ? '#f87171' : '#fbbf24',
              }}>
                {k.change}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Bottom tab bar (mobile) ─────────────────────────────────── */
const BottomTabBar = ({ visibleNav }: { visibleNav: typeof NAV_ITEMS }) => (
  <nav
    className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch"
    style={{
      background: 'var(--tab-bar-bg)',
      backdropFilter: 'var(--blur-md)', WebkitBackdropFilter: 'var(--blur-md)',
      borderTop: '1px solid var(--gb)',
      paddingBottom: 'env(safe-area-inset-bottom)', minHeight: 60,
    }}
  >
    {visibleNav.slice(0, 5).map(item => (
      <NavLink key={item.to} to={item.to}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all"
        style={({ isActive }) => ({ color: isActive ? 'var(--brand)' : 'var(--tx3)' })}
      >
        {({ isActive }) => (
          <>
            <span className="flex items-center justify-center w-9 h-7 rounded-xl transition-all"
              style={isActive ? { background: 'var(--brand-subtle)', boxShadow: '0 0 12px var(--brand-glow)' } : {}}>
              <item.icon size={19} strokeWidth={isActive ? 2.2 : 1.7} />
            </span>
            <span className="text-[10px] font-semibold" style={{ letterSpacing: '0.02em' }}>{item.label}</span>
          </>
        )}
      </NavLink>
    ))}
  </nav>
)

/* ── AppLayout ───────────────────────────────────────────────── */
export const AppLayout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { theme, toggle } = useTheme()

  const handleLogout = () => { logout(); navigate('/login') }
  const visibleNav = NAV_ITEMS.filter(n => user && n.roles.includes(user.role))

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0"
        style={{ background: 'var(--sidebar-bg)', backdropFilter: 'var(--blur-lg)', WebkitBackdropFilter: 'var(--blur-lg)', borderRight: '1px solid var(--gb)' }}>
        {user && <SidebarContent visibleNav={visibleNav} user={user} handleLogout={handleLogout} />}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-72 h-full"
            style={{ background: 'var(--sidebar-bg)', backdropFilter: 'var(--blur-lg)', WebkitBackdropFilter: 'var(--blur-lg)', borderRight: '1px solid var(--gb)', boxShadow: '4px 0 48px rgba(0,0,0,0.40)' }}>
            <button onClick={() => setDrawerOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg" style={{ color: 'var(--tx2)' }}>
              <X size={18} />
            </button>
            {user && <SidebarContent visibleNav={visibleNav} user={user} onClose={() => setDrawerOpen(false)} handleLogout={handleLogout} />}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: 'var(--topbar-bg)', backdropFilter: 'var(--blur-md)', WebkitBackdropFilter: 'var(--blur-md)', borderBottom: '1px solid var(--gb)' }}>
          <button onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl flex flex-col gap-1.5 transition"
            style={{ background: 'var(--g2)' }} aria-label="Open menu">
            <span style={{ display:'block', width:18, height:2, borderRadius:2, background:'var(--tx1)' }} />
            <span style={{ display:'block', width:13, height:2, borderRadius:2, background:'var(--tx1)' }} />
            <span style={{ display:'block', width:18, height:2, borderRadius:2, background:'var(--tx1)' }} />
          </button>
          <Logo size={28} />
          <div>
            <div className="text-sm font-bold leading-tight" style={{ color: 'var(--tx1)' }}>SteelTrack</div>
            <div className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--brand)' }}>Logistics</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle compact />
            {user && (
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: ROLE_PILL[user.role]?.bg, color: ROLE_PILL[user.role]?.text }}>
                {ROLE_PILL[user.role]?.label}
              </span>
            )}
          </div>
        </header>

        {/* ── ALWAYS-VISIBLE DASHBOARD KPI STRIP ── */}
        <DashboardStrip user={user} />

        {/* Page content renders below the dashboard */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <BottomTabBar visibleNav={visibleNav} />
    </div>
  )
}
