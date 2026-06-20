import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/appStore'
import { toast } from 'sonner'

/* ─── Demo credentials ──────────────────────────────────────────────────── */
const QUICK_LOGINS = [
  { role: 'Admin',    email: 'admin@steelco.in',    password: 'admin123' },
  { role: 'Planner',  email: 'planner@steelco.in',  password: 'steel123' },
  { role: 'Purchase', email: 'purchase@steelco.in', password: 'steel123' },
  { role: 'Agent',    email: 'agent1@steelco.in',   password: 'agent123' },
]

const FEATURES = [
  { icon: '📋', label: 'DO Management',     desc: 'Full lifecycle from supplier to customer' },
  { icon: '🏭', label: 'SC Queue Tracker',  desc: 'Live service centre status & queue position' },
  { icon: '💸', label: 'Field Expense Log', desc: 'Photo-tagged cash payment reconciliation' },
  { icon: '🚛', label: 'Delivery Tracker',  desc: 'Real-time route & location change log' },
]

const STATS = [
  { value: '100%', label: 'DO Traceability' },
  { value: '0 ₹', label: 'Untracked Spend' },
  { value: 'Live', label: 'SC Queue View' },
]

/* ─── Eye icon ──────────────────────────────────────────────────────────── */
const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )

/* ─── Component ─────────────────────────────────────────────────────────── */
export const LoginPage = () => {
  const { login } = useAuthStore()
  const navigate   = useNavigate()

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [success,    setSuccess]    = useState(false)
  const [error,      setError]      = useState('')
  const [activeRole, setActiveRole] = useState<string | null>(null)

  /* ── Auth logic ── */
  const attemptLogin = (em: string, pw: string) => {
    setLoading(true)
    setError('')
    setTimeout(() => {
      const ok = login(em, pw)
      setLoading(false)
      if (ok) {
        setSuccess(true)
        setTimeout(() => navigate('/dashboard'), 600)
      } else {
        setError('Invalid email or password. Try a quick demo login below.')
        toast.error('Invalid credentials')
      }
    }, 450)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    attemptLogin(email, password)
  }

  const quickLogin = (ql: typeof QUICK_LOGINS[0]) => {
    setActiveRole(ql.role)
    setEmail(ql.email)
    setPassword(ql.password)
    attemptLogin(ql.email, ql.password)
  }

  /* ── Styles ── */
  const s: Record<string, React.CSSProperties> = {
    /* page */
    page: {
      minHeight: '100dvh',
      display: 'flex',
      background: 'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(45,212,191,.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(99,102,241,.14) 0%, transparent 55%), #0b0f1a',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden',
    },
    /* ── LEFT HERO ── */
    hero: {
      flex: 1,
      display: 'none',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      padding: '3rem 3.5rem',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    heroInner: {
      position: 'relative' as const,
      zIndex: 1,
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.3rem 0.85rem',
      borderRadius: '9999px',
      background: 'rgba(45,212,191,.12)',
      border: '1px solid rgba(45,212,191,.25)',
      color: '#2dd4bf',
      fontSize: '0.72rem',
      fontWeight: 600,
      letterSpacing: '.05em',
      textTransform: 'uppercase' as const,
      marginBottom: '1.5rem',
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: '#2dd4bf',
      animation: 'pulse 2s infinite',
    },
    heroTitle: {
      fontSize: 'clamp(2rem, 3vw, 2.8rem)',
      fontWeight: 800,
      lineHeight: 1.15,
      color: '#f1f5f9',
      marginBottom: '1rem',
    },
    heroAccent: {
      background: 'linear-gradient(135deg, #2dd4bf, #6366f1)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    heroSub: {
      fontSize: '1rem',
      color: 'rgba(241,245,249,.55)',
      lineHeight: 1.65,
      maxWidth: '380px',
      marginBottom: '2rem',
    },
    statRow: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap' as const,
      marginBottom: '2.5rem',
    },
    stat: {
      padding: '0.45rem 1rem',
      borderRadius: '9999px',
      background: 'rgba(255,255,255,.05)',
      border: '1px solid rgba(255,255,255,.1)',
      display: 'flex',
      gap: '0.4rem',
      alignItems: 'baseline',
    },
    statVal: { color: '#2dd4bf', fontWeight: 700, fontSize: '0.85rem' },
    statLbl: { color: 'rgba(241,245,249,.45)', fontSize: '0.72rem' },
    featureList: { display: 'flex', flexDirection: 'column' as const, gap: '0.85rem' },
    featureItem: {
      display: 'flex',
      gap: '0.85rem',
      alignItems: 'flex-start',
      padding: '0.75rem 1rem',
      borderRadius: '0.75rem',
      background: 'rgba(255,255,255,.03)',
      border: '1px solid rgba(255,255,255,.06)',
      backdropFilter: 'blur(4px)',
    },
    featureIcon: { fontSize: '1.15rem', lineHeight: 1, flexShrink: 0, marginTop: 2 },
    featureName: { fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 2 },
    featureDesc: { fontSize: '0.73rem', color: 'rgba(241,245,249,.4)', lineHeight: 1.4 },
    /* orbs */
    orb1: {
      position: 'absolute' as const, top: '-10%', right: '-5%',
      width: 320, height: 320, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(99,102,241,.25) 0%, transparent 70%)',
      filter: 'blur(40px)', pointerEvents: 'none' as const,
    },
    orb2: {
      position: 'absolute' as const, bottom: '10%', left: '-8%',
      width: 260, height: 260, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(45,212,191,.2) 0%, transparent 70%)',
      filter: 'blur(40px)', pointerEvents: 'none' as const,
    },
    /* ── RIGHT PANEL ── */
    right: {
      width: '100%',
      maxWidth: 460,
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      margin: '0 auto',
    },
    glass: {
      background: 'rgba(255,255,255,.04)',
      border: '1px solid rgba(255,255,255,.09)',
      borderRadius: '1.25rem',
      backdropFilter: 'blur(20px)',
      padding: '2rem',
      boxShadow: '0 24px 64px rgba(0,0,0,.45)',
    },
    logoWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.7rem',
      marginBottom: '1.75rem',
    },
    logoBox: {
      width: 42, height: 42,
      borderRadius: '0.75rem',
      background: 'linear-gradient(135deg, #2dd4bf, #0d9488)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 14px rgba(45,212,191,.35)',
      flexShrink: 0,
    },
    logoText: { lineHeight: 1 },
    appName: { fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9' },
    appSub:  { fontSize: '0.72rem', color: 'rgba(241,245,249,.45)', marginTop: 1 },
    sectionTitle: {
      fontSize: '0.7rem',
      fontWeight: 600,
      letterSpacing: '.07em',
      textTransform: 'uppercase' as const,
      color: 'rgba(241,245,249,.35)',
      marginBottom: '0.6rem',
    },
    roleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: '0.4rem',
      marginBottom: '1.5rem',
    },
    roleChip: (active: boolean): React.CSSProperties => ({
      padding: '0.45rem 0',
      borderRadius: '0.5rem',
      border: active ? '1px solid rgba(45,212,191,.5)' : '1px solid rgba(255,255,255,.08)',
      background: active ? 'rgba(45,212,191,.12)' : 'rgba(255,255,255,.04)',
      color: active ? '#2dd4bf' : 'rgba(241,245,249,.55)',
      fontSize: '0.72rem',
      fontWeight: 600,
      cursor: 'pointer',
      textAlign: 'center' as const,
      transition: 'all .18s ease',
    }),
    label: {
      display: 'block',
      fontSize: '0.75rem',
      fontWeight: 500,
      color: 'rgba(241,245,249,.6)',
      marginBottom: '0.35rem',
    },
    input: {
      width: '100%',
      padding: '0.65rem 0.9rem',
      borderRadius: '0.65rem',
      border: '1px solid rgba(255,255,255,.1)',
      background: 'rgba(255,255,255,.05)',
      color: '#f1f5f9',
      fontSize: '0.88rem',
      outline: 'none',
      transition: 'border .18s',
      boxSizing: 'border-box' as const,
    },
    pwWrap: { position: 'relative' as const },
    eyeBtn: {
      position: 'absolute' as const,
      right: '0.75rem',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      padding: 0,
      color: 'rgba(241,245,249,.35)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
    },
    errorBox: {
      padding: '0.65rem 0.9rem',
      borderRadius: '0.65rem',
      background: 'rgba(239,68,68,.1)',
      border: '1px solid rgba(239,68,68,.25)',
      color: '#fca5a5',
      fontSize: '0.78rem',
      lineHeight: 1.45,
    },
    signInBtn: (loading: boolean, success: boolean): React.CSSProperties => ({
      width: '100%',
      padding: '0.75rem',
      borderRadius: '0.7rem',
      border: 'none',
      background: success
        ? 'linear-gradient(135deg,#22c55e,#16a34a)'
        : 'linear-gradient(135deg,#2dd4bf,#0d9488)',
      color: '#fff',
      fontSize: '0.88rem',
      fontWeight: 700,
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.75 : 1,
      transition: 'all .2s ease',
      boxShadow: '0 4px 16px rgba(45,212,191,.3)',
      letterSpacing: '.02em',
      position: 'relative' as const,
      overflow: 'hidden',
    }),
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      margin: '1.25rem 0 0.75rem',
    },
    divLine: { flex: 1, height: 1, background: 'rgba(255,255,255,.07)' },
    divText: { fontSize: '0.68rem', color: 'rgba(241,245,249,.28)', whiteSpace: 'nowrap' as const, textTransform: 'uppercase' as const, letterSpacing: '.06em' },
    demoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,1fr)',
      gap: '0.45rem',
    },
    demoBtn: (active: boolean): React.CSSProperties => ({
      padding: '0.55rem',
      borderRadius: '0.6rem',
      border: active ? '1px solid rgba(45,212,191,.4)' : '1px solid rgba(255,255,255,.07)',
      background: active ? 'rgba(45,212,191,.08)' : 'rgba(255,255,255,.03)',
      cursor: 'pointer',
      textAlign: 'left' as const,
      transition: 'all .16s',
    }),
    demoBtnRole: { fontSize: '0.73rem', fontWeight: 600, color: '#e2e8f0', display: 'block' },
    demoBtnEmail: { fontSize: '0.65rem', color: 'rgba(241,245,249,.35)', display: 'block', marginTop: 1 },
    footer: {
      textAlign: 'center' as const,
      fontSize: '0.68rem',
      color: 'rgba(241,245,249,.2)',
      marginTop: '1.25rem',
    },
  }

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes shimmer {
          0%{background-position:-200% 0}
          100%{background-position:200% 0}
        }
        .login-input:focus {
          border-color: rgba(45,212,191,.55) !important;
          box-shadow: 0 0 0 3px rgba(45,212,191,.1);
        }
        .role-chip:hover { transform: translateY(-1px); }
        .demo-btn:hover { transform: translateY(-1px); border-color: rgba(45,212,191,.3) !important; }
        .sign-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(45,212,191,.4) !important; }
        @media (min-width:860px) {
          .login-hero  { display:flex !important; }
          .login-right { margin:0 !important; border-left: 1px solid rgba(255,255,255,.05); }
        }
      `}</style>

      <div style={s.page}>
        {/* ── LEFT HERO ── */}
        <div style={s.hero} className="login-hero">
          <div style={s.orb1} />
          <div style={s.orb2} />
          <div style={s.heroInner}>
            <div style={s.badge}>
              <span style={s.dot} />
              Live Operations
            </div>
            <h1 style={s.heroTitle}>
              Track every coil.<br />
              <span style={s.heroAccent}>End-to-end.</span>
            </h1>
            <p style={s.heroSub}>
              From supplier Delivery Order to final customer drop — one platform for your
              entire steel logistics operation.
            </p>
            <div style={s.statRow}>
              {STATS.map(st => (
                <div key={st.label} style={s.stat}>
                  <span style={s.statVal}>{st.value}</span>
                  <span style={s.statLbl}>{st.label}</span>
                </div>
              ))}
            </div>
            <div style={s.featureList}>
              {FEATURES.map(f => (
                <div key={f.label} style={s.featureItem}>
                  <span style={s.featureIcon}>{f.icon}</span>
                  <div>
                    <div style={s.featureName}>{f.label}</div>
                    <div style={s.featureDesc}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={s.right} className="login-right">
          <div style={s.glass}>
            {/* Logo */}
            <div style={s.logoWrap}>
              <div style={s.logoBox}>
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                  <rect x="3" y="3" width="8" height="8" rx="1.5" fill="white" opacity="0.9"/>
                  <rect x="13" y="3" width="8" height="8" rx="1.5" fill="white" opacity="0.55"/>
                  <rect x="3" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.55"/>
                  <rect x="13" y="13" width="8" height="8" rx="1.5" fill="white" opacity="0.9"/>
                </svg>
              </div>
              <div style={s.logoText}>
                <div style={s.appName}>SteelTrack</div>
                <div style={s.appSub}>Logistics & Dispatch Tracker</div>
              </div>
            </div>

            {/* Role selector */}
            <div style={s.sectionTitle}>Sign in as</div>
            <div style={s.roleGrid}>
              {QUICK_LOGINS.map(ql => (
                <button
                  key={ql.role}
                  className="role-chip"
                  style={s.roleChip(activeRole === ql.role)}
                  onClick={() => quickLogin(ql)}
                  type="button"
                >
                  {ql.role}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={s.label}>Email</label>
                <input
                  className="login-input"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={s.input}
                />
              </div>
              <div>
                <label style={s.label}>Password</label>
                <div style={s.pwWrap}>
                  <input
                    className="login-input"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ ...s.input, paddingRight: '2.5rem' }}
                  />
                  <button type="button" style={s.eyeBtn} onClick={() => setShowPw(v => !v)} aria-label="Toggle password">
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>

              {error && <div style={s.errorBox}>{error}</div>}

              <button
                type="submit"
                className="sign-btn"
                disabled={loading || success}
                style={s.signInBtn(loading, success)}
              >
                {success ? '✓ Redirecting…' : loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>

            {/* Quick demo */}
            <div style={s.divider}>
              <div style={s.divLine} />
              <span style={s.divText}>Quick demo access</span>
              <div style={s.divLine} />
            </div>
            <div style={s.demoGrid}>
              {QUICK_LOGINS.map(ql => (
                <button
                  key={ql.role}
                  className="demo-btn"
                  style={s.demoBtn(activeRole === ql.role)}
                  onClick={() => quickLogin(ql)}
                  type="button"
                >
                  <span style={s.demoBtnRole}>{ql.role}</span>
                  <span style={s.demoBtnEmail}>{ql.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={s.footer}>
            Steel Logistics & Dispatch Tracker v1.0 · Demo Mode
          </div>
        </div>
      </div>
    </>
  )
}
