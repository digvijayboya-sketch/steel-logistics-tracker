import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { DEMO_DOS, DEMO_JOBS, DEMO_EXPENSES, DEMO_DELIVERIES } from '@/lib/demoData'

const ROLE_PILL: Record<string, { bg: string; color: string; label: string }> = {
  admin:    { bg: 'rgba(167,139,250,0.16)', color: '#c4b5fd', label: 'Admin' },
  planner:  { bg: 'rgba(96,165,250,0.16)',  color: '#93c5fd', label: 'Planner' },
  purchase: { bg: 'rgba(251,191,36,0.16)',  color: '#fcd34d', label: 'Purchase' },
  agent:    { bg: 'rgba(45,212,191,0.16)',  color: '#5eead4', label: 'Delivery Agent' },
  manager:  { bg: 'rgba(52,211,153,0.16)',  color: '#6ee7b7', label: 'Manager' },
}

const ACCENTS = {
  blue:   '#60a5fa',
  brand:  '#2dd4bf',
  red:    '#f87171',
  green:  '#34d399',
  amber:  '#fbbf24',
}

const QuickAction = ({ label, to, nav }: { label: string; to: string; nav: ReturnType<typeof useNavigate> }) => (
  <button
    onClick={() => nav(to)}
    style={{
      padding: '0.48rem 0.9rem',
      borderRadius: '0.5rem',
      background: 'var(--g2)',
      border: '1px solid var(--gb)',
      color: 'var(--tx2)',
      fontSize: '0.78rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.14s ease',
      whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--g3)'; (e.currentTarget as HTMLElement).style.color = 'var(--tx1)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--g2)'; (e.currentTarget as HTMLElement).style.color = 'var(--tx2)'; }}
  >
    {label}
  </button>
)

export const DashboardPage = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const activeDOs       = DEMO_DOS.filter(d => ['active','partially_dispatched'].includes(d.status))
  const activeJobs      = DEMO_JOBS.filter(j => !['delivered','cancelled'].includes(j.status))
  const pendingExpenses = DEMO_EXPENSES.filter(e => e.status === 'pending')
  const deliveriesToday = DEMO_DELIVERIES.length

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr  = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
  const pill     = user ? ROLE_PILL[user.role] ?? ROLE_PILL['admin'] : null

  const kpis = [
    { val: activeDOs.length,       label: 'Active DOs',       sub: '↑ 3 since yesterday',    up: true,  path: '/dos',        accent: ACCENTS.blue,  icon: '📋', cta: 'View Orders' },
    { val: activeJobs.length,      label: 'Jobs In Progress', sub: '↑ 1 new today',          up: true,  path: '/jobs',       accent: ACCENTS.brand, icon: '🏭', cta: 'View Jobs' },
    { val: pendingExpenses.length, label: 'Pending Expenses', sub: '↓ 2 approved today',     up: false, path: '/expenses',   accent: ACCENTS.red,   icon: '💸', cta: 'Review' },
    { val: deliveriesToday,        label: 'Deliveries Today', sub: '↑ 5 completed',          up: true,  path: '/deliveries', accent: ACCENTS.green, icon: '🚛', cta: 'View Deliveries' },
    { val: 3,                      label: 'SC Queue',         sub: '● 2 awaiting check-in',  up: null,  path: '/queue',      accent: ACCENTS.amber, icon: '🏗️', cta: 'View Queue' },
  ]

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Breadcrumb bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.875rem 1.75rem',
        borderBottom: '1px solid var(--gb)',
        flexShrink: 0, flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <nav className="breadcrumb">
          <span>SteelTrack</span>
          <span className="sep">›</span>
          <span className="active">Dashboard</span>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          {pill && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700,
              padding: '0.26rem 0.65rem', borderRadius: '999px',
              background: pill.bg, color: pill.color,
              border: `1px solid ${pill.color}44`,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              {pill.label}
            </span>
          )}
          <span style={{
            fontSize: '0.72rem', color: 'var(--tx3)',
            background: 'var(--g1)', border: '1px solid var(--gb)',
            borderRadius: '0.45rem', padding: '0.26rem 0.65rem',
            whiteSpace: 'nowrap',
          }}>
            {dateStr}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, padding: '1.75rem', overflowY: 'auto' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{
            fontSize: 'clamp(1.45rem, 3vw, 1.875rem)',
            fontWeight: 800, letterSpacing: '-0.025em',
            lineHeight: 1.2, margin: 0, color: 'var(--tx1)',
          }}>
            {greeting},{' '}
            <span style={{
              background: 'linear-gradient(135deg,#2dd4bf 0%,#6366f1 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {user?.name?.split(' ')[0]}
            </span>
            {' '}👋
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--tx3)', marginTop: '0.3rem', lineHeight: 1.55 }}>
            Live operations overview — click any card or choose a module from the sidebar.
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <QuickAction label="＋ New DO"       to="/dos/new"        nav={navigate} />
          <QuickAction label="＋ New Job"      to="/jobs/new"       nav={navigate} />
          <QuickAction label="Log Delivery"   to="/deliveries/log" nav={navigate} />
          <QuickAction label="Log Expense"    to="/expenses/log"   nav={navigate} />
          <QuickAction label="View Reports"   to="/reports"        nav={navigate} />
        </div>

        {/* KPI grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px,100%), 1fr))',
          gap: '0.9rem',
          maxWidth: 960,
        }} className="stagger">
          {kpis.map(k => (
            <button
              key={k.path}
              onClick={() => navigate(k.path)}
              className="fade-in"
              style={{
                textAlign: 'left',
                padding: '1.25rem 1.35rem 1.1rem',
                borderRadius: '0.9rem',
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                color: 'inherit',
                fontFamily: 'inherit',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = `${k.accent}55`
                el.style.transform = 'translateY(-3px)'
                el.style.boxShadow = `0 10px 32px ${k.accent}1e`
                el.style.background = 'var(--g3)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--card-border)'
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = 'none'
                el.style.background = 'var(--card-bg)'
              }}
            >
              {/* Glow orb */}
              <div style={{
                position: 'absolute', top: -24, right: -24,
                width: 80, height: 80, borderRadius: '50%',
                background: `radial-gradient(circle,${k.accent}28 0%,transparent 70%)`,
                pointerEvents: 'none',
              }} />

              {/* Icon */}
              <div style={{ fontSize: '1.35rem', marginBottom: '0.55rem', lineHeight: 1 }}>{k.icon}</div>

              {/* Value */}
              <div style={{
                fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 800,
                color: k.accent, lineHeight: 1,
                fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.035em',
              }}>
                {k.val}
              </div>

              {/* Label */}
              <div style={{ fontSize: '0.78rem', color: 'var(--tx2)', marginTop: '0.4rem', fontWeight: 500 }}>
                {k.label}
              </div>

              {/* Change */}
              <div style={{
                fontSize: '0.70rem', marginTop: '0.4rem', fontWeight: 600,
                color: k.up === true ? '#34d399' : k.up === false ? '#f87171' : '#fbbf24',
              }}>
                {k.sub}
              </div>

              {/* CTA */}
              <div style={{ fontSize: '0.68rem', color: k.accent, marginTop: '0.75rem', fontWeight: 700, letterSpacing: '0.01em' }}>
                {k.cta} →
              </div>
            </button>
          ))}
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.68rem', color: 'var(--tx4)', letterSpacing: '0.01em' }}>
          Steel Logistics &amp; Dispatch Tracker v1.0 · steeltrack.in
        </p>
      </div>
    </div>
  )
}
