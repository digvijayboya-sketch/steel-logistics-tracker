import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { DEMO_DOS, DEMO_JOBS, DEMO_EXPENSES, DEMO_DELIVERIES } from '@/lib/demoData'
import { formatINR } from '@/lib/utils'

const ROLE_PILL: Record<string, { bg: string; text: string; label: string }> = {
  admin:    { bg: 'rgba(139,92,246,0.25)',  text: '#c4b5fd', label: 'Admin' },
  planner:  { bg: 'rgba(59,130,246,0.25)', text: '#93c5fd', label: 'Planner' },
  purchase: { bg: 'rgba(251,191,36,0.22)', text: '#fcd34d', label: 'Purchase' },
  agent:    { bg: 'rgba(45,212,191,0.22)', text: '#5eead4', label: 'Delivery Agent' },
  manager:  { bg: 'rgba(16,185,129,0.22)', text: '#6ee7b7', label: 'Manager' },
}

const C = {
  brand: '#2dd4bf', brandD: '#0d9488',
  blue: '#3b82f6', purple: '#8b5cf6',
  amber: '#f59e0b', green: '#10b981', red: '#ef4444',
}

export const DashboardPage = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const activeDOs       = DEMO_DOS.filter(d => ['active','partially_dispatched'].includes(d.status))
  const activeJobs      = DEMO_JOBS.filter(j => !['delivered','cancelled'].includes(j.status))
  const pendingExpenses = DEMO_EXPENSES.filter(e => e.status === 'pending')
  const deliveriesToday = DEMO_DELIVERIES.length
  const scQueue         = 3

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateStr  = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  const pill = user ? ROLE_PILL[user.role] ?? ROLE_PILL['admin'] : null

  const kpis = [
    {
      val: activeDOs.length,
      label: 'Active DOs',
      change: '↑ 3 since yesterday',
      up: true,
      path: '/dos',
      grad: `linear-gradient(135deg, ${C.blue}22 0%, transparent 60%)`,
      accent: C.blue,
    },
    {
      val: activeJobs.length,
      label: 'Jobs In Progress',
      change: '↑ 1 new today',
      up: true,
      path: '/jobs',
      grad: `linear-gradient(135deg, ${C.brand}22 0%, transparent 60%)`,
      accent: C.brand,
    },
    {
      val: pendingExpenses.length,
      label: 'Pending Expenses',
      change: '↓ 2 approved',
      up: false,
      path: '/expenses',
      grad: `linear-gradient(135deg, ${C.red}1a 0%, transparent 60%)`,
      accent: C.red,
    },
    {
      val: deliveriesToday,
      label: 'Deliveries Today',
      change: '↑ 5 completed',
      up: true,
      path: '/deliveries',
      grad: `linear-gradient(135deg, ${C.green}1a 0%, transparent 60%)`,
      accent: C.green,
    },
    {
      val: scQueue,
      label: 'SC Queue',
      change: '● 2 awaiting check-in',
      up: null,
      path: '/queue',
      grad: `linear-gradient(135deg, ${C.amber}1a 0%, transparent 60%)`,
      accent: C.amber,
    },
  ]

  return (
    <div style={{
      minHeight: '100%',
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Top breadcrumb bar ───────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.75rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.01em' }}>
          <span>SteelTrack</span>
          <span style={{ margin: '0 0.4rem' }}>›</span>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {pill && (
            <span style={{
              fontSize: '0.68rem', fontWeight: 700,
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              background: pill.bg,
              color: pill.text,
              border: `1px solid ${pill.text}44`,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              {pill.label}
            </span>
          )}
          <span style={{
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.45)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '0.5rem',
            padding: '0.28rem 0.7rem',
          }}>
            {dateStr}
          </span>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '2rem 1.75rem', overflowY: 'auto' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{
            fontSize: 'clamp(1.4rem, 3vw, 1.9rem)',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.95)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            margin: 0,
          }}>
            {greeting},{' '}
            <span style={{
              background: 'linear-gradient(135deg, #2dd4bf 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {user?.name?.split(' ')[0]}
            </span>{' '}👋
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.35rem' }}>
            Live operations overview — click any metric or select a module from the sidebar.
          </p>
        </div>

        {/* KPI grid — mirrors Image 2 exactly */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))',
          gap: '1rem',
          maxWidth: '900px',
        }}>
          {kpis.map(k => (
            <button
              key={k.path}
              onClick={() => navigate(k.path)}
              style={{
                textAlign: 'left',
                padding: '1.4rem 1.5rem',
                borderRadius: '1rem',
                background: `rgba(255,255,255,0.04)`,
                backgroundImage: k.grad,
                border: '1px solid rgba(255,255,255,0.08)',
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
                el.style.background = `rgba(255,255,255,0.07)`
                el.style.transform = 'translateY(-2px)'
                el.style.boxShadow = `0 8px 28px ${k.accent}22`
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(255,255,255,0.08)'
                el.style.background = 'rgba(255,255,255,0.04)'
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = 'none'
              }}
            >
              {/* Accent glow top-right */}
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 80, height: 80, borderRadius: '50%',
                background: `radial-gradient(circle, ${k.accent}33 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              {/* Value */}
              <div style={{
                fontSize: 'clamp(2rem, 4vw, 2.6rem)',
                fontWeight: 800,
                color: k.accent,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.03em',
              }}>
                {k.val}
              </div>

              {/* Label */}
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.50)',
                marginTop: '0.45rem',
                fontWeight: 500,
              }}>
                {k.label}
              </div>

              {/* Change */}
              <div style={{
                fontSize: '0.68rem',
                marginTop: '0.6rem',
                fontWeight: 600,
                color: k.up === true
                  ? '#34d399'
                  : k.up === false
                  ? '#f87171'
                  : '#fbbf24',
              }}>
                {k.change}
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <p style={{
          marginTop: '2rem',
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.18)',
          letterSpacing: '0.01em',
        }}>
          Steel Logistics &amp; Dispatch Tracker v1.0 · steeltrack.in
        </p>
      </div>
    </div>
  )
}
